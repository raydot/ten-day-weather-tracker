const axios = require('axios');
const db = require('../db/postgres');

const CITIES = {
  'San Francisco': { lat: 37.7749, lon: -122.4194 },
  'New York':      { lat: 40.7128, lon:  -74.0060 },
  'Chicago':       { lat: 41.8781, lon:  -87.6298 },
  'Austin':        { lat: 30.2672, lon:  -97.7431 },
  'Phoenix':       { lat: 33.4484, lon: -112.0740 },
  'Miami':         { lat: 25.7617, lon:  -80.1918 },
  'Minneapolis':   { lat: 44.9778, lon:  -93.2650 },
  'Denver':        { lat: 39.7392, lon: -104.9903 },
  'Seattle':       { lat: 47.6062, lon: -122.3321 },
  'Oklahoma City': { lat: 35.4676, lon:  -97.5164 },
  'Boston':        { lat: 42.3601, lon:  -71.0589 },
  'New Orleans':   { lat: 29.9511, lon:  -90.0715 },
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class WeatherServiceOmeo {
  constructor() {
    this.cities = CITIES;
    this.forecastUrl = 'https://api.open-meteo.com/v1/forecast';
    this.archiveUrl  = 'https://archive-api.open-meteo.com/v1/archive';
  }

  async getForecast(city) {
    const coords = this.cities[city];
    if (!coords) throw new Error(`Unknown city: ${city}`);

    const response = await axios.get(this.forecastUrl, {
      params: {
        latitude:         coords.lat,
        longitude:        coords.lon,
        daily:            'temperature_2m_max,temperature_2m_min',
        temperature_unit: 'fahrenheit',
        timezone:         'UTC',
        forecast_days:    10,
      },
    });

    const { time, temperature_2m_max, temperature_2m_min } = response.data.daily;

    const periods = [];
    for (let i = 0; i < time.length; i++) {
      periods.push({
        city,
        forecast_timestamp: `${time[i]}T14:00:00Z`,
        temperature: temperature_2m_max[i],
        is_daytime: true,
      });
      periods.push({
        city,
        forecast_timestamp: `${time[i]}T02:00:00Z`,
        temperature: temperature_2m_min[i],
        is_daytime: false,
      });
    }

    return periods;
  }

  async storeForecast(periods, city) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      let inserted = 0;

      for (const p of periods) {
        const result = await client.query(
          `INSERT INTO forecasts_omeo
             (city, forecast_timestamp, temperature, temperature_unit, is_daytime, forecast_source, first_recorded_at)
           VALUES ($1, $2, $3, 'F', $4, 'open-meteo', NOW())
           ON CONFLICT (city, forecast_timestamp) DO NOTHING`,
          [p.city, p.forecast_timestamp, p.temperature, p.is_daytime]
        );
        inserted += result.rowCount;
      }

      await client.query('COMMIT');
      console.log(`  Stored ${inserted} new records for ${city} (${periods.length - inserted} already existed)`);
      return inserted;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateActuals(city) {
    const coords = this.cities[city];
    if (!coords) throw new Error(`Unknown city: ${city}`);

    const { rows } = await db.query(
      `SELECT id, forecast_timestamp, temperature, is_daytime
       FROM forecasts_omeo
       WHERE city = $1
         AND forecast_timestamp < NOW()
         AND actual_temperature IS NULL
       ORDER BY forecast_timestamp`,
      [city]
    );

    if (rows.length === 0) {
      console.log(`  No pending actuals for ${city}`);
      return;
    }

    // Group by date — one archive API call per unique date
    const byDate = new Map();
    for (const row of rows) {
      const date = new Date(row.forecast_timestamp).toISOString().slice(0, 10);
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date).push(row);
    }

    console.log(`  Updating actuals for ${city}: ${rows.length} rows across ${byDate.size} dates`);

    for (const [date, dateRows] of byDate) {
      try {
        const response = await axios.get(this.archiveUrl, {
          params: {
            latitude:         coords.lat,
            longitude:        coords.lon,
            start_date:       date,
            end_date:         date,
            daily:            'temperature_2m_max,temperature_2m_min',
            temperature_unit: 'fahrenheit',
            timezone:         'UTC',
          },
        });

        const { temperature_2m_max, temperature_2m_min } = response.data.daily;
        const maxTemp = temperature_2m_max[0];
        const minTemp = temperature_2m_min[0];

        for (const row of dateRows) {
          const actualTemp = row.is_daytime ? maxTemp : minTemp;
          if (actualTemp === null || actualTemp === undefined) continue;

          await db.query(
            `UPDATE forecasts_omeo
             SET actual_temperature = $1,
                 error_degrees = ABS(temperature - $1)
             WHERE id = $2`,
            [actualTemp, row.id]
          );
        }

        console.log(`    ${date}: max=${maxTemp}°F min=${minTemp}°F (${dateRows.length} rows updated)`);
      } catch (err) {
        console.error(`    Error fetching archive for ${city} on ${date}: ${err.message}`);
      }

      await sleep(500);
    }
  }
}

module.exports = new WeatherServiceOmeo();
