import { describe, it, expect } from 'vitest';
import { prettyStack, prettyError, createRootLogEntry } from '../src/utils';
import { Details, Method, RootPayload } from '../src/types';

describe('prettyStack', () => {
  it('should return empty array for undefined input', () => {
    const result = prettyStack(undefined);
    expect(result).toEqual([]);
  });

  it('should return empty array for null input', () => {
    const result = prettyStack(null as unknown as string);
    expect(result).toEqual([]);
  });

  it('should return empty array for empty string input', () => {
    const result = prettyStack('');
    expect(result).toEqual([]);
  });

  it('should filter out lines starting with "Error: "', () => {
    const stack = `Error: Test error
    at Object.test (/path/to/file.js:1:1)
    at Object.test2 (/path/to/file.js:2:2)`;

    const result = prettyStack(stack);
    expect(result.join('\n')).not.toContain('Error: Test error');
    expect(result).toContain('at Object.test (/path/to/file.js:1:1)');
    expect(result).toContain('at Object.test2 (/path/to/file.js:2:2)');
  });

  it('should trim whitespace from each line', () => {
    const stack = `    at Object.test (/path/to/file.js:1:1)
        at Object.test2 (/path/to/file.js:2:2)`;

    const result = prettyStack(stack);
    expect(result).toContain('at Object.test (/path/to/file.js:1:1)');
    expect(result).toContain('at Object.test2 (/path/to/file.js:2:2)');
  });

  it('should remove file:// prefix from lines', () => {
    const stack = `at Object.test (file:///path/to/file.js:1:1)
at Object.test2 (file:///another/path.js:2:2)`;

    const result = prettyStack(stack);

    expect(result).toEqual(
      expect.arrayContaining([
        'at Object.test (/path/to/file.js:1:1)',
        'at Object.test2 (/another/path.js:2:2)',
      ])
    );
    expect(result.join('\n')).not.toContain('file://');
  });

  it('should replace .wrangler paths in stack traces', () => {
    const stack = `at Object.test (file:///some/path/.wrangler/test/file.js:1:1)
at Object.test2 (file:///another/path/file.js:2:2)`;

    const result = prettyStack(stack);
    // Based on actual behavior, it keeps the .wrangler prefix
    expect(result).toEqual(
      expect.arrayContaining([
        'at Object.test (/.wrangler/test/file.js:1:1)',
        'at Object.test2 (/another/path/file.js:2:2)',
      ])
    );
  });

  it('should replace node_modules paths in stack traces', () => {
    const stack = `at Object.test (file:///some/path/node_modules/module/file.js:1:1)
at Object.test2 (file:///another/path/file.js:2:2)`;

    const result = prettyStack(stack);
    // Based on actual behavior, it keeps the /node_modules prefix
    expect(result).toEqual(
      expect.arrayContaining([
        'at Object.test (/node_modules/module/file.js:1:1)',
        'at Object.test2 (/another/path/file.js:2:2)',
      ])
    );
  });

  it('should handle complex stack traces with mixed paths', () => {
    const stack = `Error: Complex error
    at Object.test1 (file:///project/.wrangler/test.js:1:1)
    at Object.test2 (file:///project/node_modules/module/index.js:2:2)
    at Object.test3 (file:///normal/path/file.js:3:3)`;

    const result = prettyStack(stack);

    expect(result).toEqual(
      expect.arrayContaining([
        'at Object.test1 (/.wrangler/test.js:1:1)',
        'at Object.test2 (/node_modules/module/index.js:2:2)',
        'at Object.test3 (/normal/path/file.js:3:3)',
      ])
    );
    expect(result.join('\n')).not.toContain('file://');
  });

  it('should handle stack traces without matching regex pattern', () => {
    const stack = `at Object.test (file:///simple/path/file.js:1:1)
at Object.test2 (file:///another/path/file.js:2:2)`;

    const result = prettyStack(stack);
    expect(result).toEqual(
      expect.arrayContaining([
        'at Object.test (/simple/path/file.js:1:1)',
        'at Object.test2 (/another/path/file.js:2:2)',
      ])
    );
  });

  it('should preserve order of stack lines', () => {
    const stack = `Error: Test error
    at Object.first (/path/first.js:1:1)
    at Object.second (/path/second.js:2:2)
    at Object.third (/path/third.js:3:3)`;

    const result = prettyStack(stack);
    expect(result[0]).toContain('at Object.first (/path/first.js:1:1)');
    expect(result[1]).toContain('at Object.second (/path/second.js:2:2)');
    expect(result[2]).toContain('at Object.third (/path/third.js:3:3)');
  });
});

describe('prettyError', () => {
  it('should extract message and stack from standard Error', () => {
    const errorMessage = 'Test error message';
    const stackMessage =
      'Error: Test error message\n    at Object.test (/path/to/file.js:1:1)';

    const error = new Error(errorMessage);
    error.stack = stackMessage;

    const result = prettyError(error);

    expect(result).toHaveProperty('message', errorMessage);
    expect(result).toHaveProperty('stack');
    expect(Array.isArray(result.stack)).toBe(true);
  });

  it('should handle Error without stack', () => {
    const error = new Error('Test error');
    delete (error as Error & { stack?: string }).stack;

    const result = prettyError(error);

    expect(result.message).toBe('Test error');
    expect(result.stack).toEqual([]);
  });

  it('should handle Error with empty message', () => {
    const error = new Error('');
    error.stack = 'Error: \n    at Object.test (/path/to/file.js:1:1)';

    const result = prettyError(error);

    expect(result.message).toBe('');
    expect(result.stack).toBeDefined();
  });

  it('should handle custom Error classes', () => {
    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'CustomError';
      }
    }

    const error = new CustomError('Custom error message');
    error.stack =
      'CustomError: Custom error message\n    at Object.test (/path/to/file.js:1:1)';

    const result = prettyError(error);

    expect(result.message).toBe('Custom error message');
    expect(result.stack).toBeDefined();
  });

  it('should process the stack through prettyStack', () => {
    const error = new Error('Test error');
    error.stack = `Error: Test error
    at Object.test (file:///path/.wrangler/file.js:1:1)`;

    const result = prettyError(error);

    const stackString = result.stack.join('\n');
    expect(stackString).not.toContain('file://');
    expect(stackString).toContain('file.js:1:1');
    expect(stackString).not.toContain('Error: Test error');
  });
});

describe('createRootLogEntry', () => {
  const mockDetails: Details = { service: 'test-service', version: '1.0.0' };
  const mockEventId = 'test-event-123';

  it('should create basic root log entry with required fields', () => {
    const options = {
      path: '/api/test',
      method: 'get' as Method,
      details: mockDetails,
      eventId: mockEventId,
    };

    const result = createRootLogEntry(options);

    expect(result).toHaveProperty('root');
    expect(Array.isArray(result.root)).toBe(true);
    expect(result.root).toHaveLength(1);

    const entry = result.root[0];
    expect(entry.type).toBe('info');
    expect(entry.message).toBe('Request received');
    expect(entry.payload).toBeDefined();
    expect(entry.timestamp).toBeDefined();
    expect(typeof entry.timestamp).toBe('number');
  });

  it('should handle path correctly', () => {
    const options = {
      path: '/api/users/123',
      method: 'get' as Method,
      details: mockDetails,
      eventId: mockEventId,
    };

    const result = createRootLogEntry(options);
    const payload = result.root[0].payload as RootPayload;

    expect(payload.path).toBe('/api/users/123');
  });

  it('should handle method correctly', () => {
    const options = {
      path: '/api/test',
      method: 'post' as Method,
      details: mockDetails,
      eventId: mockEventId,
    };

    const result = createRootLogEntry(options);
    const payload = result.root[0].payload as RootPayload;

    expect(payload.path).toBe('/api/test');
    expect(payload.method).toBe('post');
  });

  it('should include parentEventId when provided', () => {
    const parentEventId = 'parent-event-456';
    const options = {
      path: '/api/test',
      method: 'put' as Method,
      details: mockDetails,
      eventId: mockEventId,
      parentEventId,
    };

    const result = createRootLogEntry(options);
    const payload = result.root[0].payload as RootPayload;

    expect(payload.parentEventId).toBe(parentEventId);
  });

  it('should not include parentEventId when not provided', () => {
    const options = {
      path: '/api/test',
      method: 'delete' as Method,
      details: mockDetails,
      eventId: mockEventId,
    };

    const result = createRootLogEntry(options);
    const payload = result.root[0].payload as RootPayload;

    expect(payload.parentEventId).toBeUndefined();
  });

  it('should add error log when withParentEventId is true but no parentEventId provided', () => {
    const options = {
      path: '/api/test',
      method: 'patch' as Method,
      details: mockDetails,
      eventId: mockEventId,
      withParentEventId: true,
    };

    const result = createRootLogEntry(options);

    expect(result.root).toHaveLength(2);

    const infoEntry = result.root[0];
    const errorEntry = result.root[1];

    expect(infoEntry.type).toBe('info');
    expect(infoEntry.message).toBe('Request received');

    expect(errorEntry.type).toBe('error');
    expect(errorEntry.message).toBe('Parent event ID expected but not found');
    expect(errorEntry.payload).toBeUndefined();
  });

  it('should not add error log when withParentEventId is true and parentEventId is provided', () => {
    const options = {
      path: '/api/test',
      method: 'head' as Method,
      details: mockDetails,
      eventId: mockEventId,
      parentEventId: 'parent-123',
      withParentEventId: true,
    };

    const result = createRootLogEntry(options);

    expect(result.root).toHaveLength(1);
    expect(result.root[0].type).toBe('info');
  });

  it('should not add error log when withParentEventId is false', () => {
    const options = {
      path: '/api/test',
      method: 'options' as Method,
      details: mockDetails,
      eventId: mockEventId,
      withParentEventId: false,
    };

    const result = createRootLogEntry(options);

    expect(result.root).toHaveLength(1);
    expect(result.root[0].type).toBe('info');
  });

  it('should handle all HTTP methods', () => {
    const methods: Method[] = [
      'get',
      'post',
      'put',
      'delete',
      'patch',
      'head',
      'options',
      'trace',
      'connect',
    ];

    methods.forEach((method) => {
      const options = {
        path: '/api/test',
        method,
        details: mockDetails,
        eventId: mockEventId,
      };

      const result = createRootLogEntry(options);
      const payload = result.root[0].payload as RootPayload;

      expect(payload.method).toBe(method);
    });
  });

  it('should preserve complex details object', () => {
    const complexDetails: Details = {
      service: 'api-gateway',
      version: '2.1.0',
      environment: 'production',
      region: 'us-east-1',
      userId: 12345,
      metadata: { feature: 'logging', enabled: true },
    };

    const options = {
      path: '/api/test',
      method: 'get' as Method,
      details: complexDetails,
      eventId: mockEventId,
    };

    const result = createRootLogEntry(options);
    const payload = result.root[0].payload as RootPayload;

    expect(payload.details).toEqual(complexDetails);
  });

  it('should generate reasonable timestamps', () => {
    const beforeTime = Date.now();

    const options = {
      path: '/api/test',
      method: 'get' as Method,
      details: mockDetails,
      eventId: mockEventId,
    };

    const result = createRootLogEntry(options);
    const afterTime = Date.now();

    const timestamp = result.root[0].timestamp;

    expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
    expect(timestamp).toBeLessThanOrEqual(afterTime);
  });

  it('should handle different paths', () => {
    const options = {
      path: '/api/users',
      method: 'get' as Method,
      details: mockDetails,
      eventId: mockEventId,
    };

    const result = createRootLogEntry(options);
    const payload = result.root[0].payload as RootPayload;

    expect(payload.path).toBe('/api/users');
  });

  it('should handle paths with different segments', () => {
    const options = {
      path: '/users?page=2&limit=10',
      method: 'get' as Method,
      details: mockDetails,
      eventId: mockEventId,
    };

    const result = createRootLogEntry(options);
    const payload = result.root[0].payload as RootPayload;

    // Based on actual behavior, the full path including query params is preserved
    expect(payload.path).toBe('/users?page=2&limit=10');
  });

  it('should maintain correct payload structure type', () => {
    const options = {
      path: '/api/test',
      method: 'get' as Method,
      details: mockDetails,
      eventId: mockEventId,
      parentEventId: 'parent-123',
    };

    const result = createRootLogEntry(options);
    const payload = result.root[0].payload as RootPayload;

    expect(payload).toHaveProperty('path');
    expect(payload).toHaveProperty('method');
    expect(payload).toHaveProperty('details');
    expect(payload).toHaveProperty('eventId');
    expect(payload).toHaveProperty('parentEventId');
  });
});
