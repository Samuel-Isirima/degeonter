import winston from 'winston';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

// Telegram bot setup
const TELEGRAM_BOT_TOKEN = '7769213897:AAG_hmRYzh793TC7XfVQFPwlyObs7LxnoZ8';
const TELEGRAM_CHAT_ID = '5521041325';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

// Get current directory (CommonJS-friendly)
const l__dirname = path.resolve(); // No `import.meta.url` needed

// Define log directory and file path
const logDir = path.join(l__dirname, 'logs'); // Adjust path as needed
const logFile = path.join(logDir, 'app.log');

// Ensure the logs directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Create the Winston logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: logFile }) // Logs written here
  ],
});

// Function to send logs to Telegram
const sendToTelegram = async (message: string) => {
  try {
    await axios.post(TELEGRAM_API_URL, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
    });
  } catch (error) {
    console.error('Error sending log to Telegram:', error);
  }
};

// Override console.log and console.error
console.log = (...args) => {
  const message = args.join(' ');
  logger.info(message);
  sendToTelegram(`[LOG] ${message}`);
};

console.error = (...args) => {
  const message = args.join(' ');
  logger.error(message);
  sendToTelegram(`[ERROR] ${message}`);
};

// Capture uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
  const errorMessage = `Uncaught Exception: ${err.stack || err.message}`;
  logger.error(errorMessage);
  sendToTelegram(errorMessage);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  const errorMessage = `Unhandled Rejection: ${reason}`;
  logger.error(errorMessage);
  sendToTelegram(errorMessage);
});

export default logger;
