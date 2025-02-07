const net = require('net');
require('dotenv').config();
const { Client } = require('pg');
const { checkSystem } = require('./systemMonitor');
const config = require('./config');

async function notify(bot, TELEGRAM_CHAT_IDS, msg) {
  return new Promise((resolve, reject) => {
    try {
      const sendPromises = TELEGRAM_CHAT_IDS.map(chatId => 
        bot.sendMessage(chatId, msg)
          .catch(err => console.error(`Failed to send message to ${chatId}:`, err))
      );
      
      Promise.all(sendPromises)
        .then(() => {
          console.log("Done sending notifications via Telegram");
          resolve("Done sending.");
        })
        .catch(err => {
          console.error("Error sending notifications:", err);
          resolve();
        });
    } catch (ex) {
      console.error("Error in notify function:", ex);
      resolve();
    }
  });
}

async function notifyOnCall(bot, TELEGRAM_CHAT_IDS, msg) {
  console.log("Sending notification:", msg);
  await notify(bot, TELEGRAM_CHAT_IDS, msg);
}

async function alive(bot, TELEGRAM_CHAT_IDS) {
  try {
    const systemStatus = await checkSystem(msg => notifyOnCall(bot, TELEGRAM_CHAT_IDS, msg));
    const diskUse = systemStatus?.diskUse ?? 'N/A';
    const memoryAvailable = systemStatus?.memoryAvailable ?? 'N/A';
    
    await notifyOnCall(bot, TELEGRAM_CHAT_IDS, 
      `Node Status Report\nDisk usage: ${diskUse}%\nMemory Available: ${memoryAvailable}%\nTimestamp: ${new Date().toISOString()}`
    );
  } catch (error) {
    await notifyOnCall(bot, TELEGRAM_CHAT_IDS,
      `System Check Error: ${error.message} at ${new Date().toISOString()}`
    );
    console.error("System check failed:", error);
  }
}

async function dbCheck(bot, TELEGRAM_CHAT_IDS, dbConfig) {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    const res = await client.query('SELECT COUNT(*) as fail_count FROM task WHERE status = $1', ['failed']);
    
    const failCount = parseInt(res.rows[0].fail_count);
    if (failCount > 100) {
      await notifyOnCall(bot, TELEGRAM_CHAT_IDS, 
        `Database Alert: ${failCount} failed tasks detected at ${new Date().toISOString()}`
      );
    } else {
      console.log(`Database status: ${failCount} failed tasks at ${new Date().toISOString()}`);
    }
  } catch (ex) {
    await notifyOnCall(bot, TELEGRAM_CHAT_IDS, 
      `Database Error: ${ex.message} at ${new Date().toISOString()}`
    );
    console.error("Database check failed:", ex);
  } finally {
    try {
      if (client) await client.end();
    } catch (err) {
      console.error("Error closing database connection:", err);
    }
  }
}

async function isPortReachable(port, host, timeout = 1000) {
  return new Promise((resolve, reject) => {
    try {
      const socket = new net.Socket();

      const onError = () => {
        socket.destroy();
        resolve(false);
      };

      socket.setTimeout(timeout);
      socket.once('error', onError);
      socket.once('timeout', onError);

      socket.connect(port, host, () => {
        socket.end();
        resolve(true);
      });
    } catch (ex) {
      reject(`Socket connection failed for ${host}:${port} - ${ex.message}`);
    }
  });
}

async function portCheck(bot, TELEGRAM_CHAT_IDS) {
  const portList = config.bridgeMonitoring ? [6060, 8545, 8546, 30303, 5432] : [6060, 8545, 8546, 30303];
  const unreachablePorts = [];

  for (const port of portList) {
    if (!await isPortReachable(port, "localhost")) {
      unreachablePorts.push(port);
    }
  }

  if (unreachablePorts.length > 0) {
    await notifyOnCall(bot, TELEGRAM_CHAT_IDS, 
      `Port Alert: Unable to reach ports: ${unreachablePorts.join(', ')}`
    );
  }
}

// Start monitoring cycles
function scheduleWithImmediate(fn, interval) {
    fn(); // Run immediately
    return setInterval(fn, interval);
}

module.exports = {
  notify,
  notifyOnCall,
  alive,
  dbCheck,
  portCheck,
  isPortReachable,
  scheduleWithImmediate
}; 