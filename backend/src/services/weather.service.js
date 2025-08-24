const axios = require('axios');
const Forecast = require('../models/weather.model');

class WeatherService {
  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY;
    this.baseUrl = 'https://api.weather.gov';
    this.cities = {
      'San Francisco': { lat: 37.7749, lon: -122.4194 },
      'New York': { lat: 40.7128, lon: -74.0060 },
      'Chicago': { lat: 41.8781, lon: -87.6298 }
    };
  }

  async getForecast(city) {
    try {
      const coords = this.cities[city];
      if (!coords) {
        throw new Error('City not supported');
      }

      const response = await axios.get(
        `${this.baseUrl}/points/${coords.lat},${coords.lon}`
      );

      const forecastUrl = response.data.properties.forecast;
      const forecast = await axios.get(forecastUrl);
      
      return forecast.data.properties.periods;
    } catch (error) {
      console.error(`Error fetching forecast for ${city}:`, error);
      throw error;
    }
  }

  async storeForecast(forecast, city) {
    try {
      const forecastRecords = forecast.map(period => ({
        city,
        timestamp: new Date(period.startTime),
        temperature: period.temperature,
        temperatureUnit: period.temperatureUnit,
        isDaytime: period.isDaytime,
        actualTemperature: null // Will be filled in later
      }));

      // Store all forecast periods
      await Forecast.insertMany(forecastRecords);
      return forecastRecords;
    } catch (error) {
      console.error(`Error storing forecast for ${city}:`, error);
      throw error;
    }
  }

  async updateActualTemperature(city, date, actualTemp) {
    try {
      const forecast = await Forecast.findOne({
        city,
        date: date,
        actualTemp: null // Only update if we haven't recorded actual temp yet
      });

      if (forecast) {
        const accuracy = 100 - Math.abs(((forecast.predictedTemp - actualTemp) / actualTemp) * 100);
        
        await Forecast.findByIdAndUpdate(forecast._id, {
          actualTemp,
          accuracy
        });
      }
    } catch (error) {
      console.error(`Error updating actual temperature for ${city}:`, error);
      throw error;
    }
  }

  async getForecastAccuracy(city) {
    try {
      const forecasts = await Forecast.find({
        city,
        accuracy: { $ne: null } // Only get forecasts where we have actual temperatures
      }).sort({ date: -1 }); // Most recent first

      return forecasts;
    } catch (error) {
      console.error(`Error getting forecast accuracy for ${city}:`, error);
      throw error;
    }
  }
}

module.exports = new WeatherService();
