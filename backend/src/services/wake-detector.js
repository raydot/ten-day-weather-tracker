const { spawn } = require('child_process');

let lastWakeTime = 0;
const DEBOUNCE_INTERVAL = 5000; // 5 seconds

function onWake(callback) {
  // Use log stream to monitor system wake events in real-time
  const process = spawn('log', ['stream', '--predicate', 'eventMessage contains "Wake from"']);
  
  process.stdout.on('data', (data) => {
    const now = Date.now();
    if (now - lastWakeTime > DEBOUNCE_INTERVAL) {
      lastWakeTime = now;
      console.log('System wake detected at:', new Date().toLocaleString());
      callback();
    }
  });

  process.stderr.on('data', (data) => {
    console.error('Wake detection error:', data.toString());
  });

  process.on('error', (error) => {
    console.error('Wake detector process error:', error);
  });

  return process;
}

module.exports = { onWake };
