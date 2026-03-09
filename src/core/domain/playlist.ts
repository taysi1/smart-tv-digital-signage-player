import type { MediaItem } from "./media";

export interface Playlist {
  version: string;
  hash?: string;
  items: MediaItem[];
}

export interface PlaylistApiItem {
  type: "image" | "video";
  url: string;
  duration?: number;
}

export interface PlaylistApiResponse {
  version?: string;
  hash?: string;
  playlist: PlaylistApiItem[];
}
