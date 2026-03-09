import type { Playlist } from "../core/domain/playlist";
import { PlaylistApi } from "../network-layer/playlist-api";
import { ApiClient } from "../network-layer/api-client";
import { PlaylistCache } from "../storage-layer/playlist-cache";
import { LocalStorageLayer } from "../storage-layer/storage";

export interface PlaylistLoadResult {
  playlist: Playlist;
  source: "network" | "cache";
  changed: boolean;
}

export class PlaylistService {
  private readonly playlistApi: PlaylistApi;
  private readonly playlistCache: PlaylistCache;

  constructor() {
    this.playlistApi = new PlaylistApi(new ApiClient());
    this.playlistCache = new PlaylistCache(new LocalStorageLayer());
  }

  getPlaylist(): Promise<PlaylistLoadResult> {
    var _this = this;

    console.log("[PlaylistService] Trying network playlist...");

    return this.playlistApi
      .fetchPlaylist()
      .then(function (networkPlaylist) {
        console.log("[PlaylistService] Network playlist loaded successfully");

        return _this.playlistCache
          .getPlaylist()
          .then(function (cachedPlaylist) {
            var changed = _this.hasPlaylistChanged(
              cachedPlaylist,
              networkPlaylist,
            );

            if (!changed) {
              console.log(
                "[PlaylistService] Network playlist is same as cache",
              );
              return {
                playlist: networkPlaylist,
                source: "network" as const,
                changed: false,
              };
            }

            console.log(
              "[PlaylistService] Playlist changed, saving new version to cache...",
            );

            return _this.playlistCache
              .savePlaylist(networkPlaylist)
              .then(function () {
                console.log("[PlaylistService] Playlist saved to cache");
                return {
                  playlist: networkPlaylist,
                  source: "network" as const,
                  changed: true,
                };
              });
          });
      })
      .catch(function (networkError) {
        console.warn(
          "[PlaylistService] Network playlist fetch failed, trying cache...",
          networkError,
        );

        return _this.playlistCache
          .getPlaylist()
          .then(function (cachedPlaylist) {
            if (cachedPlaylist) {
              console.log(
                "[PlaylistService] Cached playlist loaded successfully",
              );
              return {
                playlist: cachedPlaylist,
                source: "cache" as const,
                changed: false,
              };
            }

            throw new Error(
              "No playlist available from network or cache. Network error: " +
                (networkError instanceof Error
                  ? networkError.message
                  : "unknown"),
            );
          });
      });
  }

  private hasPlaylistChanged(
    cachedPlaylist: Playlist | null,
    incomingPlaylist: Playlist,
  ): boolean {
    if (!cachedPlaylist) {
      return true;
    }

    if (cachedPlaylist.hash && incomingPlaylist.hash) {
      return cachedPlaylist.hash !== incomingPlaylist.hash;
    }

    return cachedPlaylist.version !== incomingPlaylist.version;
  }
}
