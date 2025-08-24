const cron = require('node-cron');
const WeatherService = require('./weather.service');
const notifier = require('node-notifier');
const path = require('path');
const fsSync = require('fs');
const fsPromises = require('fs').promises;
const os = require('os');
const { onWake } = require('./wake-detector');

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
    this.loadMissedNotifications();
    this.startMonitoring();
    this.startForecastUpdates();
  }

  loadMissedNotifications() {
    try {
      if (fsSync.existsSync(this.missedNotificationsPath)) {
        const content = fsSync.readFileSync(this.missedNotificationsPath, 'utf8');
        // Check if the file is empty or just whitespace
        if (!content.trim()) {
          this.missedNotifications = [];
          return;
        }
        this.missedNotifications = JSON.parse(content);
      } else {
        // Initialize the file with an empty array
        fsSync.writeFileSync(this.missedNotificationsPath, '[]');
        this.missedNotifications = [];
      }
    } catch (error) {
      console.error('Error loading missed notifications:', error);
      // If there's any error, reset the file and the notifications
      fsSync.writeFileSync(this.missedNotificationsPath, '[]');
      this.missedNotifications = [];
    }
  }

  async saveMissedNotifications() {
    try {
      await fsPromises.writeFile(this.missedNotificationsPath, JSON.stringify(this.missedNotifications));
    } catch (error) {
      console.error('Error saving missed notifications:', error);
    }
  }

  async addMissedNotification(notification) {
    this.missedNotifications.push({
      ...notification,
      timestamp: new Date().toISOString()
    });
    await this.saveMissedNotifications();
  }

  async showMissedNotifications() {
    if (this.missedNotifications.length === 0) return;

    // Show summary notification
    notifier.notify({
      title: 'Missed Weather Updates',
      message: `You have ${this.missedNotifications.length} weather updates from while you were away`,
      sound: true,
      timeout: 5
    });

    // Show each missed notification with a delay
    this.missedNotifications.forEach((notification, index) => {
      setTimeout(() => {
        notifier.notify({
          title: notification.title,
          message: notification.message,
          sound: false,
          timeout: 5
        });
      }, index * 3000); // Show each notification 3 seconds apart
    });

    // Clear notifications after showing them
    this.missedNotifications = [];
    await this.saveMissedNotifications();
  }

  // Update forecasts every hour
  async log(message, isError = false) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console[isError ? 'error' : 'log'](logMessage.trim());
    const logFile = isError ? this.errorLogFile : this.outputLogFile;
    await fsPromises.appendFile(logFile, logMessage).catch(console.error);
  }

  startForecastUpdates() {
    this.log('Starting scheduled forecast updates...');
    
    // Set up wake detection
    onWake(() => {
      console.log('System woke up, checking for missed notifications...');
      this.showMissedNotifications();
    });
    
    // Run immediately on startup
    this.updateAllForecasts();
    
    // Then schedule to run twice daily (6 AM and 6 PM)
    cron.schedule('0 6,18 * * *', () => {
      this.updateAllForecasts();
    });
  }

  async updateAllForecasts() {
    const updateTime = new Date();
    console.log(`Updating forecasts at ${updateTime.toLocaleString()}`);
    this.lastUpdateTime = updateTime;
    
    try {
      for (const city of this.cities) {
        const forecast = await this.weatherService.getForecast(city);
        await this.weatherService.storeForecast(forecast, city);
        console.log(`Updated forecast for ${city}`);
        
        // Send notification with the latest temperature
        const latestTemp = forecast[0].temperature;
        const isDaytime = forecast[0].isDaytime;
        const notification = {
          title: `Weather Update: ${city}`,
          message: `${isDaytime ? '☀️' : '🌙'} Current temperature: ${latestTemp}°${forecast[0].temperatureUnit}`
        };

        // Try to show notification immediately
        notifier.notify({
          ...notification,
          sound: true,
          timeout: 5
        });

        // Store it as missed in case system is sleeping
        this.addMissedNotification(notification);
      }
      await this.log('All forecasts updated successfully');
    } catch (error) {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] Error updating forecasts:`, error);
    }
  }
  startMonitoring() {
    // Check every 30 minutes if we've missed any updates
    setInterval(() => this.checkMissedUpdates(), 30 * 60 * 1000);
  }

  async checkMissedUpdates() {
    const now = new Date();
    if (!this.lastUpdateTime) {
      await this.notifyMissedUpdate('No updates have run yet');
      return;
    }

    const hoursSinceLastUpdate = (now - this.lastUpdateTime) / (1000 * 60 * 60);
    
    // If it's been more than 13 hours since the last update, we missed an update
    // (updates should happen every 12 hours at 6am/6pm)
    if (hoursSinceLastUpdate > 13) {
      const missedTime = new Date(this.lastUpdateTime);
      missedTime.setHours(missedTime.getHours() + 12);
      
      await this.notifyMissedUpdate(
        `Missed weather update at ${missedTime.toLocaleString()}. ` +
        `Last successful update was ${this.lastUpdateTime.toLocaleString()} ` +
        `(${Math.round(hoursSinceLastUpdate)} hours ago)`
      );
    }
  }

  async notifyMissedUpdate(message) {
    await this.log(`[ALERT] ${message}`, true);
    this.notifier.notify({
      title: 'Weather Update Missed',
      message,
      sound: true,
      wait: true
    });
  }
}

// Create and export a singleton instance
const schedulerService = new SchedulerService();
module.exports = { instance: schedulerService };
