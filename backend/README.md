# Weather Tracker Backend

A Node.js backend service that collects weather forecasts twice daily and tracks forecast accuracy over time.

## Features

- 🌤️ Fetches weather forecasts from Weather.gov API
- 📊 Stores forecast data in PostgreSQL
- ⏰ Scheduled updates twice daily (6 AM & 6 PM)
- 📈 Tracks forecast accuracy
- 🚀 Deployed on Railway with 24/7 uptime

## Tech Stack

- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Scheduler**: node-cron
- **Deployment**: Railway (Docker)

## Local Development

### Prerequisites

- Node.js 20+
- PostgreSQL 15+

### Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL

# Run the server
npm run dev
```

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@host:5432/database
PORT=3000
NODE_ENV=development
ENABLE_NOTIFICATIONS=false
```

## API Endpoints

### Health Check
```
GET /health
```

### Get Recent Forecasts
```
GET /api/weather/:city/recent?hours=24
```

### Get Forecast Accuracy
```
GET /api/weather/:city/accuracy?limit=100
```

### Manually Trigger Update
```
POST /api/weather/:city/update
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Railway deployment instructions.

## Database Schema

```sql
CREATE TABLE forecasts (
  id SERIAL PRIMARY KEY,
  city VARCHAR(100) NOT NULL,
  forecast_timestamp TIMESTAMPTZ NOT NULL,
  temperature DECIMAL(5,2) NOT NULL,
  temperature_unit CHAR(1) NOT NULL,
  is_daytime BOOLEAN NOT NULL,
  actual_temperature DECIMAL(5,2),
  accuracy DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Supported Cities

- San Francisco
- New York
- Chicago

## License

MIT
