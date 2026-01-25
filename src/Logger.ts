import { init } from '@paralleldrive/cuid2';
import { createRootLogEntry, prettyError } from './utils';
import { LogData, LoggerOptions, LogEntry } from './types';

export class Logger {
  public eventId: string;
  private log: LogData;
  public parentEventId?: string;

  constructor(options: LoggerOptions) {
    this.parentEventId = options.parentEventId;
    this.eventId = init({ fingerprint: options.details.service })();

    this.log = createRootLogEntry({
      path: options.path || '/',
      method: options.method,
      details: options.details,
      eventId: this.eventId,
      parentEventId: options.parentEventId,
      withParentEventId: options.withParentEventId,
    });
  }

  // Area function that returns area-specific logger methods
  public getArea(name = 'dummy') {
    if (!this.log[name]) {
      this.log[name] = [];
    }

    return {
      info: (message: string, payload?: LogEntry['payload']) => {
        this.log[name]!.push({
          type: 'info',
          message,
          payload,
          timestamp: Date.now(),
        });
      },
      warn: (message: string, payload?: LogEntry['payload']) => {
        this.log[name]!.push({
          type: 'warn',
          message,
          payload,
          timestamp: Date.now(),
        });
      },
      error: (message: string, payload?: LogEntry['payload'] | Error) => {
        this.log[name]!.push({
          type: 'error',
          message,
          payload: payload instanceof Error ? prettyError(payload) : payload,
          timestamp: Date.now(),
        });
      },
    };
  }

  // Public methods on main instance
  public dump(): LogData {
    return this.log;
  }

  public appendLogData(logData: LogData): void {
    delete logData.root;
    this.log = { ...logData, ...this.log };
  }
}

// Factory function for convenience
export const createLogger = (options: LoggerOptions): Logger => {
  return new Logger(options);
};
