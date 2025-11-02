#!/usr/bin/env node
/**
 * Quick test script to verify PostgreSQL connection
 * Usage: node test-connection.js
 */

require('dotenv').config();
const { Pool } = require('pg');

async function testConnection() {
  console.log('Testing PostgreSQL connection...\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable not set');
    console.log('Please set DATABASE_URL in your .env file');
    process.exit(1);
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL');
    
    // Test query
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Query executed successfully');
    console.log(`   Time: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL: ${result.rows[0].pg_version.split(',')[0]}\n`);
    
    // Check if forecasts table exists
    const tableCheck = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'forecasts')"
    );
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Forecasts table exists');
      
      // Count records
      const count = await client.query('SELECT COUNT(*) FROM forecasts');
      console.log(`   Records in database: ${count.rows[0].count}\n`);
    } else {
      console.log('⚠️  Forecasts table does not exist yet');
      console.log('   It will be created when the server starts\n');
    }
    
    client.release();
    await pool.end();
    
    console.log('✅ All tests passed! Ready for deployment.\n');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Connection test failed:');
    console.error(`   ${error.message}\n`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('Troubleshooting:');
      console.log('  1. Check that PostgreSQL is running');
      console.log('  2. Verify DATABASE_URL is correct');
      console.log('  3. Check firewall settings\n');
    }
    
    await pool.end();
    process.exit(1);
  }
}

testConnection();
