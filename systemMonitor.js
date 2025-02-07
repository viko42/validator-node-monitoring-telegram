const si = require('systeminformation');
const config = require('./config');

async function checkSystem(notifyCallback) {
  try {
    const fs = await si.fsSize();
    const memStats = await si.mem();
    const load = await si.currentLoad();

    const metrics = {
      diskUse: fs[0].use,
      memoryAvailable: Math.floor(memStats.available / memStats.total * 100),
      cpuLoad: load.currentLoad
    };

    // Log and alert based on thresholds
    if (metrics.diskUse > 90) {
      await notifyCallback(`${config.nodeName} Critical Alert: Disk usage at ${metrics.diskUse}%`);
    } else if (metrics.diskUse > 75) {
      await notifyCallback(`${config.nodeName} Warning: Disk usage is high at ${metrics.diskUse}%`);
    }

    if (metrics.memoryAvailable < 10) {
      await notifyCallback(`${config.nodeName} Critical Alert: Only ${metrics.memoryAvailable}% memory available`);
    } else if (metrics.memoryAvailable < 20) {
      await notifyCallback(`${config.nodeName} Warning: Low memory - ${metrics.memoryAvailable}% available`);
    }

    if (metrics.cpuLoad > 90) {
      await notifyCallback(`${config.nodeName} Critical Alert: CPU load at ${metrics.cpuLoad}%`);
    }

    return metrics;
  } catch (error) {
    await notifyCallback(`${config.nodeName} System Check Error: ${error.message}`);
    console.error(`[${config.nodeName}] System check failed:`, error);
    throw error;
  }
}

module.exports = { checkSystem }; 