export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  meta?: unknown;
}

export interface LogTransport {
  send(entry: LogEntry): Promise<void>;
}

export class ConsoleTransport implements LogTransport {
  send(entry: LogEntry): Promise<void> {
    var prefix =
      "[" +
      entry.timestamp +
      "] [" +
      entry.level.toUpperCase() +
      "] [" +
      entry.module +
      "]";

    if (entry.level === "error") {
      console.error(prefix, entry.message, entry.meta ?? "");
    } else if (entry.level === "warn") {
      console.warn(prefix, entry.message, entry.meta ?? "");
    } else {
      console.log(prefix, entry.message, entry.meta ?? "");
    }

    return Promise.resolve();
  }
}

export class MockRemoteTransport implements LogTransport {
  private readonly endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  send(entry: LogEntry): Promise<void> {
    console.log("[MockRemoteTransport] POST " + this.endpoint, entry);
    return Promise.resolve();
  }
}
