export type Details = { service: string } & Record<string, unknown>;
export type Method =
  | 'get'
  | 'post'
  | 'put'
  | 'delete'
  | 'patch'
  | 'head'
  | 'options'
  | 'trace'
  | 'connect';

export type LogEntry = {
  type: 'info' | 'warn' | 'error';
  message: string;
  payload?: object;
  timestamp: number;
};
export type RootPayload = {
  path?: string;
  method?: Method;
  eventId: string;
  parentEventId?: string;
  details: Details;
};
export type CreateRootLogEntryOptions = RootPayload & {
  path?: string;
  withParentEventId?: boolean;
};
export type LogData = Record<string, LogEntry[]>;

export interface LoggerOptions {
  details: Details;
  path?: string;
  parentEventId?: string;
  withParentEventId?: boolean;
  method?: Method;
}
