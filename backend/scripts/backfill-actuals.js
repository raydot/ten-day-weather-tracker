const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const axios = require('axios');
const { pool } = require('../src/db/postgres');

const CITY_COORDS = {
  'San Francisco': { lat: 37.7749, lon: -122.4194 },
  'New York':      { lat: 40.7128, lon: -74.0060 },
  'Chicago':       { lat: 41.8781, lon: -87.6298 },
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

// One API call covers the full date range for a city.
async function fetchOpenMeteo(lat, lon, startDate, endDate) {
  const response = await axios.get('https://archive-api.open-meteo.com/v1/archive', {
    params: {
      latitude: lat,
      longitude: lon,
      start_date: startDate,
      end_date: endDate,
      hourly: 'temperature_2m',
      temperature_unit: 'fahrenheit',
      timezone: 'UTC',
    },
  });
  return response.data;
}

// Returns a Map from "YYYY-MM-DDTHH:MM" (UTC) -> temperature_2m (°F).
function buildHourlyMap(data) {
  const map = new Map();
  const times = data.hourly.time;
  const temps = data.hourly.temperature_2m;
  for (let i = 0; i < times.length; i++) {
    if (temps[i] !== null && temps[i] !== undefined) {
      map.set(times[i], temps[i]);
    }
  }
  return map;
}

// Collects the up-to-12 hourly readings starting at forecast_timestamp (UTC).
function extract12HourWindow(hourlyMap, forecastTimestamp) {
  const start = new Date(forecastTimestamp);
  start.setMinutes(0, 0, 0);

  const temps = [];
  for (let h = 0; h < 12; h++) {
    const t = new Date(start.getTime() + h * 60 * 60 * 1000);
    const key = t.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
    const temp = hourlyMap.get(key);
    if (temp !== undefined) temps.push(temp);
  }
  return temps;
}

async function backfill() {
  const { rows } = await pool.query(`
    SELECT id, city, forecast_timestamp, temperature, is_daytime
    FROM forecasts
    WHERE forecast_timestamp < NOW()
      AND actual_temperature IS NULL
    ORDER BY city, forecast_timestamp
  `);

  console.log(`Found ${rows.length} rows to backfill`);

  if (rows.length === 0) {
    console.log('Nothing to do.');
    await pool.end();
    return;
  }

  // Group by city so we fetch one Open-Meteo response per city (covering its full date range).
  const byCity = new Map();
  for (const row of rows) {
    if (!byCity.has(row.city)) byCity.set(row.city, []);
    byCity.get(row.city).push(row);
  }

  let updated = 0;
  let skipped = 0;
  let rowIndex = 0;

  for (const [city, cityRows] of byCity) {
    const coords = CITY_COORDS[city];

    if (!coords) {
      console.log(`[SKIP] No coordinates mapped for city: ${city} (${cityRows.length} rows)`);
      skipped += cityRows.length;
      rowIndex += cityRows.length;
      continue;
    }

    const timestamps = cityRows.map(r => new Date(r.forecast_timestamp).getTime());
    const startDate = toDateString(new Date(Math.min(...timestamps)));
    const endDate   = toDateString(new Date(Math.max(...timestamps)));

    console.log(`\nFetching Open-Meteo for ${city}: ${startDate} → ${endDate} (${cityRows.length} rows)`);

    let hourlyMap;
    try {
      const data = await fetchOpenMeteo(coords.lat, coords.lon, startDate, endDate);
      hourlyMap = buildHourlyMap(data);
      console.log(`  Loaded ${hourlyMap.size} hourly readings`);
    } catch (err) {
      console.error(`  Error fetching Open-Meteo for ${city}: ${err.message}`);
      skipped += cityRows.length;
      rowIndex += cityRows.length;
      await sleep(500);
      continue;
    }

    for (const row of cityRows) {
      rowIndex++;
      const prefix = `[${rowIndex}/${rows.length}] ${city} @ ${new Date(row.forecast_timestamp).toISOString()}`;

      const tempsF = extract12HourWindow(hourlyMap, row.forecast_timestamp);

      if (tempsF.length === 0) {
        console.log(`${prefix} — no observations in window, skipping`);
        skipped++;
        continue;
      }

      const actualTemp = row.is_daytime ? Math.max(...tempsF) : Math.min(...tempsF);

      const errorDegrees = Math.abs(row.temperature - actualTemp);

      try {
        await pool.query(
          `UPDATE forecasts SET actual_temperature = $1, error_degrees = $2 WHERE id = $3`,
          [actualTemp.toFixed(2), errorDegrees.toFixed(2), row.id]
        );
      } catch (err) {
        console.error(`${prefix} — DB update failed: ${err.message}`);
        skipped++;
        continue;
      }

      console.log(
        `${prefix}  forecast=${Number(row.temperature).toFixed(1)}°F  actual=${actualTemp.toFixed(1)}°F  error=${errorDegrees.toFixed(1)}f  (${tempsF.length} obs)`
      );
      updated++;
    }

    await sleep(500);
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
  await pool.end();
}

backfill().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
