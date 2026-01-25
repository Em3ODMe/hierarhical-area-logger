import { describe, it, expect } from 'vitest';
import { createLogger, Logger } from '../src/Logger';
import { Details } from '../src/types';

describe('Logger', () => {
  const mockdetails: Details = { service: 'test-service' };

  it('should create a logger with details', () => {
    const logger = createLogger({ details: mockdetails });
    expect(logger).toBeInstanceOf(Logger);
  });

  it('should create a logger with custom options', () => {
    const logger = createLogger({
      details: mockdetails,
      path: 'test-path',
      parentEventId: 'parent-123',
    });
    expect(logger).toBeInstanceOf(Logger);
  });

  it('should create area logger and log messages', () => {
    const logger = createLogger({ details: mockdetails });
    const areaLogger = logger.getArea('test-area');

    areaLogger.info('test info message');
    areaLogger.warn('test warn message');
    areaLogger.error('test error message');

    const logs = logger.dump();
    expect(logs['test-area']).toHaveLength(3);
    expect(logs['test-area'][0].message).toBe('test info message');
    expect(logs['test-area'][1].type).toBe('warn');
    expect(logs['test-area'][2].type).toBe('error');
  });

  it('should generate event IDs correctly', () => {
    const logger = createLogger({ details: mockdetails });

    expect(logger.eventId).toBeDefined();
    expect(typeof logger.eventId).toBe('string');
  });

  it('should handle parent event ID', () => {
    const logger = createLogger({
      details: mockdetails,
      parentEventId: 'parent-123',
    });

    expect(logger.parentEventId).toBe('parent-123');
  });

  it('should append log data', () => {
    const logger = createLogger({ details: mockdetails });
    const logDataToAdd = {
      area1: [
        {
          type: 'info' as const,
          message: 'existing log',
          timestamp: Date.now(),
        },
      ],
    };

    logger.appendLogData(logDataToAdd);
    const logs = logger.dump();

    expect(logs.area1).toBeDefined();
    expect(logs.area1[0].message).toBe('existing log');
  });

  it('should create root log entry', () => {
    const logger = createLogger({ details: mockdetails, path: 'test' });
    const logs = logger.dump();

    expect(logs.root).toBeDefined();
    expect(logs.root).toHaveLength(1);
    expect(logs.root[0].message).toBe('Request received');
  });

  it('should handle errors in error logging', () => {
    const logger = createLogger({ details: mockdetails });
    const areaLogger = logger.getArea('test-area');

    const testError = new Error('Test error');
    areaLogger.error('error occurred', testError);

    const logs = logger.dump();
    expect(logs['test-area'][0].payload).toHaveProperty(
      'message',
      'Test error'
    );
  });

  it('should use default area name when no name provided', () => {
    const logger = createLogger({ details: mockdetails });
    const areaLogger = logger.getArea();

    areaLogger.info('test message');

    const logs = logger.dump();
    expect(logs.dummy).toBeDefined();
    expect(logs.dummy).toHaveLength(1);
    expect(logs.dummy[0].message).toBe('test message');
  });

  it('should handle withParentEventId true without parentEventId', () => {
    const logger = createLogger({
      details: mockdetails,
      withParentEventId: true,
    });

    const logs = logger.dump();
    expect(logs.root).toHaveLength(2);
    expect(logs.root[1].type).toBe('error');
    expect(logs.root[1].message).toBe('Parent event ID expected but not found');
  });
});

describe('createLogger', () => {
  const mockdetails: Details = { service: 'test-service' };

  it('should create a logger instance', () => {
    const logger = createLogger({ details: mockdetails });
    expect(logger).toBeInstanceOf(Logger);
  });

  it('should create a logger with options', () => {
    const logger = createLogger({
      details: mockdetails,
      path: 'test-path',
      parentEventId: 'parent-123',
    });
    expect(logger).toBeInstanceOf(Logger);
  });
});
