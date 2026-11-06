import { Dispatch, FormEvent, SetStateAction, useMemo, useState } from "react";
import {
  type BusinessSettings,
  type ColorVariant,
  type CustomerOrder,
  type IPhoneModel,
  type Product,
  type Sale,
  type SaleItem,
  type DeliveryLocation,
  getVariants,
  totalStock,
} from "../data";

import React from "react";
import GalleryEditor from "../components/GalleryEditor";
import { cleanGallery, validGallery, galleryWithExamples } from "../lib/media";
import { starterProductDetails, starterPhoneDetails } from "../lib/productDetails";

type OwnerTab = "overview" | "products" | "inventory" | "phones" | "orders" | "sales" | "roi" | "settings";
type ProductDraft = Omit<Product, "id"> & { id?: string };
type IPhoneDraft = Omit<IPhoneModel, "id" | "total"> & { id?: string; total?: number };

type Props = {
  products: Product[];
  setProducts: Dispatch<SetStateAction<Product[]>>;
  iPhones: IPhoneModel[];
  setIPhones: Dispatch<SetStateAction<IPhoneModel[]>>;
  settings: BusinessSettings;
  setSettings: Dispatch<SetStateAction<BusinessSettings>>;
  sales: Sale[];
  setSales: Dispatch<SetStateAction<Sale[]>>;
  orders: CustomerOrder[];
  setOrders: Dispatch<SetStateAction<CustomerOrder[]>>;
  deliveryLocations: DeliveryLocation[];
  setDeliveryLocations: Dispatch<SetStateAction<DeliveryLocation[]>>;
  onResetData: () => void;
  onSwitchToStore: () => void;
};

const emptyProduct: ProductDraft = {
  name: "", category: "Fashion", unitCost: 0, shipping: 0, unitPrice: 0, image: "", inStock: 0,
  description: "", badge: "", variants: [{ color: "Default", stock: 0, image: "" }],
};

const emptyIPhone: IPhoneDraft = { name: "iPhone", condition: "99%", yuanPrice: 0, zmwPrice: 0, shipping: 220 };

function money(v: number, d = 2) { return `K${v.toLocaleString("en-ZM", { minimumFractionDigits: d, maximumFractionDigits: d })}`; }
function safeId(p: string) { return `${p}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`; }

function productMetrics(p: Product) {
  const qty = totalStock(p);
  const totalCost = p.unitCost * qty + p.shipping;
  const revenue = p.unitPrice * qty;
  const profit = revenue - totalCost;
  const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;
  return { totalCost, revenue, profit, roi, qty };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">{label}</span><div className="mt-2">{children}</div></label>;
}

const inputClass = "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium outline-none transition focus:border-[#b08d57] focus:ring-4 focus:ring-[#b08d57]/10";

function imageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

export default function OwnerDashboard({
  products, setProducts, iPhones, setIPhones, settings, setSettings,
  sales, setSales, orders, setOrders, deliveryLocations, setDeliveryLocations, 
  onResetData, onSwitchToStore,
}: Props) {
  const [tab, setTab] = useState<OwnerTab>("overview");
  const [productSearch, setProductSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [productDraft, setProductDraft] = useState<ProductDraft | null>(null);
  const [iPhoneDraft, setIPhoneDraft] = useState<IPhoneDraft | null>(null);
  const [iphoneFilter, setIphoneFilter] = useState<"all" | "99%" | "NEW">("all");
  const [saleCustomer, setSaleCustomer] = useState("Walk-in customer");
  const [salePayment, setSalePayment] = useState("Cash");
  const [saleDiscount, setSaleDiscount] = useState(0);
  const [saleProductId, setSaleProductId] = useState(products[0]?.id ?? "");
  const [saleQty, setSaleQty] = useState(1);
  const [saleCart, setSaleCart] = useState<SaleItem[]>([]);
  const [notice, setNotice] = useState("");

  const categories = useMemo(() => ["All", ...Array.from(new Set(products.map((p) => p.category))).sort()], [products]);
  const filteredProducts = useMemo(() => products.filter((p) => (activeCategory === "All" || p.category === activeCategory) && (productSearch.trim() === "" || [p.name, p.category, p.description].join(" ").toLowerCase().includes(productSearch.toLowerCase()))), [activeCategory, productSearch, products]);
  const filteredIPhones = useMemo(() => iphoneFilter === "all" ? iPhones : iPhones.filter((i) => i.condition === iphoneFilter), [iPhones, iphoneFilter]);

  const totalInventoryValue = products.reduce((s, p) => s + totalStock(p) * p.unitPrice, 0);
  const totalCostBasis = products.reduce((s, p) => s + productMetrics(p).totalCost, 0);
  const projectedProfit = products.reduce((s, p) => s + productMetrics(p).profit, 0);
  const totalUnits = products.reduce((s, p) => s + totalStock(p), 0);
  const lowStock = products.filter((p) => totalStock(p) <= 25);
  const revenueToDate = sales.reduce((s, sale) => s + sale.items.reduce((a, i) => a + i.price * i.qty, 0) - sale.discount, 0);
  const profitToDate = sales.reduce((s, sale) => s + sale.items.reduce((a, i) => a + (i.price - i.cost) * i.qty, 0) - sale.discount, 0);
  const saleSubtotal = saleCart.reduce((s, i) => s + i.price * i.qty, 0);
  const saleTotal = Math.max(0, saleSubtotal - saleDiscount);

  const tabItems: { id: OwnerTab; label: string }[] = [
    { id: "overview", label: "Overview" }, { id: "products", label: "Products" }, { id: "inventory", label: "Inventory" },
    { id: "phones", label: "Phones" }, { id: "orders", label: "Orders" }, { id: "sales", label: "Sales" },
    { id: "roi", label: "ROI" }, { id: "settings", label: "Settings" },
  ];

  function notify(m: string) { setNotice(m); setTimeout(() => setNotice(""), 2400); }

  function saveProduct(e: FormEvent) {
    e.preventDefault();
    if (!productDraft?.name.trim()) return;
    if (!validGallery(productDraft.gallery)) { alert("Use a valid image or direct video URL in the gallery."); return; }
    const cleaned: Product = {
      id: productDraft.id ?? safeId("product"), name: productDraft.name.trim(),
      category: productDraft.category.trim() || "General", unitCost: Number(productDraft.unitCost) || 0,
      shipping: Number(productDraft.shipping) || 0, unitPrice: Number(productDraft.unitPrice) || 0,
      image: productDraft.image.trim(), inStock: totalStock(productDraft as Product),
      description: productDraft.description.trim(), details: productDraft.details?.trim() ?? "", gallery: cleanGallery(productDraft.gallery), galleryCustomized: true, badge: productDraft.badge?.trim() || undefined,
      variants: (productDraft.variants || []).filter((v) => v.color.trim()).map((v) => ({ color: v.color.trim(), stock: Math.max(0, Math.round(Number(v.stock) || 0)), image: v.image })),
    };
    if (!cleaned.variants.length) cleaned.variants = [{ color: "Default", stock: cleaned.inStock || 0, image: "" }];
    cleaned.inStock = cleaned.variants.reduce((s, v) => s + v.stock, 0);
    setProducts((c) => c.some((p) => p.id === cleaned.id) ? c.map((p) => p.id === cleaned.id ? cleaned : p) : [cleaned, ...c]);
    setProductDraft(null); notify("Product saved");
  }

  function duplicateProduct(p: Product) { setProducts((c) => [{ ...p, id: safeId("product"), name: `${p.name} Copy`, badge: "Draft" }, ...c]); notify("Product duplicated"); }
  function deleteProduct(id: string) { if (!confirm("Delete this product?")) return; setProducts((c) => c.filter((p) => p.id !== id)); notify("Product deleted"); }

  function adjustVariantStock(productId: string, color: string, amount: number) {
    setProducts((c) => c.map((p) => {
      if (p.id !== productId) return p;
      const variants = getVariants(p).map((v) => v.color === color ? { ...v, stock: Math.max(0, v.stock + amount) } : v);
      return { ...p, variants, inStock: variants.reduce((s, v) => s + v.stock, 0) };
    }));
  }

  function saveIPhone(e: FormEvent) {
    e.preventDefault(); if (!iPhoneDraft?.name.trim()) return;
    if (!validGallery(iPhoneDraft.gallery)) { alert("Use a valid image or direct video URL in the gallery."); return; }
    const cleaned: IPhoneModel = { image: iPhoneDraft.image?.trim() || undefined, description: iPhoneDraft.description?.trim() || undefined, details: iPhoneDraft.details?.trim() ?? "", gallery: cleanGallery(iPhoneDraft.gallery), galleryCustomized: true, id: iPhoneDraft.id ?? safeId("iphone"), name: iPhoneDraft.name.trim(), condition: iPhoneDraft.condition, yuanPrice: Number(iPhoneDraft.yuanPrice) || 0, zmwPrice: Number(iPhoneDraft.zmwPrice) || 0, shipping: Number(iPhoneDraft.shipping) || 0, total: (Number(iPhoneDraft.zmwPrice) || 0) + (Number(iPhoneDraft.shipping) || 0) };
    setIPhones((c) => c.some((i) => i.id === cleaned.id) ? c.map((i) => i.id === cleaned.id ? cleaned : i) : [cleaned, ...c]);
    setIPhoneDraft(null); notify("Phone pricing saved");
  }
  function deleteIPhone(id: string) { if (!confirm("Delete?")) return; setIPhones((c) => c.filter((i) => i.id !== id)); notify("Deleted"); }

  function addSaleItem() { const p = products.find((i) => i.id === saleProductId); if (!p) return; const q = Math.max(1, Math.round(Number(saleQty) || 1)); setSaleCart((c) => { const ex = c.find((i) => i.id === p.id); if (ex) return c.map((i) => i.id === p.id ? { ...i, qty: i.qty + q } : i); return [...c, { id: p.id, name: p.name, qty: q, price: p.unitPrice, cost: p.unitCost }]; }); setSaleQty(1); }
  function completeSale() { if (!saleCart.length) return; const s: Sale = { id: safeId("sale"), customerName: saleCustomer.trim() || "Walk-in", paymentMethod: salePayment, status: "Paid", createdAt: new Date().toISOString(), items: saleCart, discount: Number(saleDiscount) || 0 }; setSales((c) => [s, ...c]); setSaleCart([]); setSaleDiscount(0); setSaleCustomer("Walk-in customer"); notify("Sale completed"); }
  function deleteSale(id: string) { if (!confirm("Delete sale?")) return; setSales((c) => c.filter((s) => s.id !== id)); notify("Sale deleted"); }
  function updateOrderStatus(id: string, status: CustomerOrder["status"]) { setOrders((c) => c.map((o) => o.id === id ? { ...o, status } : o)); notify("Status updated"); }
  function deleteOrder(id: string) { if (!confirm("Delete order?")) return; setOrders((c) => c.filter((o) => o.id !== id)); notify("Order deleted"); }

  function exportData() {
    const blob = new Blob([JSON.stringify({ products, iPhones, sales, orders, settings, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "eliah-and-co-data.json"; a.click(); URL.revokeObjectURL(url); notify("Exported");
  }

  function updateDraftVariant(index: number, field: keyof ColorVariant, value: string | number) {
    if (!productDraft) return;
    const variants = [...(productDraft.variants || [])];
    variants[index] = { ...variants[index], [field]: value };
    setProductDraft({ ...productDraft, variants });
  }

  async function handleVariantImageUpload(index: number, file: File) {
    const dataUrl = await imageToDataUrl(file);
    updateDraftVariant(index, "image", dataUrl);
  }

  async function handleProductImageUpload(file: File) {
    if (!productDraft) return;
    const dataUrl = await imageToDataUrl(file);
    setProductDraft({ ...productDraft, image: dataUrl });
  }

  function addDraftVariant() {
    if (!productDraft) return;
    setProductDraft({ ...productDraft, variants: [...(productDraft.variants || []), { color: "", stock: 0, image: "" }] });
  }

  function removeDraftVariant(index: number) {
    if (!productDraft) return;
    const variants = [...(productDraft.variants || [])];
    variants.splice(index, 1);
    setProductDraft({ ...productDraft, variants });
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <header className="sticky top-0 z-50 border-b border-black/5 bg-[#f5f5f7]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#1d1d1f] text-sm font-black text-white">E</div>
            <div><p className="text-sm font-bold">{settings.businessName}</p><p className="text-[11px] font-medium text-gray-400">Owner control center</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportData} className="hidden rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm sm:inline-flex">Export</button>
            <button onClick={onSwitchToStore} className="rounded-full bg-[#1d1d1f] px-4 py-2 text-sm font-semibold text-white">Storefront</button>
          </div>
        </div>
      </header>
      {notice ? <div className="fixed left-1/2 top-20 z-[80] -translate-x-1/2 rounded-full bg-[#1d1d1f] px-5 py-3 text-sm font-semibold text-white shadow-2xl">{notice}</div> : null}

      <main className="mx-auto max-w-7xl px-4 py-6 pb-28 sm:px-6 lg:px-8">
        <div className="mb-6 overflow-x-auto pb-2"><div className="flex min-w-max gap-2">{tabItems.map((t) => <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${tab === t.id ? "bg-[#1d1d1f] text-white shadow-lg shadow-black/10" : "bg-white text-gray-500"}`}>{t.label}</button>)}</div></div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <section className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div><p className="text-sm font-bold uppercase tracking-[0.2em] text-[#b08d57]">Live summary</p><h1 className="mt-2 text-3xl font-black">Owner Dashboard</h1></div>
              <button onClick={() => setProductDraft(emptyProduct)} className="rounded-full bg-[#b08d57] px-5 py-3 text-sm font-bold text-white">Add Product</button>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              {[["Inventory", money(totalInventoryValue, 0)], ["Cost", money(totalCostBasis, 0)], ["Profit", money(projectedProfit, 0)], ["Revenue", money(revenueToDate, 0)], ["Orders", orders.length.toString()]].map(([l, v]) => (
                <div key={l} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">{l}</p><p className="mt-3 text-2xl font-black">{v}</p></div>
              ))}
            </div>
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black mb-4">Best ROI</h2>
              <div className="space-y-3">{[...products].sort((a, b) => productMetrics(b).roi - productMetrics(a).roi).slice(0, 5).map((p) => { const m = productMetrics(p); return (
                <div key={p.id} className="flex items-center gap-4 rounded-2xl bg-gray-50 p-3"><img src={p.image} alt="" className="h-14 w-14 rounded-2xl object-cover" /><div className="min-w-0 flex-1"><p className="truncate font-bold">{p.name}</p><p className="text-xs text-gray-400">{p.category} | {totalStock(p)} units</p></div><div className="text-right"><p className="font-black text-green-600">{m.roi.toFixed(0)}%</p></div></div>
              ); })}</div>
            </div>
            {lowStock.length > 0 && <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"><h2 className="text-xl font-black mb-4">Low Stock</h2><div className="space-y-3">{lowStock.map((p) => <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-red-50 p-3"><img src={p.image} alt="" className="h-12 w-12 rounded-xl object-cover" /><div className="flex-1"><p className="text-sm font-bold">{p.name}</p><p className="text-xs text-red-500 font-semibold">{totalStock(p)} left</p></div><button onClick={() => setProductDraft({ ...p, details: p.details ?? starterProductDetails(p), gallery: galleryWithExamples(p.gallery, p.galleryCustomized, p.category) })} className="rounded-full bg-white px-3 py-2 text-xs font-bold">Edit</button></div>)}</div></div>}
          </section>
        )}

        {/* PRODUCTS */}
        {tab === "products" && (
          <section className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div><h1 className="text-3xl font-black">Products</h1><p className="mt-1 text-sm text-gray-500">Edit everything including per-colour inventory and images.</p></div>
              <button onClick={() => setProductDraft(emptyProduct)} className="rounded-full bg-[#1d1d1f] px-5 py-3 text-sm font-bold text-white">New Product</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]"><input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search" className={inputClass} /><select value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)} className={inputClass}>{categories.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((p) => { const m = productMetrics(p); const vars = getVariants(p); return (
                <article key={p.id} className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                  <img src={p.image} alt="" className="h-48 w-full object-cover" />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#b08d57]">{p.category}</p><h2 className="mt-1 text-lg font-black">{p.name}</h2></div>{p.badge ? <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold">{p.badge}</span> : null}</div>
                    {/* Per-color stock breakdown */}
                    <div className="mt-3 space-y-1">{vars.map((v) => (
                      <div key={v.color} className="flex items-center justify-between text-xs">
                        <span className="font-semibold flex items-center gap-2">{v.image && <img src={v.image} alt="" className="w-6 h-6 rounded object-cover" />}{v.color}</span>
                        <span className={`font-bold ${v.stock <= 5 ? "text-red-500" : "text-green-600"}`}>{v.stock}</span>
                      </div>
                    ))}</div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-2xl bg-gray-50 p-3"><p className="font-black">{money(p.unitPrice, 0)}</p><p className="text-gray-400">Sell</p></div>
                      <div className="rounded-2xl bg-gray-50 p-3"><p className="font-black">{totalStock(p)}</p><p className="text-gray-400">Total</p></div>
                      <div className="rounded-2xl bg-gray-50 p-3"><p className="font-black text-green-600">{m.roi.toFixed(0)}%</p><p className="text-gray-400">ROI</p></div>
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <button onClick={() => setProductDraft({ ...p, details: p.details ?? starterProductDetails(p), gallery: galleryWithExamples(p.gallery, p.galleryCustomized, p.category) })} className="rounded-2xl bg-[#1d1d1f] px-3 py-3 text-xs font-bold text-white">Edit</button>
                      <button onClick={() => duplicateProduct(p)} className="rounded-2xl bg-gray-100 px-3 py-3 text-xs font-bold">Copy</button>
                      <button onClick={() => deleteProduct(p.id)} className="rounded-2xl bg-red-50 px-3 py-3 text-xs font-bold text-red-600">Delete</button>
                    </div>
                  </div>
                </article>
              ); })}
            </div>
          </section>
        )}

        {/* INVENTORY */}
        {tab === "inventory" && (
          <section className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-black">Inventory</h1><p className="mt-1 text-sm text-gray-500">Adjust stock per colour option.</p></div><div className="text-sm font-bold text-gray-500">{totalUnits} total units</div></div>
            <div className="space-y-4">
              {products.map((p) => {
                const vars = getVariants(p);
                return (
                  <div key={p.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-4 mb-4"><img src={p.image} alt="" className="h-14 w-14 rounded-2xl object-cover" /><div className="flex-1"><h3 className="font-black">{p.name}</h3><p className="text-xs text-gray-400">{p.category} | Total: {totalStock(p)}</p></div><button onClick={() => setProductDraft({ ...p, details: p.details ?? starterProductDetails(p), gallery: galleryWithExamples(p.gallery, p.galleryCustomized, p.category) })} className="rounded-full bg-[#1d1d1f] px-4 py-2 text-xs font-bold text-white">Edit</button></div>
                    <div className="space-y-2">
                      {vars.map((v) => (
                        <div key={v.color} className="flex items-center gap-4 rounded-2xl bg-gray-50 p-3">
                          {v.image && <img src={v.image} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                          <span className="text-sm font-bold min-w-[80px]">{v.color}</span>
                          <span className={`text-sm font-black ${v.stock <= 5 ? "text-red-500" : "text-green-600"}`}>{v.stock} units</span>
                          <div className="flex gap-1 ml-auto">
                            {[-10, -1, 1, 10].map((amt) => <button key={amt} onClick={() => adjustVariantStock(p.id, v.color, amt)} className="rounded-full bg-white px-3 py-1 text-xs font-black border border-gray-200 hover:bg-gray-100">{amt > 0 ? `+${amt}` : amt}</button>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* PHONES (formerly iPhones) */}
        {tab === "phones" && (
          <section className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div><h1 className="text-3xl font-black">Phones</h1><p className="mt-1 text-sm text-gray-500">Edit pricing. These automatically appear on the storefront under "Phones".</p></div>
              <button onClick={() => setIPhoneDraft(emptyIPhone)} className="rounded-full bg-[#1d1d1f] px-5 py-3 text-sm font-bold text-white">Add Phone</button>
            </div>
            <div className="flex gap-2">{(["all", "99%", "NEW"] as const).map((f) => <button key={f} onClick={() => setIphoneFilter(f)} className={`rounded-full px-4 py-2 text-sm font-bold ${iphoneFilter === f ? "bg-[#1d1d1f] text-white" : "bg-white text-gray-500"}`}>{f === "all" ? "All" : f}</button>)}</div>
            <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-[0.14em] text-gray-400"><tr><th className="px-5 py-4 text-left">Model</th><th className="px-5 py-4 text-center">Condition</th><th className="px-5 py-4 text-right">Yuan</th><th className="px-5 py-4 text-right">ZMW</th><th className="px-5 py-4 text-right">Shipping</th><th className="px-5 py-4 text-right">Total</th><th className="px-5 py-4 text-right">Actions</th></tr></thead>
              <tbody>{filteredIPhones.map((ip) => (
                <tr key={ip.id} className="border-t border-gray-100"><td className="px-5 py-4 font-bold">{ip.name}</td><td className="px-5 py-4 text-center"><span className={`rounded-full px-3 py-1 text-xs font-black ${ip.condition === "NEW" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{ip.condition}</span></td><td className="px-5 py-4 text-right text-gray-500">¥{ip.yuanPrice.toLocaleString()}</td><td className="px-5 py-4 text-right">{money(ip.zmwPrice)}</td><td className="px-5 py-4 text-right text-gray-500">{money(ip.shipping)}</td><td className="px-5 py-4 text-right font-black text-[#b08d57]">{money(ip.total)}</td><td className="px-5 py-4 text-right"><button onClick={() => setIPhoneDraft({ ...ip, details: ip.details ?? starterPhoneDetails(ip), gallery: galleryWithExamples(ip.gallery, ip.galleryCustomized, "Phones") })} className="mr-2 rounded-full bg-gray-100 px-3 py-2 text-xs font-bold">Edit</button><button onClick={() => deleteIPhone(ip.id)} className="rounded-full bg-red-50 px-3 py-2 text-xs font-bold text-red-600">Delete</button></td></tr>
              ))}</tbody>
            </table></div></div>
          </section>
        )}

        {/* ORDERS */}
        {tab === "orders" && (
          <section className="space-y-6">
            <div><h1 className="text-3xl font-black">Website Orders</h1><p className="mt-1 text-sm text-gray-500">Customer orders submitted from the store cart. Alert status shows provider acceptance, not confirmed delivery.</p></div>
            <div className="grid gap-4">{orders.length ? orders.map((o) => { const msg = encodeURIComponent(`Hi ${o.customerName}, re: your Eliah & Co. order. Total: ${money(o.total, 0)}.`); const ph = o.phone.replace(/[^0-9]/g, ""); return (
              <article key={o.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div><p className="text-xs font-black uppercase text-[#b08d57]">{o.id}</p><h2 className="mt-1 text-xl font-black">{o.customerName}</h2><p className="text-sm text-gray-500">{new Date(o.createdAt).toLocaleString()} | {o.phone} | {o.email}</p></div>
                  <div className="flex flex-wrap gap-2">
                    <select value={o.status} onChange={(e) => updateOrderStatus(o.id, e.target.value as CustomerOrder["status"])} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-bold"><option>New</option><option>Contacted</option><option>Paid</option><option>Delivered</option><option>Cancelled</option></select>
                    {ph && <a href={`tel:${ph}`} className="rounded-full bg-gray-100 px-4 py-2 text-sm font-bold">Call</a>}
                    {ph && <a href={`https://wa.me/${ph}?text=${msg}`} target="_blank" rel="noreferrer" className="rounded-full bg-green-600 px-4 py-2 text-sm font-bold text-white">WhatsApp</a>}
                    {o.email && <a href={`mailto:${o.email}?subject=Your+order&body=${msg}`} className="rounded-full bg-gray-100 px-4 py-2 text-sm font-bold">Email</a>}
                    <button onClick={() => deleteOrder(o.id)} className="rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-600">Delete</button>
                  </div>
                </div>
                <div className="mt-4 space-y-2">{o.items.map((i) => <div key={`${i.id}-${i.color}`} className="flex justify-between rounded-2xl bg-gray-50 p-3 text-sm"><span className="font-bold">{i.qty} x {i.name} <span className="text-gray-400">({i.color})</span></span><span className="font-black">{money(i.qty * i.price, 0)}</span></div>)}</div>
                {o.notifications && <p className="mt-3 text-xs font-semibold text-gray-500">Order alerts — Email: {o.notifications.email} · SMS: {o.notifications.sms}</p>}
                {o.note && <p className="mt-3 rounded-2xl bg-yellow-50 p-3 text-sm font-semibold text-yellow-800">Note: {o.note}</p>}
                <div className="mt-3 rounded-2xl bg-blue-50 p-3 text-sm font-semibold text-blue-800">Delivery: {o.deliveryLocationName} (Fee: {o.deliveryFee === 0 ? "Free" : money(o.deliveryFee, 0)})</div>
                <div className="mt-4 flex justify-between border-t border-gray-100 pt-4"><span className="text-sm font-bold text-gray-400">Grand Total</span><span className="text-2xl font-black text-[#b08d57]">{money(o.total, 0)}</span></div>
              </article>
            ); }) : <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center"><p className="text-4xl">📥</p><h2 className="mt-4 text-xl font-black">No orders yet</h2></div>}</div>
          </section>
        )}

        {/* SALES */}
        {tab === "sales" && (
          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <h1 className="text-2xl font-black">Record Sale</h1>
              <div className="mt-5 grid gap-4">
                <Field label="Customer"><input value={saleCustomer} onChange={(e) => setSaleCustomer(e.target.value)} className={inputClass} /></Field>
                <Field label="Payment"><select value={salePayment} onChange={(e) => setSalePayment(e.target.value)} className={inputClass}><option>Cash</option><option>Mobile Money</option><option>Card</option><option>Bank Transfer</option></select></Field>
                <div className="grid grid-cols-[1fr_90px_auto] gap-3"><select value={saleProductId} onChange={(e) => setSaleProductId(e.target.value)} className={inputClass}>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><input type="number" min="1" value={saleQty} onChange={(e) => setSaleQty(Number(e.target.value))} className={inputClass} /><button onClick={addSaleItem} className="rounded-2xl bg-[#1d1d1f] px-5 text-sm font-bold text-white">Add</button></div>
                <Field label="Discount"><input type="number" min="0" value={saleDiscount} onChange={(e) => setSaleDiscount(Number(e.target.value))} className={inputClass} /></Field>
              </div>
              <div className="mt-5 space-y-3">{saleCart.length ? saleCart.map((i) => <div key={i.id} className="flex justify-between rounded-2xl bg-gray-50 p-3"><div><p className="font-bold">{i.name}</p><p className="text-xs text-gray-400">{i.qty} x {money(i.price, 0)}</p></div><button onClick={() => setSaleCart((c) => c.filter((x) => x.id !== i.id))} className="text-sm font-bold text-red-600">Remove</button></div>) : <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">No items.</p>}</div>
              <div className="mt-6 flex justify-between border-t border-gray-100 pt-5"><div><p className="text-sm text-gray-400">Total</p><p className="text-3xl font-black">{money(saleTotal, 0)}</p></div><button disabled={!saleCart.length} onClick={completeSale} className="rounded-full bg-[#b08d57] px-6 py-4 text-sm font-black text-white disabled:bg-gray-300">Complete</button></div>
            </div>
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex justify-between"><h2 className="text-xl font-black">Sales History</h2><p className="text-sm font-bold text-green-600">{money(profitToDate, 0)} profit</p></div>
              <div className="space-y-3">{sales.length ? sales.map((s) => { const t = s.items.reduce((a, i) => a + i.qty * i.price, 0) - s.discount; return <div key={s.id} className="rounded-2xl bg-gray-50 p-4"><div className="flex justify-between"><div><p className="font-black">{s.customerName}</p><p className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleString()} | {s.paymentMethod}</p></div><button onClick={() => deleteSale(s.id)} className="text-xs font-bold text-red-600">Delete</button></div><p className="mt-2 text-sm text-gray-500">{s.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}</p><p className="mt-2 font-black text-[#b08d57]">{money(t, 0)}</p></div>; }) : <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">No sales yet.</p>}</div>
            </div>
          </section>
        )}

        {/* ROI */}
        {tab === "roi" && (
          <section className="space-y-6">
            <h1 className="text-3xl font-black">ROI Analysis</h1>
            <div className="grid gap-4">{products.map((p) => { const m = productMetrics(p); return (
              <div key={p.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center"><img src={p.image} alt="" className="h-20 w-20 rounded-2xl object-cover" /><div className="flex-1"><h2 className="font-black">{p.name}</h2><p className="text-sm text-gray-400">{totalStock(p)} units | cost {money(p.unitCost)} | sell {money(p.unitPrice, 0)}</p></div><div className="rounded-2xl bg-green-50 px-5 py-3 text-right"><p className="text-2xl font-black text-green-600">{m.roi.toFixed(1)}%</p><p className="text-xs font-bold text-green-700">ROI</p></div><button onClick={() => setProductDraft({ ...p, details: p.details ?? starterProductDetails(p), gallery: galleryWithExamples(p.gallery, p.galleryCustomized, p.category) })} className="rounded-full bg-[#1d1d1f] px-5 py-3 text-sm font-black text-white">Edit</button></div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">{[["Cost", money(m.totalCost, 0)], ["Revenue", money(m.revenue, 0)], ["Profit", money(m.profit, 0)], ["Per Unit", money(m.qty > 0 ? m.profit / m.qty : 0, 0)]].map(([l, v]) => <div key={l} className="rounded-2xl bg-gray-50 p-3"><p className="text-xs text-gray-400">{l}</p><p className="font-black">{v}</p></div>)}</div>
              </div>
            ); })}</div>
          </section>
        )}

        {/* SETTINGS */}
        {tab === "settings" && (
          <section className="space-y-8">
            <div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-black">General Settings</h1></div><div className="flex gap-2"><button onClick={exportData} className="rounded-full bg-white px-5 py-3 text-sm font-bold">Export</button><button onClick={onResetData} className="rounded-full bg-red-50 px-5 py-3 text-sm font-bold text-red-600">Reset</button></div></div>
              <form className="mt-6 grid gap-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm lg:grid-cols-2">{([
                ["businessName", "Business name"], ["tagline", "Tagline"], ["heroTitle", "Hero title"], ["heroSubtitle", "Hero subtitle"],
                ["location", "Location"], ["phone", "Phone"], ["email", "Email"], ["whatsapp", "WhatsApp"],
                ["instagram", "Instagram URL"], ["facebook", "Facebook URL"], ["heroImage", "Hero image URL"], ["aboutImage", "About image URL"],
                ["accentColor", "Accent colour"], ["currency", "Currency"],
              ] as [keyof BusinessSettings, string][]).map(([k, l]) => <Field key={k} label={l}><input value={settings[k]} onChange={(e) => setSettings((c) => ({ ...c, [k]: e.target.value }))} className={inputClass} /></Field>)}</form>
            </div>

            <div>
              <h2 className="text-2xl font-black">Delivery Prices</h2>
              <p className="text-sm text-gray-500 mt-1">Edit courier fees for all locations. Set to 0 for free delivery or pickup.</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {deliveryLocations.map((loc, idx) => (
                  <div key={loc.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#b08d57]">{loc.province}</p>
                    <p className="mt-1 font-bold text-sm h-10 line-clamp-2">{loc.name}</p>
                    <div className="mt-4 flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-400">K</span>
                      <input type="number" value={loc.fee} onChange={(e) => {
                        const newLocs = [...deliveryLocations];
                        newLocs[idx] = { ...newLocs[idx], fee: Number(e.target.value) || 0 };
                        setDeliveryLocations(newLocs);
                      }} className={inputClass} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* PRODUCT EDITOR MODAL */}
      {productDraft && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <form onSubmit={saveProduct} className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
            <div className="mb-5 flex items-center justify-between"><h2 className="text-2xl font-black">{productDraft.id ? "Edit Product" : "New Product"}</h2><button type="button" onClick={() => setProductDraft(null)} className="rounded-full bg-gray-100 px-4 py-2 text-sm font-bold">Close</button></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name"><input required value={productDraft.name} onChange={(e) => setProductDraft({ ...productDraft, name: e.target.value })} className={inputClass} /></Field>
              <Field label="Category"><input value={productDraft.category} onChange={(e) => setProductDraft({ ...productDraft, category: e.target.value })} className={inputClass} /></Field>
              <Field label="Unit cost"><input type="number" step="0.01" value={productDraft.unitCost} onChange={(e) => setProductDraft({ ...productDraft, unitCost: Number(e.target.value) })} className={inputClass} /></Field>
              <Field label="Shipping"><input type="number" step="0.01" value={productDraft.shipping} onChange={(e) => setProductDraft({ ...productDraft, shipping: Number(e.target.value) })} className={inputClass} /></Field>
              <Field label="Selling price"><input type="number" step="0.01" value={productDraft.unitPrice} onChange={(e) => setProductDraft({ ...productDraft, unitPrice: Number(e.target.value) })} className={inputClass} /></Field>
              <Field label="Badge"><input value={productDraft.badge ?? ""} onChange={(e) => setProductDraft({ ...productDraft, badge: e.target.value })} className={inputClass} /></Field>
              <Field label="Main image URL (or upload)">
                <input value={productDraft.image} onChange={(e) => setProductDraft({ ...productDraft, image: e.target.value })} className={inputClass} placeholder="Paste URL or upload below" />
                <input type="file" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) handleProductImageUpload(e.target.files[0]); }} className="mt-2 text-sm" />
                {productDraft.image && <img src={productDraft.image} alt="" className="mt-2 h-20 w-20 rounded-xl object-cover" />}
              </Field>
              <div className="sm:col-span-2"><Field label="Description"><textarea value={productDraft.description} onChange={(e) => setProductDraft({ ...productDraft, description: e.target.value })} className={`${inputClass} min-h-20`} /></Field></div>
              <div className="sm:col-span-2"><Field label="More product information (optional)"><textarea value={productDraft.details ?? ""} onChange={(e) => setProductDraft({ ...productDraft, details: e.target.value })} className={`${inputClass} min-h-24`} placeholder="Materials, features, sizing or care instructions" /></Field></div>
            </div>

            <GalleryEditor gallery={productDraft.gallery} update={fn => setProductDraft(current => current ? { ...current, gallery: fn(current.gallery || []) } : current)} />

            {/* VARIANT EDITOR */}
            <div className="mt-6 border-t border-gray-100 pt-6">
              <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-black">Colour Variants (stock & images)</h3><button type="button" onClick={addDraftVariant} className="rounded-full bg-[#1d1d1f] px-4 py-2 text-xs font-bold text-white">Add Colour</button></div>
              <div className="space-y-4">
                {(productDraft.variants || []).map((variant, index) => (
                  <div key={index} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="grid gap-3 sm:grid-cols-[1fr_100px_1fr_auto]">
                      <Field label="Colour name"><input value={variant.color} onChange={(e) => updateDraftVariant(index, "color", e.target.value)} className={inputClass} placeholder="e.g. Black" /></Field>
                      <Field label="Stock"><input type="number" min="0" value={variant.stock} onChange={(e) => updateDraftVariant(index, "stock", Number(e.target.value))} className={inputClass} /></Field>
                      <Field label="Image URL (or upload)">
                        <input value={variant.image} onChange={(e) => updateDraftVariant(index, "image", e.target.value)} className={inputClass} placeholder="URL or upload" />
                        <input type="file" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) handleVariantImageUpload(index, e.target.files[0]); }} className="mt-2 text-sm" />
                      </Field>
                      <div className="flex items-end"><button type="button" onClick={() => removeDraftVariant(index)} className="rounded-full bg-red-50 px-4 py-3 text-xs font-bold text-red-600">Remove</button></div>
                    </div>
                    {variant.image && <img src={variant.image} alt="" className="mt-2 h-16 w-16 rounded-lg object-cover" />}
                  </div>
                ))}
              </div>
            </div>
            <button type="submit" className="mt-6 w-full rounded-full bg-[#1d1d1f] py-4 text-sm font-black text-white">Save Product</button>
          </form>
        </div>
      )}

      {/* PHONE EDITOR MODAL */}
      {iPhoneDraft && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <form onSubmit={saveIPhone} className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
            <div className="mb-5 flex items-center justify-between"><h2 className="text-2xl font-black">{iPhoneDraft.id ? "Edit Phone" : "New Phone"}</h2><button type="button" onClick={() => setIPhoneDraft(null)} className="rounded-full bg-gray-100 px-4 py-2 text-sm font-bold">Close</button></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Model"><input required value={iPhoneDraft.name} onChange={(e) => setIPhoneDraft({ ...iPhoneDraft, name: e.target.value })} className={inputClass} /></Field>
              <Field label="Condition"><select value={iPhoneDraft.condition} onChange={(e) => setIPhoneDraft({ ...iPhoneDraft, condition: e.target.value as "99%" | "NEW" })} className={inputClass}><option>99%</option><option>NEW</option></select></Field>
              <Field label="Yuan"><input type="number" step="0.01" value={iPhoneDraft.yuanPrice} onChange={(e) => setIPhoneDraft({ ...iPhoneDraft, yuanPrice: Number(e.target.value) })} className={inputClass} /></Field>
              <Field label="ZMW"><input type="number" step="0.01" value={iPhoneDraft.zmwPrice} onChange={(e) => setIPhoneDraft({ ...iPhoneDraft, zmwPrice: Number(e.target.value) })} className={inputClass} /></Field>
              <Field label="Shipping"><input type="number" step="0.01" value={iPhoneDraft.shipping} onChange={(e) => setIPhoneDraft({ ...iPhoneDraft, shipping: Number(e.target.value) })} className={inputClass} /></Field>
              <div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs font-bold uppercase text-gray-400">Auto total</p><p className="mt-2 text-2xl font-black text-[#b08d57]">{money((Number(iPhoneDraft.zmwPrice) || 0) + (Number(iPhoneDraft.shipping) || 0))}</p></div>
            </div>
            <div className="mt-5 space-y-4">
              <Field label="Main image URL"><input value={iPhoneDraft.image ?? ""} onChange={e => setIPhoneDraft({ ...iPhoneDraft, image: e.target.value })} className={inputClass} placeholder="https://..." /></Field>
              <Field label="Description"><textarea value={iPhoneDraft.description ?? ""} onChange={e => setIPhoneDraft({ ...iPhoneDraft, description: e.target.value })} className={inputClass} placeholder="Optional description" /></Field>
              <Field label="More product information"><textarea value={iPhoneDraft.details ?? ""} onChange={e => setIPhoneDraft({ ...iPhoneDraft, details: e.target.value })} className={inputClass} placeholder="Features, condition or specifications" /></Field>
            </div>
            <GalleryEditor gallery={iPhoneDraft.gallery} update={fn => setIPhoneDraft(current => current ? { ...current, gallery: fn(current.gallery || []) } : current)} />
            <button type="submit" className="mt-6 w-full rounded-full bg-[#1d1d1f] py-4 text-sm font-black text-white">Save Phone</button>
          </form>
        </div>
      )}
    </div>
  );
}
