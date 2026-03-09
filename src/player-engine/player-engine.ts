import type { Playlist } from "../core/domain/playlist";
import { RendererFactory } from "./renderer-factory";

export class PlayerEngine {
  private currentIndex: number;
  private isRunning: boolean;
  private readonly rendererFactory: RendererFactory;
  private runToken: number;

  constructor(private readonly container: HTMLElement) {
    this.currentIndex = 0;
    this.isRunning = false;
    this.rendererFactory = new RendererFactory();
    this.runToken = 0;
  }

  playPlaylist(playlist: Playlist): Promise<void> {
    if (!playlist.items.length) {
      this.container.innerHTML =
        "<div class='screen'><h1>No media found</h1></div>";
      return Promise.resolve();
    }

    if (this.isRunning) {
      return Promise.resolve();
    }

    this.isRunning = true;
    this.runToken += 1;

    return this.renderLoop(playlist, this.runToken);
  }

  private renderLoop(playlist: Playlist, token: number): Promise<void> {
    var _this = this;

    if (!this.isRunning || token !== this.runToken) {
      return Promise.resolve();
    }

    var item = playlist.items[this.currentIndex];
    var renderer = this.rendererFactory.getRenderer(item);

    return renderer
      .render(this.container, item)
      .catch(function (error: unknown) {
        console.error("Render error:", error);
      })
      .then(function () {
        if (!_this.isRunning || token !== _this.runToken) {
          return Promise.resolve();
        }

        _this.currentIndex = (_this.currentIndex + 1) % playlist.items.length;
        return _this.renderLoop(playlist, token);
      });
  }

  stop(): void {
    this.isRunning = false;
    this.runToken += 1;
  }

  reset(): void {
    this.stop();
    this.currentIndex = 0;
    this.container.innerHTML = "";
  }
}
