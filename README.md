# Ten Day Weather Forecast Tracker

<div align="center">

![Weather Tracking](https://img.shields.io/badge/Weather-Tracking-blue?style=for-the-badge&logo=weather&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![macOS](https://img.shields.io/badge/macOS-000000?style=for-the-badge&logo=apple&logoColor=white)

_An autonomous weather forecast tracking system that collects, analyzes, and visualizes the prediction accuracy of the National Weather Service ten day forecast_

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Architecture](#architecture) • [Contributing](#contributing)

</div>

---

## 🌟 Overview

Ten Day Weather Forecast Tracker is a fully autonomous system that continuously monitors weather forecast accuracy by collecting predictions from the National Weather Service API and comparing them with actual weather data. The system runs silently in the background on macOS, providing insights into meteorological prediction performance through an elegant web dashboard.

## ✨ Features

### 🤖 **Autonomous Operation**

- **Scheduled Data Collection**: Automatically fetches forecasts twice daily (6 AM & 6 PM)
- **Background Service**: Runs continuously via macOS launchd service
- **Zero Maintenance**: Survives reboots, handles errors gracefully
- **Smart Notifications**: macOS alerts for data updates and system status

### 📊 **Data Analytics**

- **Forecast Accuracy Tracking**: Compares predictions vs actual temperatures
- **Multi-City Monitoring**: San Francisco, New York, and Chicago
- **Historical Analysis**: Stores long-term data for trend analysis
- **Real-time Visualization**: Interactive charts and dashboards

### 🎨 **Modern Web Interface**

- **React Dashboard**: Beautiful, responsive data visualization
- **Chart.js Integration**: Interactive temperature and accuracy charts
- **Material-UI Components**: Professional, accessible interface
- **Dual Temperature Units**: Fahrenheit and Celsius support

### 🔧 **Technical Excellence**

- **MongoDB Storage**: Efficient data persistence and querying
- **RESTful API**: Clean backend architecture
- **Error Handling**: Robust error recovery and logging
- **Wake Detection**: Handles system sleep/wake cycles

## 🚀 Quick Start

### Prerequisites

- **macOS** (for launchd service)
- **Node.js** 16+ and npm
- **MongoDB** (via Homebrew recommended)
- **Git**

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/raydot/ten-day-weather-tracker.git
   cd ten-day-weather-tracker
   ```

2. **Install dependencies**

   ```bash
   npm run install:all
   ```

3. **Start MongoDB**

   ```bash
   brew services start mongodb-community
   ```

4. **Configure the background service**

   ```bash
   # Copy the launchd plist to the correct location
   cp backend/com.davekanter.weathertracker.plist ~/Library/LaunchAgents/

   # Load and start the service
   launchctl load ~/Library/LaunchAgents/com.davekanter.weathertracker.plist
   launchctl start com.davekanter.weathertracker
   ```

5. **Verify data collection**
   ```bash
   cd backend
   node scripts/check-stored-data.js
   ```

## 🎯 Usage

### View the Dashboard

```bash
npm run start:frontend
```

Navigate to `http://localhost:5173` to see the weather dashboard with forecast accuracy charts.

### Check System Status

```bash
# View recent data collection
cd backend && node scripts/check-stored-data.js

# Check service status
launchctl list | grep weathertracker

# View logs
tail -f backend/output.log
```

### Manual Data Collection

```bash
cd backend
npm start  # Runs server and triggers immediate data collection
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │   Data Sources  │
│   (React)       │◄──►│   (Node.js)      │◄──►│  Weather.gov    │
│                 │    │                  │    │      API        │
│ • Dashboard     │    │ • Express API    │    └─────────────────┘
│ • Charts        │    │ • Scheduler      │              │
│ • Visualizations│    │ • Data Models    │              ▼
└─────────────────┘    └──────────────────┘     ┌─────────────────┐
                                 │              │    MongoDB      │
                                 │              │   Database      │
                                 └─────────────►│                 │
                                                │ • Forecasts     │
                                                │ • Accuracy Data │
                                                └─────────────────┘
```

### Key Components

- **Scheduler Service**: Manages automated data collection via cron jobs
- **Weather Service**: Interfaces with National Weather Service API
- **Data Models**: MongoDB schemas for forecast and accuracy data
- **Dashboard**: React frontend for data visualization
- **Notification System**: macOS integration for status updates

## 📁 Project Structure

```
ten-day-weather-tracker/
├── backend/                 # Node.js backend service
│   ├── src/
│   │   ├── models/         # MongoDB data models
│   │   ├── routes/         # Express API routes
│   │   ├── services/       # Core business logic
│   │   └── server.js       # Main application entry
│   ├── scripts/            # Utility and monitoring scripts
│   └── package.json        # Backend dependencies
├── frontend/               # React dashboard
│   ├── src/
│   │   ├── components/     # React components
│   │   └── assets/         # Static assets
│   └── package.json        # Frontend dependencies
├── package.json            # Root project configuration
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables

Create `backend/.env`:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/weather-tracker
NODE_ENV=development
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

### Customization

- **Cities**: Modify `backend/src/services/weather.service.js` to add/remove cities
- **Schedule**: Adjust collection times in `backend/src/services/scheduler.service.js`
- **Notifications**: Configure alert preferences in the scheduler service

## 📈 Data Collection

The system automatically:

- Fetches 10-day forecasts twice daily
- Stores temperature predictions with timestamps
- Tracks forecast accuracy over time
- Handles API rate limits and network errors
- Provides detailed logging for monitoring

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📝 License

This project is licensed under the Unlicense - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **National Weather Service** for providing free, reliable weather data
- **MongoDB** for excellent document database capabilities
- **React & Chart.js** for powerful visualization tools
- **Node.js ecosystem** for robust backend development

---

<div align="center">

**Built with ❤️ for weather enthusiasts and data lovers**

[⭐ Star this repo](https://github.com/raydot/ten-day-weather-tracker) if you find it useful!

</div>
