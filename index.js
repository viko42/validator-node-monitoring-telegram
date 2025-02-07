const TelegramBot = require('node-telegram-bot-api');
const { alive, dbCheck, portCheck, scheduleWithImmediate } = require('./lib');
const config = require('./config');

// Configuration
const TELEGRAM_BOT_TOKEN = config.telegram.token;
const TELEGRAM_CHAT_IDS = config.telegram.chatIds;
const BRIDGE_MONITORING = config.bridgeMonitoring || false;

if (!TELEGRAM_BOT_TOKEN || TELEGRAM_CHAT_IDS.length === 0) {
  console.error('Error: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_IDS environment variables must be set');
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });
const INTERVALS = {
  MINUTE: 60 * 1000,
  TEN_MINUTES: 10 * 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000
};

//===========================================
// Schedule daily status report at 18:00 GMT
//===========================================
const now = new Date();
const desiredTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);
const delay = desiredTime > now ? desiredTime - now : desiredTime.setDate(desiredTime.getDate() + 1) - now;

setTimeout(() => {
  setInterval(() => alive(bot, TELEGRAM_CHAT_IDS), INTERVALS.DAY);
}, delay);

//===========================================
// Regular System Health Checks
//===========================================

// Daily system status check
// scheduleWithImmediate(
//     () => alive(bot, TELEGRAM_CHAT_IDS), 
//     INTERVALS.DAY
// );

// Schedule database checks every 5 minutes
if (BRIDGE_MONITORING) {
  scheduleWithImmediate(
    () => dbCheck(bot, TELEGRAM_CHAT_IDS, config.db),
    5 * 60 * 1000
);
}

// Critical port availability check every minute
scheduleWithImmediate(
    () => portCheck(bot, TELEGRAM_CHAT_IDS),
    INTERVALS.MINUTE
);
