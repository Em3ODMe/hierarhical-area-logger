"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  Logger: () => Logger,
  createLogger: () => createLogger
});
module.exports = __toCommonJS(index_exports);

// src/Logger.ts
var import_cuid2 = require("@paralleldrive/cuid2");

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
    this.eventId = (0, import_cuid2.init)({ fingerprint: options.details.service })();
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Logger,
  createLogger
});
//# sourceMappingURL=index.cjs.map