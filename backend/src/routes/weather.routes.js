const express = require('express');
const router = express.Router();
const weatherService = require('../services/weather.service');

// Record actual temperature
router.post('/actual/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { date, temperature } = req.body;
    await weatherService.updateActualTemperature(city, new Date(date), temperature);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get forecast accuracy for a city
router.get('/accuracy/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const accuracy = await weatherService.getForecastAccuracy(city);
    res.json(accuracy);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get forecast for a specific city
router.get('/forecast/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { test } = req.query;

    if (test === 'true') {
      // Generate 10 days of test data
      const testData = {
        city,
        forecast: []
      };
      const now = new Date();
      
      // Generate data for past 9 days plus today (10 days total)
      for (let day = 9; day >= 0; day--) {
        // For each day, generate both historical and forecast data
        for (let hour of [6, 18]) {  // 6 AM and 6 PM
          const timestamp = new Date(now);
          timestamp.setDate(timestamp.getDate() - day);
          timestamp.setHours(hour, 0, 0, 0);

          // Base temperature varies by city
          const baseTemp = {
            'San Francisco': 65,
            'New York': 75,
            'Chicago': 70
          }[city] || 70;

          // Add daily variation and random noise
          const timeOfDay = Math.sin((hour - 6) * Math.PI / 12);
          const dailyVariation = 5 * timeOfDay;
          const noise = Math.random() * 4 - 2;
          const trend = Math.sin(day * Math.PI / 5) * 3;
          
          const temperature = Math.round(baseTemp + dailyVariation + noise + trend);

          // For historical data (past days), add both forecast and actual
          const isHistorical = timestamp < now;
          
          // Add the forecast
          testData.forecast.push({
            startTime: timestamp.toISOString(),
            temperature: temperature,
            temperatureUnit: 'F',
            isDaytime: hour === 6,  // 6 AM is daytime, 6 PM is nighttime
            shortForecast: hour === 6 ? 'Sunny' : 'Clear',
            isHistorical
          });

          // For historical data, also add the actual temperature with some variation
          if (isHistorical) {
            const actualVariation = (Math.random() - 0.5) * 4;  // +/- 2 degrees
            testData.forecast.push({
              startTime: timestamp.toISOString(),
              temperature: Math.round(temperature + actualVariation),
              temperatureUnit: 'F',
              isDaytime: hour === 6,
              shortForecast: hour === 6 ? 'Sunny' : 'Clear',
              isActual: true
            });
          }
        }
      }

      // Sort by date
      testData.forecast.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
      
      return res.json(testData);
    }

    // If not test mode, get real forecast data
    const forecasts = await weatherService.getForecast(city);
    res.json(forecasts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get forecasts for all cities
router.get('/forecasts', async (req, res) => {
  try {
    const cities = Object.keys(weatherService.cities);
    const forecasts = await Promise.all(
      cities.map(async (city) => ({
        city,
        forecast: await weatherService.getForecast(city)
      }))
    );
    res.json(forecasts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
