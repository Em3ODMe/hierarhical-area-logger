import { init } from '@paralleldrive/cuid2';
import { createRootLogEntry, prettyError } from './utils';
import type { LogData, LoggerOptions, LogEntry, LogEntryType } from './types';

export class Logger {
  public eventId: string;
  private log: LogData;
  public parentEventId?: string;
  private defaultArea: string;

  constructor(options: LoggerOptions) {
    this.parentEventId = options.parentEventId;
    this.eventId =
      options.overrideEventId ||
      init({ fingerprint: options.details.service })();
    this.defaultArea = options.defaultArea || 'defaultArea';

    this.log = createRootLogEntry({
      path: options.path || '/',
      method: options.method,
      details: options.details,
      eventId: this.eventId,
      parentEventId: options.parentEventId,
      withParentEventId: options.withParentEventId,
    });
  }

  private finalizeRootMessage() {
    this.addMessage('root', 'info', 'Request completed', {
      totalDuration: Date.now() - this.log.root[0].timestamp,
    });
  }

  private addMessage(
    name: string,
    type: LogEntryType,
    message: string,
    payload?: LogEntry['payload'] | Error
  ) {
    const finalPayload =
      payload instanceof Error ? prettyError(payload) : payload;

    this.log[name]!.push({
      type,
      message,
      payload: finalPayload,
      timestamp: Date.now(),
    });
  }

  // Area function that returns area-specific logger methods
  public getArea(name = this.defaultArea) {
    if (!this.log[name]) {
      this.log[name] = [];
    }

    return {
      info: (message: string, payload?: LogEntry['payload']) => {
        this.addMessage(name, 'info', message, payload);
      },
      warn: (message: string, payload?: LogEntry['payload']) => {
        this.addMessage(name, 'warn', message, payload);
      },
      error: (message: string, payload?: LogEntry['payload'] | Error) => {
        this.addMessage(name, 'error', message, payload);
      },
      log: (message: string, payload?: LogEntry['payload']) => {
        this.addMessage(name, 'log', message, payload);
      },
      debug: (message: string, payload?: LogEntry['payload']) => {
        this.addMessage(name, 'debug', message, payload);
      },
    };
  }

  // Public methods on main instance
  public dump(): LogData {
    this.finalizeRootMessage();
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
