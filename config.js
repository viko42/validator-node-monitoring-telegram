const config = {
    nodeName: "Kinstar",
    db: {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'bridge',
        password: process.env.DB_PASSWORD || 'postgres',
        port: parseInt(process.env.DB_PORT || '5432'),
        connectionTimeoutMillis: 10000,
        statement_timeout: 10000,
        query_timeout: 10000,
        keepAlive: true
  },
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
    chatIds: process.env.TELEGRAM_CHAT_IDS.split(',') || []
  },
  bridgeMonitoring: false,
};

module.exports = config;