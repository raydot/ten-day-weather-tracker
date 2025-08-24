const mongoose = require('mongoose');

async function resetDb() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://127.0.0.1:27017/weather-tracker');
    console.log('Connected to MongoDB');

    console.log('Dropping forecasts collection...');
    await mongoose.connection.dropCollection('forecasts').catch(() => {
      console.log('Collection did not exist, skipping drop');
    });

    console.log('Database reset complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetDb();
