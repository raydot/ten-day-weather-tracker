CREATE TABLE IF NOT EXISTS forecasts_omeo (
  id                 SERIAL PRIMARY KEY,
  city               VARCHAR(100)   NOT NULL,
  forecast_timestamp TIMESTAMPTZ    NOT NULL,
  temperature        DECIMAL(5,2)   NOT NULL,
  temperature_unit   CHAR(1)        NOT NULL DEFAULT 'F',
  is_daytime         BOOLEAN        NOT NULL,
  forecast_source    VARCHAR(50)    NOT NULL DEFAULT 'open-meteo',
  first_recorded_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  actual_temperature DECIMAL(5,2),
  error_degrees      DECIMAL(5,2),
  updated_at         TIMESTAMPTZ    DEFAULT NOW(),
  CONSTRAINT forecasts_omeo_city_timestamp_unique UNIQUE (city, forecast_timestamp)
);

CREATE INDEX IF NOT EXISTS idx_omeo_city_timestamp  ON forecasts_omeo(city, forecast_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_omeo_actuals_pending  ON forecasts_omeo(city, forecast_timestamp)
  WHERE actual_temperature IS NULL;

CREATE OR REPLACE FUNCTION update_omeo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_forecasts_omeo_updated_at ON forecasts_omeo;
CREATE TRIGGER update_forecasts_omeo_updated_at
  BEFORE UPDATE ON forecasts_omeo
  FOR EACH ROW EXECUTE FUNCTION update_omeo_updated_at();
