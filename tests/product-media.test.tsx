import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import React, { useState } from "react";
import { cleanGallery, validGallery } from "../src/lib/media";
import { products as defaults, iPhones as defaultPhones, settings, defaultDeliveryLocations, type Product, type IPhoneModel } from "../src/data";

test("gallery validation retains safe URLs and rejects unsafe links", () => {
  const gallery = [{ type: "image" as const, url: " https://example.com/photo.jpg " }, { type: "video" as const, url: "https://example.com/demo.mp4" }, { type: "image" as const, url: "  " }];
  assert.deepEqual(cleanGallery(gallery), [{ type: "image", url: "https://example.com/photo.jpg" }, { type: "video", url: "https://example.com/demo.mp4" }]);
  assert.equal(validGallery(gallery), true);
  assert.equal(validGallery([{ type: "video", url: "javascript:alert(1)" }]), false);
  assert.equal(validGallery([{ type: "image", url: "data:image/png;base64,aGVsbG8=" }]), true);
});

test("owner can save product and phone galleries and shoppers can open them", async () => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "https://shop.example" });
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, File: dom.window.File, FileReader: dom.window.FileReader });
  Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
  dom.window.HTMLElement.prototype.scrollTo = function() {};
  const { render, fireEvent, cleanup, within } = await import("@testing-library/react");
  const { default: OwnerDashboard } = await import("../src/pages/OwnerDashboard");
  const { default: StoreFront } = await import("../src/pages/StoreFront");
  let savedProduct: Product | undefined;
  let savedPhone: IPhoneModel | undefined;
  function App() {
    const [products, setProducts] = useState([defaults[0]]);
    const [phones, setPhones] = useState([defaultPhones[0]]);
    savedProduct = products[0]; savedPhone = phones[0];
    return <OwnerDashboard products={products} setProducts={setProducts} iPhones={phones} setIPhones={setPhones} settings={settings} setSettings={() => {}} sales={[]} setSales={() => {}} orders={[]} setOrders={() => {}} deliveryLocations={defaultDeliveryLocations} setDeliveryLocations={() => {}} onResetData={() => {}} onSwitchToStore={() => {}} />;
  }
  try {
    const ui = render(<App />);
    fireEvent.click(ui.getByRole("button", { name: "Products" }));
    fireEvent.click(ui.getByRole("button", { name: "Edit" }));
    fireEvent.change(ui.getByLabelText("More product information (optional)"), { target: { value: "Soft cotton, machine washable" } });
    fireEvent.click(ui.getByRole("button", { name: "Add media" }));
    fireEvent.change(ui.getByLabelText("Image URL"), { target: { value: "https://example.com/photo.jpg" } });
    fireEvent.click(ui.getByRole("button", { name: "Add media" }));
    fireEvent.change(ui.getByLabelText("Media 2 type"), { target: { value: "video" } });
    fireEvent.change(ui.getByLabelText("Direct video URL"), { target: { value: "https://example.com/clip.mp4" } });
    fireEvent.click(ui.getByRole("button", { name: "Save Product" }));
    assert.equal(savedProduct?.details, "Soft cotton, machine washable");
    assert.deepEqual(savedProduct?.gallery, [{ type: "image", url: "https://example.com/photo.jpg" }, { type: "video", url: "https://example.com/clip.mp4" }]);
    fireEvent.click(ui.getByRole("button", { name: "Edit" }));
    assert.equal((ui.getByLabelText("Image URL") as HTMLInputElement).value, "https://example.com/photo.jpg");
    fireEvent.click(ui.getByRole("button", { name: "Close" }));
    fireEvent.click(ui.getByRole("button", { name: "Phones" }));
    fireEvent.click(ui.getByRole("button", { name: "Edit" }));
    fireEvent.change(ui.getByLabelText("More product information"), { target: { value: "Battery health 99%" } });
    fireEvent.click(ui.getByRole("button", { name: "Add media" }));
    fireEvent.change(ui.getByLabelText("Image URL"), { target: { value: "https://example.com/phone.jpg" } });
    fireEvent.click(ui.getByRole("button", { name: "Save Phone" }));
    assert.equal(savedPhone?.details, "Battery health 99%");
    assert.deepEqual(savedPhone?.gallery, [{ type: "image", url: "https://example.com/phone.jpg" }]);
    cleanup();
    const shop = render(<StoreFront products={[savedProduct!]} iPhones={[savedPhone!]} settings={settings} deliveryLocations={defaultDeliveryLocations} onCreateOrder={async () => {}} onSwitchToOwner={() => {}} />);
    fireEvent.click(shop.getAllByRole("button", { name: "View details" })[0]);
    let dialog = within(shop.getByRole("dialog"));
    assert.ok(dialog.getByText("Soft cotton, machine washable"));
    assert.equal(dialog.getByRole("button", { name: "View media 2" }).getAttribute("aria-pressed"), "false");
    fireEvent.click(dialog.getByRole("button", { name: "View media 2" }));
    assert.equal(dialog.getByRole("button", { name: "View media 2" }).getAttribute("aria-pressed"), "true");
    assert.equal(dialog.getByText("Product information").textContent, "Product information");
    assert.equal(shop.container.querySelector("video")?.getAttribute("src"), "https://example.com/clip.mp4");
    fireEvent.click(dialog.getByRole("button", { name: "Close product details" }));
    fireEvent.click(shop.getAllByRole("button", { name: "View details" })[1]);
    dialog = within(shop.getByRole("dialog"));
    assert.ok(dialog.getByText("Battery health 99%"));
    assert.ok(dialog.getByRole("button", { name: "View media 2" }));
  } finally { cleanup(); dom.window.close(); }
});
