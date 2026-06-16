const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const weatherService = require('../src/services/weather.service.omeo');
const db = require('../src/db/postgres');

const DELAY_MS = 500;
const cities = Object.keys(weatherService.cities);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log(`Fetching forecasts for ${cities.length} cities...\n`);

  try {
    for (let i = 0; i < cities.length; i++) {
      const city = cities[i];
      console.log(`[${i + 1}/${cities.length}] ${city}`);

      try {
        const periods = await weatherService.getForecast(city);
        periods.forEach(p =>
          console.log(`  ${p.forecast_timestamp}  ${p.is_daytime ? 'day  ' : 'night'}  ${p.temperature}°F`)
        );

        const inserted = await weatherService.storeForecast(periods, city);
        console.log(`  → ${inserted} new rows stored\n`);
      } catch (err) {
        console.error(`  Error: ${err.message}\n`);
      }

      if (i < cities.length - 1) await sleep(DELAY_MS);
    }

    console.log('Done.');
  } finally {
    await db.pool.end();
  }
}

main();
