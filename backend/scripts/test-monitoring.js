const mongoose = require('mongoose');
const SchedulerService = require('../src/services/scheduler.service');

async function testMonitoring() {
  try {
    // Connect to MongoDB first
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://127.0.0.1:27017/weather-tracker', {
      serverSelectionTimeoutMS: 5000,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    console.log('\nTesting monitoring system...');
    
    // Set a fake last update time from 14 hours ago
    const fourteenHoursAgo = new Date();
    fourteenHoursAgo.setHours(fourteenHoursAgo.getHours() - 14);
    SchedulerService.lastUpdateTime = fourteenHoursAgo;
    
    console.log(`Set last update time to ${fourteenHoursAgo.toLocaleString()}`);
    console.log('Checking for missed updates...');
    
    // Force an immediate check
    await SchedulerService.checkMissedUpdates();
    
    console.log('\nMonitoring test complete. You should have received a notification.');
    console.log('The monitoring system will continue to check every 30 minutes.');
    console.log('\nPress Ctrl+C to exit.');

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testMonitoring();

// Handle cleanup
process.on('SIGINT', async () => {
  console.log('\nCleaning up...');
  await mongoose.disconnect();
  process.exit(0);
});
