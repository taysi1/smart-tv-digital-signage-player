import type { PlatformAdapter } from "../platform-adapter/platform-adapter";
import { Logger } from "../infrastructure/logger";
import { getConfig } from "../infrastructure/config";
import { PlaybackService } from "./playback-service";
import { PlaylistService } from "./playlist-service";
import { CommandService } from "./command-service";
import { RealMqttClient } from "../mqtt-layer/mqtt-client";
import { MqttParser } from "../mqtt-layer/mqtt-parser";
import { MqttTopics } from "../mqtt-layer/mqtt-topics";
import type { PlayerCommand } from "../core/domain/command";

export class AppService {
  private readonly platform: PlatformAdapter;
  private readonly logger: Logger;
  private playbackService: PlaybackService | null;
  private mqttClient: RealMqttClient | null;
  private playlistService: PlaylistService | null;

  constructor(platform: PlatformAdapter, logger: Logger) {
    this.platform = platform;
    this.logger = logger;
    this.playbackService = null;
    this.mqttClient = null;
    this.playlistService = null;
  }

  start(): Promise<void> {
    var _this = this;
    var appElement = document.getElementById("app");

    if (!appElement) {
      return Promise.reject(new Error("App root not found"));
    }

    var app: HTMLElement = appElement;

    return this.platform
      .init()
      .then(function () {
        _this.logger.info("APP", "Application started", {
          platform: _this.platform.getPlatformName(),
          device: _this.platform.getDeviceId(),
        });

        _this.playlistService = new PlaylistService();

        _this.bindLifecycle();

        return _this.playlistService.getPlaylist().then(function (result) {
          _this.logger.info("PLAYLIST", "Playlist loaded successfully", {
            itemCount: result.playlist.items.length,
            source: result.source,
            changed: result.changed,
            version: result.playlist.version,
            hash: result.playlist.hash,
          });

          _this.playbackService = new PlaybackService(app, _this.logger);
          _this.bootstrapMqtt();

          return _this.playbackService.start(result.playlist);
        });
      })
      .catch(function (error: unknown) {
        _this.logger.error("APP", "Failed to start playback", error);
        app.innerHTML =
          "<div class='screen'><h1>Playback Failed</h1><p>" +
          (error instanceof Error ? error.message : "Playlist yüklenemedi.") +
          "</p></div>";
      });
  }

  private bindLifecycle(): void {
    var _this = this;

    if (this.platform.onVisibilityChange) {
      this.platform.onVisibilityChange(function (visible: boolean) {
        _this.logger.info("LIFECYCLE", "Visibility changed", {
          visible: visible,
        });

        if (!_this.playbackService) {
          return;
        }

        if (visible) {
          _this.playbackService.onVisible().catch(function (error: unknown) {
            _this.logger.error("LIFECYCLE", "Resume failed", error);
          });
        } else {
          _this.playbackService.onHidden();
        }
      });
    }
  }

  private bootstrapMqtt(): void {
    var _this = this;
    var deviceId = this.platform.getDeviceId();
    var parser = new MqttParser();
    var config = getConfig();

    var mqttClient = new RealMqttClient({
      brokerUrl: config.mqttBrokerUrl,
      username: config.mqttUsername,
      password: config.mqttPassword,
      clientId: "player-" + deviceId + "-" + Date.now(),
    });

    var commandService = new CommandService(this.platform, this.logger, {
      reloadPlaylist: function () {
        if (!_this.playlistService || !_this.playbackService) {
          return Promise.reject(new Error("Services not initialized"));
        }

        return _this.playlistService.getPlaylist().then(function (result) {
          _this.logger.info("PLAYLIST", "Reload playlist result", {
            source: result.source,
            changed: result.changed,
            version: result.playlist.version,
            hash: result.playlist.hash,
          });

          if (!result.changed && result.source === "network") {
            _this.logger.info(
              "PLAYLIST",
              "Reload skipped because playlist is unchanged",
            );
            return Promise.resolve();
          }

          return _this.playbackService!.reload(result.playlist);
        });
      },
      play: function () {
        if (!_this.playbackService) {
          return Promise.reject(new Error("Playback service not initialized"));
        }
        return _this.playbackService.play();
      },
      pause: function () {
        if (!_this.playbackService) {
          return Promise.reject(new Error("Playback service not initialized"));
        }
        return _this.playbackService.pause();
      },
    });

    this.mqttClient = mqttClient;

    mqttClient
      .connect()
      .then(function () {
        return mqttClient.subscribe(
          MqttTopics.commandTopic(deviceId),
          function (topic, payload) {
            _this.logger.info("MQTT", "Incoming command message", {
              topic: topic,
              payload: payload,
            });

            var parsedCommand: PlayerCommand;

            try {
              parsedCommand = parser.parseCommand(payload);
            } catch (error) {
              _this.logger.error("MQTT", "Command parse failed", error);
              return;
            }

            if (parsedCommand.command === "restart_player") {
              _this.handleSoftRestart(parsedCommand, mqttClient, deviceId);
              return;
            }

            commandService.handle(parsedCommand).then(function (result) {
              return mqttClient.publish(
                MqttTopics.eventTopic(deviceId),
                JSON.stringify(result),
              );
            });
          },
        );
      })
      .then(function () {
        _this.logger.info("MQTT", "MQTT bootstrap completed", {
          commandTopic: MqttTopics.commandTopic(deviceId),
          eventTopic: MqttTopics.eventTopic(deviceId),
          brokerUrl: config.mqttBrokerUrl,
        });
      })
      .catch(function (error: unknown) {
        _this.logger.error("MQTT", "MQTT bootstrap failed", error);
      });
  }

  private handleSoftRestart(
    command: PlayerCommand,
    mqttClient: RealMqttClient,
    deviceId: string,
  ): void {
    var _this = this;

    this.logger.warn("APP", "Soft restart command received", {
      correlationId: command.correlationId,
    });

    if (!this.playbackService) {
      mqttClient.publish(
        MqttTopics.eventTopic(deviceId),
        JSON.stringify({
          type: "command_result",
          command: command.command,
          correlationId: command.correlationId,
          status: "error",
          error: {
            code: "RESTART_FAILED",
            message: "Playback service not initialized",
          },
        }),
      );
      return;
    }

    this.playbackService
      .restart()
      .then(function () {
        return mqttClient.publish(
          MqttTopics.eventTopic(deviceId),
          JSON.stringify({
            type: "command_result",
            command: command.command,
            correlationId: command.correlationId,
            status: "success",
          }),
        );
      })
      .catch(function (error: unknown) {
        _this.logger.error("APP", "Soft restart failed", error);

        return mqttClient.publish(
          MqttTopics.eventTopic(deviceId),
          JSON.stringify({
            type: "command_result",
            command: command.command,
            correlationId: command.correlationId,
            status: "error",
            error: {
              code: "RESTART_FAILED",
              message:
                error instanceof Error
                  ? error.message
                  : "Unknown restart error",
            },
          }),
        );
      });
  }

  dispose(): void {
    this.logger.warn("APP", "Disposing application resources");

    if (this.playbackService) {
      this.playbackService.stop();
    }

    if (this.platform.dispose) {
      this.platform.dispose();
    }

    if (this.mqttClient) {
      this.mqttClient.disconnect().catch(function () {
        return;
      });
    }
  }
}
