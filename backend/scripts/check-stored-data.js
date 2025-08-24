const mongoose = require('mongoose');
const Forecast = require('../src/models/weather.model');
require('dotenv').config();

async function checkStoredData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://127.0.0.1:27017/weather-tracker');
    console.log('Connected to MongoDB');

    // Get the last 24 hours of forecasts
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const forecasts = await Forecast.find({
      timestamp: { $gte: yesterday }
    }).sort({ timestamp: -1 });

    console.log(`\nFound ${forecasts.length} forecasts in the last 24 hours:`);
    
    // Group by city
    const byCity = {};
    forecasts.forEach(f => {
      if (!byCity[f.city]) byCity[f.city] = [];
      byCity[f.city].push(f);
    });

    // Display results by city
    for (const [city, cityForecasts] of Object.entries(byCity)) {
      console.log(`\n${city}:`);
      cityForecasts.slice(0, 2).forEach(f => {
        console.log(`  ${f.isDaytime ? '☀️' : '🌙'} ${new Date(f.timestamp).toLocaleString()}: ${f.temperature}°${f.temperatureUnit}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkStoredData();
