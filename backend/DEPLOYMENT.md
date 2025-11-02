# Weather Tracker - Railway Deployment Guide

## Prerequisites
- Railway account (sign up at https://railway.app)
- GitHub account (to connect your repo)

## Step-by-Step Deployment

### 1. Push Code to GitHub
```bash
cd /Users/davekanter/Documents/Dave/tenday02
git init
git add .
git commit -m "Initial commit - PostgreSQL migration"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Set Up Railway Project

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select your `tenday02` repository
4. Railway will detect the Dockerfile automatically

### 3. Add PostgreSQL Database

1. In your Railway project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically provision a PostgreSQL database
4. The `DATABASE_URL` environment variable will be automatically set

### 4. Configure Environment Variables

In Railway project settings, add these variables:
- `NODE_ENV` = `production`
- `PORT` = `3000` (Railway sets this automatically)
- `ENABLE_NOTIFICATIONS` = `false` (notifications won't work on server)
- `DATABASE_URL` = (automatically set by Railway)

### 5. Deploy

1. Railway will automatically deploy when you push to GitHub
2. Or click "Deploy" in the Railway dashboard
3. Wait for build to complete (~2-3 minutes)

### 6. Verify Deployment

Check the deployment logs in Railway dashboard:
- Look for "Connected to PostgreSQL database"
- Look for "Database schema initialized successfully"
- Look for "Server running on port 3000"
- Look for "Starting scheduled forecast updates..."

### 7. Test the API

Get your Railway app URL (e.g., `https://your-app.railway.app`)

Test endpoints:
```bash
# Health check
curl https://your-app.railway.app/health

# Get recent forecasts for San Francisco
curl https://your-app.railway.app/api/weather/San%20Francisco/recent

# Manually trigger update
curl -X POST https://your-app.railway.app/api/weather/San%20Francisco/update
```

## Monitoring

### View Logs
- Go to Railway dashboard → Your service → Logs
- Watch for scheduled updates at 6 AM and 6 PM

### Check Database
Railway provides a built-in database viewer:
1. Click on your PostgreSQL service
2. Click "Data" tab
3. View the `forecasts` table

### Cost Monitoring
- Railway dashboard shows usage
- Your app should use ~$2-3/month
- Well within the $5/month free credit

## Troubleshooting

### Database Connection Issues
Check that `DATABASE_URL` is set correctly in environment variables.

### Build Failures
Check Railway logs for errors. Common issues:
- Missing dependencies in package.json
- Dockerfile syntax errors

### App Not Starting
1. Check logs for errors
2. Verify PORT environment variable
3. Ensure database schema initialized

## Updating the App

```bash
# Make changes locally
git add .
git commit -m "Your changes"
git push

# Railway will automatically redeploy
```

## Local Testing with PostgreSQL

If you want to test locally before deploying:

```bash
# Install PostgreSQL locally
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb weather_tracker

# Set environment variable
export DATABASE_URL="postgresql://localhost:5432/weather_tracker"

# Run the app
npm start
```

## Cost Estimate

- **Compute**: ~$2/month (shared-cpu-1x, 256MB)
- **Database**: ~$1/month (PostgreSQL, 1GB)
- **Total**: ~$3/month (within $5 free credit)

**You won't be charged anything!**
