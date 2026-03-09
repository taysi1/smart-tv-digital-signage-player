import type { Playlist } from "../core/domain/playlist";
import { Logger } from "../infrastructure/logger";
import { PlayerEngine } from "../player-engine/player-engine";

export class PlaybackService {
  private readonly playerEngine: PlayerEngine;
  private readonly logger: Logger;
  private currentPlaylist: Playlist | null;
  private isPaused: boolean;

  constructor(container: HTMLElement, logger: Logger) {
    this.playerEngine = new PlayerEngine(container);
    this.logger = logger;
    this.currentPlaylist = null;
    this.isPaused = false;
  }

  start(playlist: Playlist): Promise<void> {
    this.currentPlaylist = playlist;
    this.isPaused = false;
    this.logger.info("PLAYER", "Playback started", {
      count: playlist.items.length,
    });
    return this.playerEngine.playPlaylist(playlist);
  }

  stop(): void {
    this.logger.warn("PLAYER", "Playback stopped");
    this.playerEngine.stop();
  }

  pause(): Promise<void> {
    this.logger.info("PLAYER", "Pause requested");
    this.isPaused = true;
    this.playerEngine.stop();
    return Promise.resolve();
  }

  play(): Promise<void> {
    this.logger.info("PLAYER", "Play requested");

    if (!this.currentPlaylist) {
      return Promise.reject(new Error("No playlist loaded"));
    }

    this.isPaused = false;
    return this.playerEngine.playPlaylist(this.currentPlaylist);
  }

  reload(playlist: Playlist): Promise<void> {
    this.logger.info("PLAYER", "Reload requested", {
      count: playlist.items.length,
    });

    this.playerEngine.reset();
    this.currentPlaylist = playlist;
    this.isPaused = false;
    return this.playerEngine.playPlaylist(playlist);
  }

  restart(): Promise<void> {
    this.logger.warn("PLAYER", "Soft restart requested");

    if (!this.currentPlaylist) {
      return Promise.reject(new Error("No playlist loaded"));
    }

    this.playerEngine.reset();
    this.isPaused = false;
    return this.playerEngine.playPlaylist(this.currentPlaylist);
  }

  onHidden(): void {
    this.logger.warn("PLAYER", "App hidden, stopping playback");
    this.playerEngine.stop();
  }

  onVisible(): Promise<void> {
    this.logger.info("PLAYER", "App visible, resuming playback");

    if (!this.currentPlaylist) {
      return Promise.resolve();
    }

    if (this.isPaused) {
      this.logger.info(
        "PLAYER",
        "Resume skipped because player is paused by command",
      );
      return Promise.resolve();
    }

    return this.playerEngine.playPlaylist(this.currentPlaylist);
  }
}
