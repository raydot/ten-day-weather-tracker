// Quick script to check if data is being collected
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkData() {
  try {
    // Check table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'forecasts'
      );
    `);
    console.log('✅ Forecasts table exists:', tableCheck.rows[0].exists);

    // Count total records
    const count = await pool.query('SELECT COUNT(*) FROM forecasts');
    console.log('📊 Total forecast records:', count.rows[0].count);

    // Get latest forecasts
    const latest = await pool.query(`
      SELECT city, forecast_timestamp, temperature, created_at 
      FROM forecasts 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('\n🌤️  Latest forecasts:');
    latest.rows.forEach(row => {
      console.log(`  ${row.city}: ${row.temperature}°F at ${row.forecast_timestamp}`);
      console.log(`    (collected: ${row.created_at})`);
    });

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkData();
