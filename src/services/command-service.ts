import type {
  PlayerCommand,
  CommandResult,
  CommandType,
} from "../core/domain/command";
import type { PlatformAdapter } from "../platform-adapter/platform-adapter";
import { Logger } from "../infrastructure/logger";

export interface CommandActions {
  reloadPlaylist: () => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
}

export class CommandService {
  private readonly platform: PlatformAdapter;
  private readonly logger: Logger;
  private readonly actions: CommandActions;
  private processedCorrelationIds: { [id: string]: boolean };

  constructor(
    platform: PlatformAdapter,
    logger: Logger,
    actions: CommandActions,
  ) {
    this.platform = platform;
    this.logger = logger;
    this.actions = actions;
    this.processedCorrelationIds = {};
  }

  handle(command: PlayerCommand): Promise<CommandResult> {
    if (this.processedCorrelationIds[command.correlationId]) {
      this.logger.warn("MQTT", "Duplicate command ignored", {
        correlationId: command.correlationId,
        command: command.command,
      });

      return Promise.resolve({
        type: "command_result",
        command: command.command,
        correlationId: command.correlationId,
        status: "success",
        payload: {
          duplicate: true,
        },
      });
    }

    this.processedCorrelationIds[command.correlationId] = true;

    this.logger.info("MQTT", "Handling command", {
      correlationId: command.correlationId,
      command: command.command,
    });

    return this.execute(command).catch((error: unknown) => {
      return {
        type: "command_result",
        command: command.command,
        correlationId: command.correlationId,
        status: "error",
        error: {
          code: this.mapErrorCode(command.command),
          message:
            error instanceof Error ? error.message : "Unknown command error",
        },
      } as CommandResult;
    });
  }

  private execute(command: PlayerCommand): Promise<CommandResult> {
    switch (command.command) {
      case "reload_playlist":
        return this.actions.reloadPlaylist().then(() => {
          return this.success(command.command, command.correlationId);
        });

      case "play":
        return this.actions.play().then(() => {
          return this.success(command.command, command.correlationId);
        });

      case "pause":
        return this.actions.pause().then(() => {
          return this.success(command.command, command.correlationId);
        });

      case "restart_player":
        return this.platform.restartApp().then(() => {
          return this.success(command.command, command.correlationId);
        });

      case "set_volume":
        return this.handleSetVolume(command);

      case "screenshot":
        return this.handleScreenshot(command);

      default:
        return Promise.reject(new Error("Unsupported command"));
    }
  }

  private handleSetVolume(command: PlayerCommand): Promise<CommandResult> {
    var payload = command.payload as { value?: unknown } | undefined;
    var value = payload ? payload.value : undefined;

    if (typeof value !== "number") {
      return Promise.reject(new Error("Volume value is required"));
    }

    if (!this.platform.setVolume) {
      return Promise.reject(new Error("Platform volume API not available"));
    }

    return this.platform.setVolume(value).then(() => {
      return this.success(command.command, command.correlationId, {
        value: value,
      });
    });
  }

  private handleScreenshot(command: PlayerCommand): Promise<CommandResult> {
    if (!this.platform.captureScreenshot) {
      return Promise.reject(new Error("Platform screenshot API not available"));
    }

    return this.platform.captureScreenshot().then((result) => {
      return this.success(command.command, command.correlationId, result);
    });
  }

  private success(
    command: CommandType,
    correlationId: string,
    payload?: unknown,
  ): CommandResult {
    return {
      type: "command_result",
      command: command,
      correlationId: correlationId,
      status: "success",
      payload: payload,
    };
  }

  private mapErrorCode(command: CommandType): string {
    if (command === "screenshot") {
      return "SCREENSHOT_FAILED";
    }

    if (command === "set_volume") {
      return "SET_VOLUME_FAILED";
    }

    return "COMMAND_FAILED";
  }
}
