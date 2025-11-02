-- Weather Tracker Database Schema

-- Create forecasts table
CREATE TABLE IF NOT EXISTS forecasts (
  id SERIAL PRIMARY KEY,
  city VARCHAR(100) NOT NULL,
  forecast_timestamp TIMESTAMPTZ NOT NULL,
  temperature DECIMAL(5,2) NOT NULL,
  temperature_unit CHAR(1) NOT NULL CHECK (temperature_unit IN ('F', 'C')),
  is_daytime BOOLEAN NOT NULL,
  actual_temperature DECIMAL(5,2),
  accuracy DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_city_timestamp ON forecasts(city, forecast_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_created_at ON forecasts(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_forecasts_updated_at ON forecasts;
CREATE TRIGGER update_forecasts_updated_at BEFORE UPDATE ON forecasts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
