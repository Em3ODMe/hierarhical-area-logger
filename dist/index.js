// src/Logger.ts
import { init } from "@paralleldrive/cuid2";

// src/utils.ts
var prettyStack = (stack) => {
  if (!stack) return [];
  let toReplace = "";
  const regex = /file:\/\/\/(.*)(\.wrangler|node_modules)\/.*\)/gm;
  const m = regex.exec(stack);
  if (m && m.length > 1) {
    toReplace = m[1];
  }
  return stack.split("\n").map((line) => line.trim()).filter((line) => !line.startsWith("Error: ")).map((line) => line.replace(toReplace, "")).map((line) => line.replace("file://", ""));
};
var prettyError = (err) => {
  const stack = prettyStack(err.stack);
  const message = err.message;
  return { message, stack };
};
var createRootLogEntry = ({
  path,
  method,
  details,
  eventId,
  parentEventId,
  withParentEventId
}) => {
  const url = new URL(`http://example.com${path ?? "/"}`);
  const rootLogEntry = {
    root: [
      {
        type: "info",
        message: "Request received",
        payload: {
          path: `${url.pathname}${url.search}`,
          method,
          details,
          eventId,
          ...parentEventId && { parentEventId }
        },
        timestamp: Date.now()
      }
    ]
  };
  if (withParentEventId && !parentEventId) {
    rootLogEntry.root.push({
      type: "error",
      message: "Parent event ID expected but not found",
      timestamp: Date.now()
    });
  }
  return rootLogEntry;
};

// src/Logger.ts
var Logger = class {
  constructor(options) {
    this.parentEventId = options.parentEventId;
    this.eventId = init({ fingerprint: options.details.service })();
    this.log = createRootLogEntry({
      path: options.path || "/",
      method: options.method,
      details: options.details,
      eventId: this.eventId,
      parentEventId: options.parentEventId,
      withParentEventId: options.withParentEventId
    });
  }
  // Area function that returns area-specific logger methods
  getArea(name = "dummy") {
    if (!this.log[name]) {
      this.log[name] = [];
    }
    return {
      info: (message, payload) => {
        this.log[name].push({
          type: "info",
          message,
          payload,
          timestamp: Date.now()
        });
      },
      warn: (message, payload) => {
        this.log[name].push({
          type: "warn",
          message,
          payload,
          timestamp: Date.now()
        });
      },
      error: (message, payload) => {
        this.log[name].push({
          type: "error",
          message,
          payload: payload instanceof Error ? prettyError(payload) : payload,
          timestamp: Date.now()
        });
      }
    };
  }
  // Public methods on main instance
  dump() {
    return this.log;
  }
  appendLogData(logData) {
    delete logData.root;
    this.log = { ...logData, ...this.log };
  }
};
var createLogger = (options) => {
  return new Logger(options);
};
export {
  Logger,
  createLogger
};
//# sourceMappingURL=index.js.map