import type { MediaItem } from "../core/domain/media";
import { ImageRenderer } from "./image-renderer";
import { VideoRenderer } from "./video-renderer";

export class RendererFactory {
  private readonly imageRenderer = new ImageRenderer();
  private readonly videoRenderer = new VideoRenderer();

  getRenderer(item: MediaItem): ImageRenderer | VideoRenderer {
    if (item.type === "image") {
      return this.imageRenderer;
    }

    return this.videoRenderer;
  }
}
