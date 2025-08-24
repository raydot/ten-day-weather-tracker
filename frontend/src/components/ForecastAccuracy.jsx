import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';

const ForecastAccuracy = ({ city }) => {
  const [accuracyData, setAccuracyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAccuracyData();
  }, [city]);

  const fetchAccuracyData = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/weather/accuracy/${city}`);
      const data = await response.json();
      setAccuracyData(data);
      setLoading(false);
    } catch (err) {
      setError(`Error fetching accuracy data: ${err.message}`);
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    if (!accuracyData) return null;

    return {
      labels: accuracyData.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Predicted Temperature',
          data: accuracyData.map(d => d.predictedTemp),
          borderColor: 'rgb(75, 192, 192)',
          fill: false
        },
        {
          label: 'Actual Temperature',
          data: accuracyData.map(d => d.actualTemp),
          borderColor: 'rgb(255, 99, 132)',
          fill: false
        }
      ]
    };
  };

  const calculateAverageAccuracy = () => {
    if (!accuracyData || accuracyData.length === 0) return 'N/A';
    const totalAccuracy = accuracyData.reduce((sum, record) => sum + record.accuracy, 0);
    return `${(totalAccuracy / accuracyData.length).toFixed(1)}%`;
  };

  if (loading) return <div>Loading accuracy data...</div>;
  if (error) return <div>{error}</div>;
  if (!accuracyData || accuracyData.length === 0) return <div>No historical data available yet</div>;

  const chartData = prepareChartData();

  return (
    <div className="accuracy-chart">
      <h3>{city} Forecast Accuracy</h3>
      <div className="accuracy-stats">
        <p>Average Accuracy: {calculateAverageAccuracy()}</p>
        <p>Days Tracked: {accuracyData.length}</p>
      </div>
      {chartData && (
        <Line 
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Predicted vs Actual Temperatures'
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const accuracy = accuracyData[context.dataIndex].accuracy;
                    return `${context.dataset.label}: ${context.parsed.y}°F (Accuracy: ${accuracy ? accuracy.toFixed(1) + '%' : 'N/A'})`;
                  }
                }
              }
            },
            scales: {
              y: {
                title: {
                  display: true,
                  text: 'Temperature (°F)'
                }
              }
            }
          }}
        />
      )}
    </div>
  );
};

export default ForecastAccuracy;
