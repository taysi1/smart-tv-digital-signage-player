import type { Playlist } from "../core/domain/playlist";
import type { StorageLayer } from "./storage";

export interface CachedPlaylistEnvelope {
  savedAt: number;
  playlist: Playlist;
}

export class PlaylistCache {
  private readonly key: string;
  private readonly storage: StorageLayer;

  constructor(storage: StorageLayer) {
    this.storage = storage;
    this.key = "playlist_cache";
  }

  getPlaylist(): Promise<Playlist | null> {
    console.log("[PlaylistCache] Reading playlist from cache...");

    return this.storage.getItem(this.key).then(function (value) {
      if (!value) {
        console.warn("[PlaylistCache] No cached playlist found");
        return null;
      }

      try {
        var parsed = JSON.parse(value) as CachedPlaylistEnvelope;
        console.log("[PlaylistCache] Cached playlist parsed successfully");
        return parsed.playlist;
      } catch (error) {
        console.error("[PlaylistCache] Playlist cache parse error", error);
        return null;
      }
    });
  }

  savePlaylist(playlist: Playlist): Promise<void> {
    console.log("[PlaylistCache] Writing playlist to cache...");

    var envelope: CachedPlaylistEnvelope = {
      savedAt: Date.now(),
      playlist: playlist,
    };

    return this.storage
      .setItem(this.key, JSON.stringify(envelope))
      .then(function () {
        console.log("[PlaylistCache] Playlist written to cache");
      });
  }

  clear(): Promise<void> {
    console.log("[PlaylistCache] Clearing playlist cache...");
    return this.storage.removeItem(this.key).then(function () {
      console.log("[PlaylistCache] Playlist cache cleared");
    });
  }
}
