const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function checkLaunchd() {
  try {
    console.log('Checking launchd status...\n');

    // Check if our launch agent is loaded
    const { stdout: launchList } = await execAsync('launchctl list | grep weathertracker');
    console.log('Launch agent status:', launchList);

    // Check the last few system.log entries for our service
    const { stdout: logs } = await execAsync('log show --predicate \'processImagePath contains "weathertracker"\' --last 1h');
    console.log('\nRecent logs:', logs);

    // Show next scheduled run times
    const now = new Date();
    const next6am = new Date();
    const next6pm = new Date();
    
    next6am.setHours(6, 0, 0, 0);
    next6pm.setHours(18, 0, 0, 0);
    
    if (now > next6am) next6am.setDate(next6am.getDate() + 1);
    if (now > next6pm) next6pm.setDate(next6pm.getDate() + 1);
    
    console.log('\nNext scheduled runs:');
    console.log('- 6 AM run:', next6am.toLocaleString());
    console.log('- 6 PM run:', next6pm.toLocaleString());

  } catch (error) {
    if (error.message.includes('grep')) {
      console.error('Launch agent not found in launchctl list');
    } else {
      console.error('Error checking status:', error);
    }
  }
}

checkLaunchd();
