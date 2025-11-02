const cron = require('node-cron');
const WeatherService = require('./weather.service.postgres');
const notifier = require('node-notifier');
const path = require('path');
const fsPromises = require('fs').promises;
const os = require('os');

class SchedulerService {
  constructor() {
    this.outputLogFile = path.join(__dirname, '../../output.log');
    this.errorLogFile = path.join(__dirname, '../../error.log');
    this.weatherService = WeatherService;
    this.cities = Object.keys(this.weatherService.cities);
    this.missedNotificationsPath = path.join(os.homedir(), '.weather-notifications.json');
    this.lastUpdateTime = null;
    this.notifier = notifier;
    this.missedNotifications = [];
  }

  async log(message, isError = false) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console[isError ? 'error' : 'log'](logMessage.trim());
    const logFile = isError ? this.errorLogFile : this.outputLogFile;
    try {
      await fsPromises.appendFile(logFile, logMessage);
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }

  startForecastUpdates() {
    this.log('Starting scheduled forecast updates...');
    
    // Run immediately on startup
    this.updateAllForecasts();
    
    // Then schedule to run twice daily (6 AM and 6 PM)
    cron.schedule('0 6,18 * * *', () => {
      this.updateAllForecasts();
    });
    
    // Also run every 12 hours as a backup
    cron.schedule('0 */12 * * *', () => {
      this.log('Backup scheduled update running');
      this.updateAllForecasts();
    });
  }

  async updateAllForecasts() {
    const updateTime = new Date();
    console.log(`Updating forecasts at ${updateTime.toLocaleString()}`);
    this.lastUpdateTime = updateTime;
    
    try {
      for (const city of this.cities) {
        try {
          const forecast = await this.weatherService.getForecast(city);
          await this.weatherService.storeForecast(forecast, city);
          console.log(`Updated forecast for ${city}`);
          
          // Send notification with the latest temperature
          if (forecast && forecast.length > 0) {
            const latestTemp = forecast[0].temperature;
            const isDaytime = forecast[0].isDaytime;
            
            // Only send notifications in non-production or if enabled
            if (process.env.ENABLE_NOTIFICATIONS === 'true') {
              notifier.notify({
                title: `Weather Update: ${city}`,
                message: `${isDaytime ? '☀️' : '🌙'} Current temperature: ${latestTemp}°${forecast[0].temperatureUnit}`,
                sound: true,
                timeout: 5
              });
            }
          }
        } catch (error) {
          await this.log(`Error updating forecast for ${city}: ${error.message}`, true);
          console.error(`Error updating forecast for ${city}:`, error);
        }
      }
      await this.log('All forecasts updated successfully');
    } catch (error) {
      const timestamp = new Date().toISOString();
      await this.log(`Error updating forecasts: ${error.message}`, true);
      console.error(`[${timestamp}] Error updating forecasts:`, error);
    }
  }
}

// Create and export a singleton instance
const schedulerService = new SchedulerService();
module.exports = { instance: schedulerService };
