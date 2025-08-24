const mongoose = require('mongoose');

const forecastSchema = new mongoose.Schema({
  // Basic forecast information
  city: { type: String, required: true },
  timestamp: { type: Date, required: true },
  temperature: { type: Number, required: true },
  temperatureUnit: { type: String, required: true, enum: ['F', 'C'] },
  isDaytime: { type: Boolean, required: true },
  
  // For tracking accuracy
  actualTemperature: { type: Number, default: null },
  accuracy: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
forecastSchema.index({ city: 1, date: 1 });

module.exports = mongoose.model('Forecast', forecastSchema);
