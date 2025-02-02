import pino from 'pino';

const timers = new Map<string, number>();

const baseLogger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  },
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
});

export const logger = {
  ...baseLogger,
  time: (label: string) => {
    timers.set(label, performance.now());
  },
  timeEnd: (label: string) => {
    const start = timers.get(label);
    if (start) {
      const duration = performance.now() - start;
      timers.delete(label);
      baseLogger.info(`${label}: ${duration.toFixed(2)}ms`);
    }
  },
  info: (...args: any[]) => baseLogger.info(...args),
  error: (...args: any[]) => baseLogger.error(...args),
  debug: (...args: any[]) => baseLogger.debug(...args),
  warn: (...args: any[]) => baseLogger.warn(...args)
}; 