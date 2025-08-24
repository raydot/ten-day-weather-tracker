const mongoose = require('mongoose');
const Forecast = require('../src/models/weather.model');

async function viewMockData() {
  try {
    const MOCK_DB_URI = 'mongodb://localhost:27017/weather-tracker-mock';
    await mongoose.connect(MOCK_DB_URI);
    console.log('Connected to mock database');

    const cities = ['San Francisco', 'New York', 'Chicago'];
    
    for (const city of cities) {
      const forecasts = await Forecast.find({ city })
        .sort({ timestamp: -1 })
        .limit(4);
      
      console.log(`\n${city} - Latest Forecasts:`);
      forecasts.forEach(f => {
        console.log(`${f.isDaytime ? '☀️' : '🌙'} ${new Date(f.timestamp).toLocaleDateString()}: ${f.temperature}°F (Actual: ${f.actualTemperature}°F)`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error viewing mock data:', error);
    process.exit(1);
  }
}

viewMockData();
