import type { LogEntry, LogLevel, LogTransport } from "./log-transport";

export class Logger {
  private readonly transports: LogTransport[];

  constructor(transports: LogTransport[]) {
    this.transports = transports;
  }

  info(module: string, message: string, meta?: unknown): void {
    this.write("info", module, message, meta);
  }

  warn(module: string, message: string, meta?: unknown): void {
    this.write("warn", module, message, meta);
  }

  error(module: string, message: string, meta?: unknown): void {
    this.write("error", module, message, meta);
  }

  private write(
    level: LogLevel,
    module: string,
    message: string,
    meta?: unknown,
  ): void {
    var entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: level,
      module: module,
      message: message,
      meta: meta,
    };

    this.transports.forEach(function (transport) {
      transport.send(entry).catch(function (error: unknown) {
        console.error("[Logger] Transport failed", error);
      });
    });
  }
}
