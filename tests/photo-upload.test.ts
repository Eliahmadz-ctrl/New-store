import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { preparePhoto, uploadPhoto } from "../src/lib/photoUpload";

test("larger photos are resized before uploading, with clear size and format errors", async () => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  const original = { document: globalThis.document, Image: globalThis.Image, createObjectURL: URL.createObjectURL, revokeObjectURL: URL.revokeObjectURL, fetch: globalThis.fetch };
  let dimensions: number[][] = [];
  class FakeImage {
    naturalWidth = 4000; naturalHeight = 3000;
    onload: (() => void) | null = null; onerror: (() => void) | null = null;
    set src(_value: string) { queueMicrotask(() => this.onload?.()); }
  }
  try {
    Object.assign(globalThis, { document: dom.window.document, Image: FakeImage });
    URL.createObjectURL = () => "blob:photo";
    URL.revokeObjectURL = () => {};
    dom.window.HTMLCanvasElement.prototype.getContext = function() { return { drawImage: () => dimensions.push([this.width, this.height]) } as any; } as any;
    dom.window.HTMLCanvasElement.prototype.toDataURL = function(_type: string, quality: any) {
      return `data:image/jpeg;base64,${"A".repeat(quality > 0.74 ? 420000 : 240000)}`;
    };
    const file = new File([new Uint8Array(3 * 1024 * 1024)], "photo.jpg", { type: "image/jpeg" });
    const result = await preparePhoto(file);
    assert.deepEqual(dimensions[0], [1600, 1200]);
    assert.ok(result.length < 300 * 1024 * 4 / 3 + 100);
    let payload = "";
    globalThis.fetch = (async (_url, init) => { payload = String(init?.body); return new Response(JSON.stringify({ url: `/api/images?id=${"a".repeat(64)}` }), { status: 200 }); }) as typeof fetch;
    assert.equal(await uploadPhoto(file), `/api/images?id=${"a".repeat(64)}`);
    assert.match(payload, /data:image\/jpeg;base64/);
    await assert.rejects(preparePhoto(new File([new Uint8Array(20 * 1024 * 1024 + 1)], "big.jpg", { type: "image/jpeg" })), /up to 20 MB/);
    await assert.rejects(preparePhoto(new File(["x"], "doc.txt", { type: "text/plain" })), /choose an image/);
    await assert.rejects(preparePhoto(new File([new Uint8Array(301 * 1024)], "big.gif", { type: "image/gif" })), /animated GIF/);
  } finally {
    Object.assign(globalThis, { document: original.document, Image: original.Image, fetch: original.fetch });
    URL.createObjectURL = original.createObjectURL; URL.revokeObjectURL = original.revokeObjectURL;
    dom.window.close();
  }
});
