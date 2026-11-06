import type { MediaItem } from "../data";

export function cleanGallery(gallery?: MediaItem[]): MediaItem[] {
  return (gallery || []).filter(item => item && (item.type === "image" || item.type === "video") && typeof item.url === "string" && item.url.trim()).map(item => ({ type: item.type, url: item.url.trim() }));
}
export function validGallery(gallery?: MediaItem[]): boolean {
  return cleanGallery(gallery).every(item => {
    if (/^https?:\/\//i.test(item.url)) {
      try { const url = new URL(item.url); return !!url.hostname && !url.username && !url.password; } catch { return false; }
    }
    return item.type === "image" ? /^data:image\/[a-z0-9.+-]+;base64,/i.test(item.url) : /^data:video\/[a-z0-9.+-]+;base64,/i.test(item.url);
  });
}
