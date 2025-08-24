const mongoose = require('mongoose');
const service = require('../src/services/scheduler.service').instance;

// Store original methods
const originalStartMonitoring = service.startMonitoring;
const originalStartForecastUpdates = service.startForecastUpdates;
const originalCheckMissedUpdates = service.checkMissedUpdates;

// Override with test versions
service.startMonitoring = function() {
    console.log('Starting monitoring (checking every 30 seconds)...');
    this._monitoringInterval = setInterval(() => this.checkMissedUpdates(), 30 * 1000);
};

service.startForecastUpdates = function() {
    console.log('Starting test forecast updates (every 2 minutes)...');
    
    // Run immediately
    this.updateAllForecasts();
    
    // Then schedule to run every 2 minutes
    this._updateInterval = setInterval(() => {
        this.updateAllForecasts();
    }, 2 * 60 * 1000);
};

service.checkMissedUpdates = async function() {
    const now = new Date();
    if (!this.lastUpdateTime) {
        await this.notifyMissedUpdate('No updates have run yet');
        return;
    }

    const timeSinceLastUpdate = now - this.lastUpdateTime;
    
    // If it's been more than 3 minutes since the last update, we missed an update
    if (timeSinceLastUpdate > 3 * 60 * 1000) {
        const missedTime = new Date(this.lastUpdateTime);
        missedTime.setMinutes(missedTime.getMinutes() + 2);
        
        await this.notifyMissedUpdate(
            `Missed weather update at ${missedTime.toLocaleString()}. ` +
            `Last successful update was ${this.lastUpdateTime.toLocaleString()} ` +
            `(${Math.round(timeSinceLastUpdate / 1000 / 60)} minutes ago)`
        );
    }
};

// Function to restore original methods
function restoreOriginalMethods() {
    service.startMonitoring = originalStartMonitoring;
    service.startForecastUpdates = originalStartForecastUpdates;
    service.checkMissedUpdates = originalCheckMissedUpdates;
    
    // Clear test intervals
    if (service._monitoringInterval) clearInterval(service._monitoringInterval);
    if (service._updateInterval) clearInterval(service._updateInterval);
}

async function testSleep() {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect('mongodb://127.0.0.1:27017/weather-tracker', {
            serverSelectionTimeoutMS: 5000,
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Start the service with test methods
        service.startForecastUpdates();
        service.startMonitoring();
        
        console.log('\nTest instructions:');
        console.log('1. Leave this running');
        console.log('2. Put your computer to sleep for 3-4 minutes');
        console.log('3. Wake the computer');
        console.log('4. You should see missed update notifications\n');
        
        console.log('Press Ctrl+C to exit when done testing.');
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

testSleep();

// Handle cleanup
process.on('SIGINT', async () => {
    console.log('\nCleaning up...');
    restoreOriginalMethods();
    await mongoose.disconnect();
    process.exit(0);
});

