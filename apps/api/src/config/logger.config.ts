import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

export const loggerConfig: WinstonModuleOptions = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format:
    process.env.NODE_ENV === 'production'
      ? winston.format.combine(winston.format.timestamp(), winston.format.json())
      : winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp, context }) => {
            const ctx = context ? ` [${context as string}]` : '';
            return `${timestamp as string} ${level}${ctx}: ${message as string}`;
          }),
        ),
  transports: [new winston.transports.Console()],
};
