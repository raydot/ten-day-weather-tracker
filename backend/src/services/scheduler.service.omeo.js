const cron = require('node-cron');
const weatherService = require('./weather.service.omeo');

class SchedulerServiceOmeo {
  constructor() {
    this.cities = Object.keys(weatherService.cities);
  }

  start() {
    console.log('Open-Meteo scheduler started (cron: 0 6,18 * * * UTC)');
    cron.schedule('0 6,18 * * *', () => this.runAll(), { timezone: 'UTC' });
  }

  async runAll() {
    console.log(`[${new Date().toISOString()}] Scheduled update starting (${this.cities.length} cities)`);

    for (const city of this.cities) {
      try {
        console.log(`\n[${city}] Fetching forecast...`);
        const periods = await weatherService.getForecast(city);
        await weatherService.storeForecast(periods, city);

        console.log(`[${city}] Updating actuals...`);
        await weatherService.updateActuals(city);

        console.log(`[${city}] Done`);
      } catch (err) {
        console.error(`[${city}] Error: ${err.message}`);
      }
    }

    console.log(`\n[${new Date().toISOString()}] Scheduled update complete`);
  }
}

module.exports = new SchedulerServiceOmeo();
