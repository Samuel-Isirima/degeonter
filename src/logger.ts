import winston from 'winston';
import path from 'path';
import fs from 'fs';

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

// Redirect console.log and console.error to Winston
console.log = (...args) => logger.info(args.join(' '));
console.error = (...args) => logger.error(args.join(' '));

// Capture uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.stack || err.message}`);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
});

export default logger;
