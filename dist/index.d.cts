type Details = {
    service: string;
} & Record<string, unknown>;
type Method = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options' | 'trace' | 'connect';
type LogEntry = {
    type: 'info' | 'warn' | 'error';
    message: string;
    payload?: object;
    timestamp: number;
};
type LogData = Record<string, LogEntry[]>;
interface LoggerOptions {
    details: Details;
    path?: string;
    parentEventId?: string;
    withParentEventId?: boolean;
    method?: Method;
}

declare class Logger {
    eventId: string;
    private log;
    parentEventId?: string;
    constructor(options: LoggerOptions);
    getArea(name?: string): {
        info: (message: string, payload?: LogEntry["payload"]) => void;
        warn: (message: string, payload?: LogEntry["payload"]) => void;
        error: (message: string, payload?: LogEntry["payload"] | Error) => void;
    };
    dump(): LogData;
    appendLogData(logData: LogData): void;
}
declare const createLogger: (options: LoggerOptions) => Logger;

export { type LogData, type LogEntry, Logger, createLogger };
