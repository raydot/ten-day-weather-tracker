const mongoose = require('mongoose');
const Forecast = require('../src/models/weather.model');
require('dotenv').config();

async function checkRecentData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get start of today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const recentForecasts = await Forecast.find({
      timestamp: { $gte: today }
    }).sort({ timestamp: -1 });

    if (recentForecasts.length === 0) {
      console.log('No forecasts found for today');
    } else {
      console.log(`Found ${recentForecasts.length} forecasts for today:`);
      recentForecasts.forEach(f => {
        console.log(`${f.city}: ${f.temperature}°F at ${new Date(f.timestamp).toLocaleTimeString()} (${f.isDaytime ? 'Day' : 'Night'})`);
      });
    }

    // Check last 24 hours
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const last24Hours = await Forecast.find({
      timestamp: { 
        $gte: yesterday,
        $lt: today
      }
    }).sort({ timestamp: -1 });

    console.log('\nLast 24 hours:');
    if (last24Hours.length === 0) {
      console.log('No forecasts found for yesterday');
    } else {
      console.log(`Found ${last24Hours.length} forecasts for yesterday:`);
      last24Hours.forEach(f => {
        console.log(`${f.city}: ${f.temperature}°F at ${new Date(f.timestamp).toLocaleTimeString()} (${f.isDaytime ? 'Day' : 'Night'})`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error checking recent data:', error);
    process.exit(1);
  }
}

checkRecentData();
