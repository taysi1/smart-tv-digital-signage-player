export type MediaType = "image" | "video";

export interface MediaItem {
  id: string;
  type: MediaType;
  url: string;
  duration?: number;
}
