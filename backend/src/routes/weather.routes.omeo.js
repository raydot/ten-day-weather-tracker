const express = require('express');
const router = express.Router();
const db = require('../db/postgres');

// GET /api/v2/weather/:city/recent
router.get('/:city/recent', async (req, res) => {
  try {
    const city = decodeURIComponent(req.params.city);
    const limit = Math.min(parseInt(req.query.limit) || 20, 200);

    const result = await db.query(
      `SELECT id, city, forecast_timestamp, temperature, temperature_unit,
              is_daytime, actual_temperature, error_degrees, first_recorded_at
       FROM forecasts_omeo
       WHERE city = $1
       ORDER BY forecast_timestamp DESC
       LIMIT $2`,
      [city, limit]
    );

    res.json({ city, count: result.rows.length, forecasts: result.rows });
  } catch (err) {
    console.error('Error in GET /api/v2/weather/:city/recent:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v2/weather/:city/accuracy
router.get('/:city/accuracy', async (req, res) => {
  try {
    const city = decodeURIComponent(req.params.city);
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);

    const result = await db.query(
      `SELECT id, city, forecast_timestamp, temperature, temperature_unit,
              is_daytime, actual_temperature, error_degrees, first_recorded_at
       FROM forecasts_omeo
       WHERE city = $1
         AND error_degrees IS NOT NULL
       ORDER BY forecast_timestamp DESC
       LIMIT $2`,
      [city, limit]
    );

    res.json({ city, count: result.rows.length, forecasts: result.rows });
  } catch (err) {
    console.error('Error in GET /api/v2/weather/:city/accuracy:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v2/weather/degradation
router.get('/degradation', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         FLOOR(EXTRACT(EPOCH FROM (forecast_timestamp - first_recorded_at)) / 86400)::integer AS lead_days,
         ROUND(AVG(error_degrees)::numeric, 2)  AS avg_error_degrees,
         COUNT(*)::integer                       AS sample_count
       FROM forecasts_omeo
       WHERE error_degrees      IS NOT NULL
         AND first_recorded_at  IS NOT NULL
       GROUP BY lead_days
       ORDER BY lead_days`
    );

    res.json({ degradation: result.rows });
  } catch (err) {
    console.error('Error in GET /api/v2/weather/degradation:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
