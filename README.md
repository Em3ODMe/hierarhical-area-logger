# 🌲 Hierarchical Area Logger

A lightweight, structured logging utility for TypeScript applications. It allows you to scope logs to specific **Areas**, track request flows via **Event IDs**, and **dump** the entire execution history for debugging or monitoring.

## 🚀 Features

- **Scoped Logging:** Group logs by logical "areas" (e.g., `db-layer`, `auth-service`).
- **Traceability:** Automatic Event ID generation and Parent Event ID mapping for distributed tracing.
- **Structured Payloads:** Log rich objects and Error instances without losing metadata.
- **Snapshot Dumping:** Retrieve the entire log state at any time for analysis or reporting.
- **Lightweight:** Designed to be dependency-lite and predictable.

---

## 🛠 Installation

```bash
npm install hierarchical-area-logger
# or
yarn add hierarchical-area-logger

```

---

## 💡 Functionality Showcase

### 1. Basic Scoped Logging

Instead of a flat stream of text, the logger categorizes logs into logical areas.

```typescript
import { createLogger } from 'hierarchical-area-logger';

const logger = createLogger({
  details: { service: 'payment-gateway' },
});

const checkout = logger.getArea('checkout-process');

checkout.info('User started checkout');
checkout.warn('Retry attempt 1 for payment');
checkout.error('Transaction failed', new Error('Timeout'));

// View the structured output
console.log(logger.dump());
```

### 2. Request Traceability

Track a request across your system by linking `eventId` and `parentEventId`.

```typescript
const logger = createLogger({
    details: { service: 'payment-gateway' }
    path: '/api/v1/user',
    parentEventId: 'incoming-request-id-001'
});

console.log(logger.eventId); // Automatically generated unique ID
console.log(logger.parentEventId); // 'incoming-request-id-001'

```

### 3. Log Merging & State Management

You can append existing log data to a logger instance, which is useful for consolidating logs from multiple micro-tasks.

```typescript
const mainLogger = createLogger({ details: { service: 'orchestrator' } });

const externalLogs = {
  'worker-1': [
    { type: 'info', message: 'Task complete', timestamp: Date.now() },
  ],
};

mainLogger.appendLogData(externalLogs);
```

---

## 📖 API Reference

### `createLogger(options)`

Factory function to initialize a new Logger instance.

| Option          | Type      | Description                                |
| --------------- | --------- | ------------------------------------------ |
| `details`       | `Details` | Metadata about the service or environment. |
| `path`          | `string`  | (Optional) The execution path/route.       |
| `parentEventId` | `string`  | (Optional) ID of the triggering event.     |

### `LoggerInstance` Methods

- **`getArea(name: string)`**: Returns a scoped logger for a specific logic block.
- `.info(msg, payload?)`
- `.warn(msg, payload?)`
- `.error(msg, error?)`

- **`dump()`**: Returns an object containing all logs indexed by their area names.
- **`appendLogData(data)`**: Manually injects log entries into the current instance.

---

## 🧪 Development & Testing

This project uses **Vitest** for unit testing.

```bash
# Run tests
npm test

# Run tests with coverage
npm run coverage

```

> **Note:** The logger automatically creates a `root` area log entry labeled "Request received" if a `path` is provided during initialization.
