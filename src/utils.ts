import { CreateRootLogEntryOptions, LogData, RootPayload } from './types';

export const prettyStack = (stack?: string): string[] => {
  if (!stack) return [];
  let toReplace = '';

  const regex = /file:\/\/\/(.*)(\.wrangler|node_modules)\/.*\)/gm;
  const m = regex.exec(stack);

  if (m && m.length > 1) {
    toReplace = m[1];
  }

  return stack
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => !line.startsWith('Error: '))
    .map((line) => line.replace(toReplace, ''))
    .map((line) => line.replace('file://', ''));
};

export const prettyError = (err: Error) => {
  const stack = prettyStack(err.stack);
  const message = err.message;
  return { message, stack };
};

export const createRootLogEntry = ({
  path,
  method,
  details,
  eventId,
  parentEventId,
  withParentEventId,
}: CreateRootLogEntryOptions): LogData => {
  const url = new URL(`http://example.com${path ?? '/'}`);

  const rootLogEntry: LogData = {
    root: [
      {
        type: 'info',
        message: 'Request received',
        payload: {
          path: `${url.pathname}${url.search}`,
          method,
          details,
          eventId,
          ...(parentEventId && { parentEventId }),
        } as RootPayload,
        timestamp: Date.now(),
      },
    ],
  };

  if (withParentEventId && !parentEventId) {
    rootLogEntry.root.push({
      type: 'error',
      message: 'Parent event ID expected but not found',
      timestamp: Date.now(),
    });
  }

  return rootLogEntry;
};
