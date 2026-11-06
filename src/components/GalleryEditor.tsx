import { useState } from "react";
import type { MediaItem } from "../data";
import { uploadPhoto } from "../lib/photoUpload";

type Props = { gallery?: MediaItem[]; update: (fn: (items: MediaItem[]) => MediaItem[]) => void; onPendingChange: (delta: number) => void };
const input = "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-[#b08d57]";

export default function GalleryEditor({ gallery = [], update, onPendingChange }: Props) {
  const [error, setError] = useState("");
  async function upload(file: File, index: number) {
    setError("");
    const original = gallery[index];
    onPendingChange(1);
    try {
      const url = await uploadPhoto(file);
      update(items => items.map(item => item === original && item.type === "image" ? { ...item, url, example: false } : item));
    } catch (err) { setError(err instanceof Error ? err.message : "Could not upload the photo."); }
    finally { onPendingChange(-1); }
  }
  return <div className="mt-6 border-t border-gray-100 pt-6">
    <div className="flex items-center justify-between gap-3"><h3 className="text-lg font-black">More photos &amp; videos</h3><button type="button" onClick={() => update(items => [...items, { type: "image", url: "" }])} className="rounded-full bg-[#1d1d1f] px-4 py-2 text-xs font-bold text-white">Add media</button></div>
    <p className="mt-2 text-sm text-gray-500">Paste an image or direct video file URL (such as MP4). Photos up to 20 MB can be uploaded; they are automatically resized for the store. Videos need to be hosted elsewhere.</p>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    <div className="mt-4 grid gap-4 sm:grid-cols-2">{gallery.map((item, index) => <div key={index} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <div className="mb-3 flex gap-2"><select aria-label={`Media ${index + 1} type`} value={item.type} onChange={e => update(items => items.map((m, i) => i === index ? { type: e.target.value as "image" | "video", url: "" } : m))} className={input}><option value="image">Image</option><option value="video">Video</option></select><button type="button" aria-label={`Remove media ${index + 1}`} onClick={() => update(items => items.filter((_, i) => i !== index))} className="rounded-2xl bg-red-50 px-4 text-xs font-bold text-red-600">Remove</button></div>
      {item.example && <p className="mb-3 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800">Illustrative example, not the actual item. Replace its URL or remove it when you have your own photo.</p>}
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">{item.type === "video" ? "Direct video URL" : "Image URL"}<input className={`${input} mt-2`} value={item.url} onChange={e => { const value = e.target.value; update(items => items.map((m, i) => i === index ? { ...m, url: value, example: false } : m)); }} placeholder={item.type === "video" ? "https://example.com/video.mp4" : "https://example.com/photo.jpg"} /></label>
      {item.type === "image" && <input aria-label={`Upload image ${index + 1}`} type="file" accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (file) upload(file, index); e.target.value = ""; }} className="mt-2 text-sm" />}
      {item.url && item.type === "image" && <img src={item.url} alt={`Gallery preview ${index + 1}`} className="mt-3 h-24 w-24 rounded-xl object-cover" />}
    </div>)}</div>
  </div>;
}
