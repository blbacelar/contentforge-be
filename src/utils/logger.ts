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
  info: (...args: Parameters<typeof baseLogger.info>) => baseLogger.info(...args),
  error: (...args: Parameters<typeof baseLogger.error>) => baseLogger.error(...args),
  debug: (...args: Parameters<typeof baseLogger.debug>) => baseLogger.debug(...args),
  warn: (...args: Parameters<typeof baseLogger.warn>) => baseLogger.warn(...args)
};    