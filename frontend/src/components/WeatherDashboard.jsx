import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { ToggleButtonGroup, ToggleButton } from '@mui/material';
import { WbSunny, NightsStay } from '@mui/icons-material';
import ForecastAccuracy from './ForecastAccuracy';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const WeatherDashboard = () => {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unit, setUnit] = useState('F'); // F for Fahrenheit, C for Celsius

  useEffect(() => {
    fetchForecasts();
  }, []);

  const fetchForecasts = async () => {
    try {
      // Check if test mode is enabled via URL parameter
      const urlParams = new URLSearchParams(window.location.search);
      const isTestMode = urlParams.get('test') === 'true';

      const cities = ['San Francisco', 'New York', 'Chicago'];
      console.log('Fetching forecasts for cities:', cities);
      console.log('API URL:', import.meta.env.VITE_API_URL);
      
      const responses = await Promise.all(
        cities.map(city => 
          axios.get(`${import.meta.env.VITE_API_URL}/weather/forecast/${city}${isTestMode ? '?test=true' : ''}`)
        )
      );
      
      // Transform the data to match expected structure
      const allForecasts = responses.map((response, index) => {
        const city = cities[index];
        // Handle both test data (which already has the right structure)
        // and real data (which needs transformation)
        if (isTestMode) {
          return response.data;  // Test data already has the right structure
        } else {
          return {
            city,
            forecast: response.data.map(f => ({
              startTime: f.startTime,
              temperature: f.temperature,
              temperatureUnit: f.temperatureUnit,
              isDaytime: f.isDaytime,
              shortForecast: f.shortForecast
            }))
          };
        }
      });
      
      console.log('Transformed forecasts:', allForecasts);
      setForecasts(allForecasts);
      setLoading(false);
    } catch (err) {
      console.error('Error details:', err);
      setError(`Error fetching weather data: ${err.message}`);
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
      } else if (err.request) {
        console.error('No response received');
        console.error('Request details:', err.request);
      }
      setLoading(false);
    }
  };

  const convertTemp = (temp, targetUnit) => {
    if (targetUnit === 'C') {
      return ((temp - 32) * 5/9).toFixed(1);
    }
    return temp;
  };

  const getCityTimeZone = (city) => {
    const timeZones = {
      'San Francisco': 'America/Los_Angeles',
      'New York': 'America/New_York',
      'Chicago': 'America/Chicago'
    };
    return timeZones[city] || 'America/Los_Angeles';
  };

  const isDatetimeDaytime = (dateStr, city) => {
    const date = new Date(dateStr);
    const timeZone = getCityTimeZone(city);
    const localTime = date.toLocaleString('en-US', { timeZone, hour: 'numeric', hour12: false });
    const hour = parseInt(localTime);
    return hour >= 6 && hour < 18;
  };

  const prepareChartData = (cityData) => {
    // Get all timestamps for alignment
    const allTimestamps = cityData.forecast
      .filter(f => !f.isActual)
      .map(f => f.startTime);

    // Calculate differences between forecast and actual
    const differences = allTimestamps.map(timestamp => {
      const forecast = cityData.forecast.find(f => !f.isActual && f.startTime === timestamp);
      const actual = cityData.forecast.find(f => f.isActual && f.startTime === timestamp);
      if (!forecast || !actual) return null;
      return {
        timestamp,
        difference: actual.temperature - forecast.temperature,
        isDaytime: isDatetimeDaytime(timestamp, cityData.city)
      };
    });

    return {
      labels: allTimestamps.map(t => new Date(t).toLocaleDateString()),
      datasets: [
        {
          label: `Day ☀️ Temperature (°${unit})`,
          data: allTimestamps.map(timestamp => {
            const entry = cityData.forecast.find(f => f.startTime === timestamp && !f.isActual);
            if (!entry || !isDatetimeDaytime(timestamp, cityData.city)) return null;
            return convertTemp(entry.temperature, unit);
          }),
          fill: false,
          borderColor: '#FF9800',
          backgroundColor: '#FF9800',
          tension: 0.1,
          pointStyle: 'circle',
          yAxisID: 'y',
        },
        {
          label: `Night 🌙 Temperature (°${unit})`,
          data: allTimestamps.map(timestamp => {
            const entry = cityData.forecast.find(f => f.startTime === timestamp && !f.isActual);
            if (!entry || isDatetimeDaytime(timestamp, cityData.city)) return null;
            return convertTemp(entry.temperature, unit);
          }),
          fill: false,
          borderColor: '#2196F3',
          backgroundColor: '#2196F3',
          tension: 0.1,
          pointStyle: 'circle',
          yAxisID: 'y',
        },
        {
          label: `Day ☀️ Actual`,
          data: allTimestamps.map(timestamp => {
            const entry = cityData.forecast.find(f => f.startTime === timestamp && f.isActual);
            if (!entry || !isDatetimeDaytime(timestamp, cityData.city)) return null;
            return convertTemp(entry.temperature, unit);
          }),
          fill: false,
          borderColor: '#FFA726',
          backgroundColor: '#FFA726',
          borderDash: [5, 5],
          tension: 0.1,
          pointStyle: 'star',
          yAxisID: 'y',
        },
        {
          label: `Night 🌙 Actual`,
          data: allTimestamps.map(timestamp => {
            const entry = cityData.forecast.find(f => f.startTime === timestamp && f.isActual);
            if (!entry || isDatetimeDaytime(timestamp, cityData.city)) return null;
            return convertTemp(entry.temperature, unit);
          }),
          fill: false,
          borderColor: '#42A5F5',
          backgroundColor: '#42A5F5',
          borderDash: [5, 5],
          tension: 0.1,
          pointStyle: 'star',
          yAxisID: 'y',
        },
        {
          label: 'Forecast Accuracy',
          data: differences.map(d => d?.difference || null),
          fill: false,
          borderColor: '#4CAF50',
          backgroundColor: '#4CAF50',
          borderDash: [3, 3],
          tension: 0.1,
          pointStyle: 'triangle',
          yAxisID: 'y1',
          // Add point colors based on day/night
          pointBackgroundColor: differences.map(d => d?.isDaytime ? '#4CAF50' : '#7E57C2'),
          pointBorderColor: differences.map(d => d?.isDaytime ? '#4CAF50' : '#7E57C2'),
        }
      ]
    };
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: `Temperature (°${unit})`,
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Forecast Accuracy (°F)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className="dashboard">
      <h1>Weather Forecast Tracker</h1>
      <div className="unit-toggle-container">
        <div className="toggle-caption">Temperature Unit</div>
        <div className="unit-toggle-wrapper">
          <div 
            className="unit-toggle-slider" 
            style={{
              transform: `translateX(${unit === 'C' ? '100%' : '0'})`
            }}
          />
          <div 
            className={`unit-toggle-option ${unit === 'F' ? 'active' : ''}`}
            onClick={() => setUnit('F')}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && setUnit('F')}
          >
            °F
          </div>
          <div 
            className={`unit-toggle-option ${unit === 'C' ? 'active' : ''}`}
            onClick={() => setUnit('C')}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && setUnit('C')}
          >
            °C
          </div>
        </div>
      </div>
      <div className="charts-container">
        {forecasts.map((cityData) => (
          <div key={cityData.city} className="city-chart">
            <h2>{cityData.city}</h2>
            <Line 
              data={prepareChartData(cityData)}
              options={chartOptions}
            />
            <ForecastAccuracy city={cityData.city} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherDashboard;
