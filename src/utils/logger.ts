import winston from 'winston';

// root directory
const rootDir = process.cwd();

// Configure logger
const edwinLogger = winston.createLogger({
    level: 'info',
    exitOnError: false,
    levels: winston.config.npm.levels,
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: `${rootDir}/.logs/app.log` }),
    ],
});

// Set log level
edwinLogger.level = 'debug';

export default edwinLogger;
