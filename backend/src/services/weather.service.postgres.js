const axios = require('axios');
const db = require('../db/postgres');

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
      console.error(`Error fetching forecast for ${city}:`, error.message);
      throw error;
    }
  }

  async storeForecast(forecast, city) {
    try {
      const client = await db.getClient();
      
      try {
        await client.query('BEGIN');
        
        for (const period of forecast) {
          await client.query(
            `INSERT INTO forecasts 
              (city, forecast_timestamp, temperature, temperature_unit, is_daytime) 
             VALUES ($1, $2, $3, $4, $5)`,
            [
              city,
              new Date(period.startTime),
              period.temperature,
              period.temperatureUnit,
              period.isDaytime
            ]
          );
        }
        
        await client.query('COMMIT');
        console.log(`Stored ${forecast.length} forecast records for ${city}`);
        return forecast.length;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error storing forecast for ${city}:`, error);
      throw error;
    }
  }

  async updateActualTemperature(city, timestamp, actualTemp) {
    try {
      const result = await db.query(
        `UPDATE forecasts 
         SET actual_temperature = $1,
             accuracy = 100 - ABS(((temperature - $1) / $1) * 100)
         WHERE city = $2 
           AND forecast_timestamp = $3
           AND actual_temperature IS NULL
         RETURNING *`,
        [actualTemp, city, timestamp]
      );

      if (result.rowCount > 0) {
        console.log(`Updated actual temperature for ${city} at ${timestamp}`);
        return result.rows[0];
      }
      return null;
    } catch (error) {
      console.error(`Error updating actual temperature for ${city}:`, error);
      throw error;
    }
  }

  async getForecastAccuracy(city, limit = 100) {
    try {
      const result = await db.query(
        `SELECT * FROM forecasts 
         WHERE city = $1 
           AND accuracy IS NOT NULL
         ORDER BY forecast_timestamp DESC
         LIMIT $2`,
        [city, limit]
      );

      return result.rows;
    } catch (error) {
      console.error(`Error getting forecast accuracy for ${city}:`, error);
      throw error;
    }
  }

  async getRecentForecasts(city, hours = 24) {
    try {
      const result = await db.query(
        `SELECT * FROM forecasts 
         WHERE city = $1 
           AND created_at >= NOW() - INTERVAL '${hours} hours'
         ORDER BY forecast_timestamp DESC`,
        [city]
      );

      return result.rows;
    } catch (error) {
      console.error(`Error getting recent forecasts for ${city}:`, error);
      throw error;
    }
  }
}

module.exports = new WeatherService();
