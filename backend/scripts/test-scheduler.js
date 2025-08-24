const SchedulerService = require('../src/services/scheduler.service');
require('dotenv').config();

async function testScheduler() {
  // Ensure MongoDB is connected
  const mongoose = require('mongoose');
  try {
    console.log('Attempting to connect to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/weather-tracker';
    console.log('Using MongoDB URI:', mongoUri);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Fail fast if MongoDB isn't running
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
  try {
    console.log('Current directory:', process.cwd());
    console.log('Starting scheduler test...');
    const scheduler = SchedulerService; // Use the exported instance
    
    console.log('Testing forecast update...');
    await scheduler.updateAllForecasts();
    
    console.log('Testing missed notifications...');
    const notification = {
      title: 'Test Notification',
      message: 'This is a test notification',
      timestamp: new Date()
    };
    try {
      await scheduler.addMissedNotification(notification);
      await scheduler.showMissedNotifications();
    } catch (error) {
      console.error('Error with notifications:', error);
    }
    
    console.log('Test complete! Check the logs at backend/output.log and backend/error.log');
    process.exit(0);
  } catch (error) {
    console.error('Test failed!');    
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
}

testScheduler();
