import type { PlayerCommand, CommandType } from "../core/domain/command";

function isValidCommandType(value: string): value is CommandType {
  return (
    value === "reload_playlist" ||
    value === "restart_player" ||
    value === "play" ||
    value === "pause" ||
    value === "set_volume" ||
    value === "screenshot"
  );
}

export class MqttParser {
  parseCommand(raw: string): PlayerCommand {
    var data: unknown;

    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error("INVALID_JSON");
    }

    if (!data || typeof data !== "object") {
      throw new Error("INVALID_COMMAND_PAYLOAD");
    }

    var commandData = data as {
      command?: unknown;
      correlationId?: unknown;
      timestamp?: unknown;
      payload?: unknown;
    };

    if (
      typeof commandData.command !== "string" ||
      !isValidCommandType(commandData.command)
    ) {
      throw new Error("INVALID_COMMAND_TYPE");
    }

    if (
      typeof commandData.correlationId !== "string" ||
      !commandData.correlationId
    ) {
      throw new Error("INVALID_CORRELATION_ID");
    }

    if (typeof commandData.timestamp !== "number") {
      throw new Error("INVALID_TIMESTAMP");
    }

    return {
      command: commandData.command,
      correlationId: commandData.correlationId,
      timestamp: commandData.timestamp,
      payload: commandData.payload,
    };
  }
}
