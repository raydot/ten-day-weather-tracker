const express = require('express');
const router = express.Router();
const weatherService = require('../services/weather.service.postgres');

// Get recent forecasts for a city
router.get('/:city/recent', async (req, res) => {
  try {
    const { city } = req.params;
    const hours = parseInt(req.query.hours) || 24;
    
    const forecasts = await weatherService.getRecentForecasts(city, hours);
    res.json({
      city,
      count: forecasts.length,
      forecasts
    });
  } catch (error) {
    console.error('Error fetching recent forecasts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get forecast accuracy for a city
router.get('/:city/accuracy', async (req, res) => {
  try {
    const { city } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    
    const forecasts = await weatherService.getForecastAccuracy(city, limit);
    res.json({
      city,
      count: forecasts.length,
      forecasts
    });
  } catch (error) {
    console.error('Error fetching forecast accuracy:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manually trigger forecast update for a city
router.post('/:city/update', async (req, res) => {
  try {
    const { city } = req.params;
    
    const forecast = await weatherService.getForecast(city);
    const count = await weatherService.storeForecast(forecast, city);
    
    res.json({
      success: true,
      city,
      recordsStored: count
    });
  } catch (error) {
    console.error('Error updating forecast:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
