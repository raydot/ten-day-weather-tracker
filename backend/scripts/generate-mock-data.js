const mongoose = require('mongoose');
const Forecast = require('../src/models/weather.model');
require('dotenv').config();

// Realistic temperature ranges for each city
const cityTemperatures = {
  'San Francisco': {
    summer: { day: [65, 75], night: [55, 65] },
    winter: { day: [55, 65], night: [45, 55] }
  },
  'New York': {
    summer: { day: [75, 90], night: [65, 75] },
    winter: { day: [30, 45], night: [20, 35] }
  },
  'Chicago': {
    summer: { day: [75, 85], night: [65, 75] },
    winter: { day: [25, 40], night: [15, 30] }
  }
};

function getRandomTemp(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isSummerMonth(month) {
  return month >= 5 && month <= 8; // May through August
}

async function generateMockData() {
  try {
    // Use a separate test database
    const MOCK_DB_URI = 'mongodb://localhost:27017/weather-tracker-mock';
    await mongoose.connect(MOCK_DB_URI);
    console.log('Connected to MongoDB');

    // Generate data for the past 30 days
    const cities = Object.keys(cityTemperatures);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    for (const city of cities) {
      console.log(`Generating data for ${city}...`);
      
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const isSummer = isSummerMonth(date.getMonth());
        const season = isSummer ? 'summer' : 'winter';
        
        // Generate daytime temperature
        const dayTemp = getRandomTemp(
          cityTemperatures[city][season].day[0],
          cityTemperatures[city][season].day[1]
        );
        
        // Generate nighttime temperature
        const nightTemp = getRandomTemp(
          cityTemperatures[city][season].night[0],
          cityTemperatures[city][season].night[1]
        );

        // Create daytime forecast
        await Forecast.create({
          city,
          temperature: dayTemp,
          temperatureUnit: 'F',
          isDaytime: true,
          timestamp: new Date(date.setHours(12, 0, 0, 0)), // noon
          actualTemperature: dayTemp + getRandomTemp(-3, 3) // slight variation for actual
        });

        // Create nighttime forecast
        await Forecast.create({
          city,
          temperature: nightTemp,
          temperatureUnit: 'F',
          isDaytime: false,
          timestamp: new Date(date.setHours(0, 0, 0, 0)), // midnight
          actualTemperature: nightTemp + getRandomTemp(-3, 3) // slight variation for actual
        });
      }
    }

    console.log('Mock data generation complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error generating mock data:', error);
    process.exit(1);
  }
}

generateMockData();
