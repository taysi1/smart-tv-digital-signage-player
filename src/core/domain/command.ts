export type CommandType =
  | "reload_playlist"
  | "restart_player"
  | "play"
  | "pause"
  | "set_volume"
  | "screenshot";

export interface PlayerCommand<T = unknown> {
  command: CommandType;
  correlationId: string;
  timestamp: number;
  payload?: T;
}

export interface CommandResultSuccess {
  type: "command_result";
  command: CommandType;
  correlationId: string;
  status: "success";
  payload?: unknown;
}

export interface CommandResultError {
  type: "command_result";
  command: CommandType;
  correlationId: string;
  status: "error";
  error: {
    code: string;
    message: string;
  };
}

export type CommandResult = CommandResultSuccess | CommandResultError;
