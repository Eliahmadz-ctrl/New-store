const MAX_INPUT_BYTES = 20 * 1024 * 1024;
const MAX_STORED_BYTES = 300 * 1024;
const MAX_DIMENSION = 1600;

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the photo. Please try again."));
    reader.readAsDataURL(file);
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Your browser could not open this image. Try saving it as JPEG or PNG.")); };
    image.src = url;
  });
}

/** Resize before upload; the original file never leaves the browser. */
export async function preparePhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > MAX_INPUT_BYTES) throw new Error("Choose a photo up to 20 MB.");
  if (file.type === "image/gif") {
    if (file.size > MAX_STORED_BYTES) throw new Error("Large animated GIFs need a hosted image URL. For photos, choose JPEG, PNG or WebP.");
    return readDataUrl(file);
  }
  const image = await loadImage(file);
  if (!image.naturalWidth || !image.naturalHeight) throw new Error("Could not read the photo dimensions.");
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser cannot resize photos. Try another browser.");
  const format = file.type === "image/jpeg" ? "image/jpeg" : "image/webp";
  for (let sizeStep = 0; sizeStep < 5; sizeStep++) {
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale * Math.pow(0.8, sizeStep)));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale * Math.pow(0.8, sizeStep)));
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.86, 0.74, 0.62]) {
      // If WebP is unsupported browsers fall back to PNG, preserving transparency.
      const result = canvas.toDataURL(format, quality);
      const base64 = result.split(",")[1] || "";
      if (/^data:image\/(jpeg|png|webp);base64,/.test(result) && Math.floor(base64.length * 3 / 4) <= MAX_STORED_BYTES) return result;
    }
  }
  throw new Error("This photo could not be made small enough. Try another photo or a hosted image URL.");
}

export async function uploadPhoto(file: File): Promise<string> {
  const image = await preparePhoto(file);
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch("/api/images", { method: "POST", signal: controller.signal, headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify({ image }) });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || `Could not upload photo (${response.status}).`);
    }
    const result = await response.json();
    if (typeof result.url !== "string" || !/^\/api\/images\?id=[a-f0-9]{64}$/.test(result.url)) throw new Error("The photo upload returned an invalid response.");
    return result.url;
  } catch (err) {
    if (controller.signal.aborted) throw new Error("The photo upload timed out. Please try again.");
    throw err;
  } finally { globalThis.clearTimeout(timer); }
}
