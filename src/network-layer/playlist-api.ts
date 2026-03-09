import type {
  Playlist,
  PlaylistApiItem,
  PlaylistApiResponse,
} from "../core/domain/playlist";
import { ApiClient } from "./api-client";
import { getConfig } from "../infrastructure/config";

export class PlaylistApi {
  private readonly apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  fetchPlaylist(): Promise<Playlist> {
    var config = getConfig();

    return this.apiClient
      .get<PlaylistApiResponse>(config.playlistEndpointUrl)
      .then(function (response) {
        return {
          version: response.version ?? "1.0.0",
          hash: response.hash,
          items: response.playlist.map(function (
            item: PlaylistApiItem,
            index: number,
          ) {
            return {
              id: "media-" + index,
              type: item.type,
              url: item.url,
              duration:
                item.type === "image" && typeof item.duration === "number"
                  ? item.duration * 1000
                  : undefined,
            };
          }),
        };
      });
  }
}
