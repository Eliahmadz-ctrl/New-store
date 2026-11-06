import type { MediaItem } from "../data";

export function cleanGallery(gallery?: MediaItem[]): MediaItem[] {
  return (gallery || []).filter(item => item && (item.type === "image" || item.type === "video") && typeof item.url === "string" && item.url.trim()).map(item => ({ type: item.type, url: item.url.trim(), ...(item.example ? { example: true } : {}) }));
}
export function validGallery(gallery?: MediaItem[]): boolean {
  return cleanGallery(gallery).every(item => {
    if (item.type === "image" && Object.values(starterImages).includes(item.url)) return true;
    if (/^https?:\/\//i.test(item.url)) {
      try { const url = new URL(item.url); return !!url.hostname && !url.username && !url.password; } catch { return false; }
    }
    return item.type === "image" ? /^data:image\/[a-z0-9.+-]+;base64,/i.test(item.url) : /^data:video\/[a-z0-9.+-]+;base64,/i.test(item.url);
  });
}

// Generic category illustrations are explicitly marked as examples. Existing
// owner galleries always take priority and saving an empty gallery removes them.
const starterImages: Record<string, string> = {
  fashion: "/examples/fashion.jpg", beauty: "/examples/beauty.jpg",
  accessories: "/examples/accessories.jpg", electronics: "/examples/electronics.jpg",
  footwear: "/examples/footwear.jpg", phones: "/examples/phones.jpg",
};
export function galleryWithExamples(gallery: MediaItem[] | undefined, customized: boolean | undefined, category: string): MediaItem[] {
  const existing = cleanGallery(gallery);
  if (existing.length || customized) return existing;
  const url = starterImages[category.trim().toLowerCase()];
  return url ? [{ type: "image", url, example: true }] : [];
}
