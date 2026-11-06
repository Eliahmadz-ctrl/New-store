import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import StoreFront from "./pages/StoreFront";
import OwnerDashboard from "./pages/OwnerDashboard";
import { iPhones as defaultIPhones, orders as defaultOrders, products as defaultProducts, sales as defaultSales, settings as defaultSettings, defaultDeliveryLocations, type BusinessSettings, type CustomerOrder, type IPhoneModel, type Product, type Sale, type DeliveryLocation } from "./data";
import { loadAllBlobs, debouncedSave, login, logout, createOrder, editOrder, cancelSaves, flushSaves } from "./lib/blobsClient";

function useOwnerSave(key: string, value: unknown, owner: boolean, onError: (message: string) => void) {
  const active = useRef(false);
  useEffect(() => {
    if (!owner) { active.current = false; return; }
    if (!active.current) { active.current = true; return; }
    debouncedSave(key, value, onError);
  }, [key, value, owner, onError]);
}

export default function App() {
  const [view, setView] = useState<"store" | "login" | "owner">("store");
  const [loading, setLoading] = useState(true);
  const [shared, setShared] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notificationsConfigured, setNotificationsConfigured] = useState({ email: false, sms: false });
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [iPhones, setIPhones] = useState<IPhoneModel[]>(defaultIPhones);
  const [settings, setSettings] = useState<BusinessSettings>(defaultSettings);
  const [sales, setSales] = useState<Sale[]>(defaultSales);
  const [orders, setOrders] = useState<CustomerOrder[]>(defaultOrders);
  const [deliveryLocations, setDeliveryLocations] = useState<DeliveryLocation[]>(defaultDeliveryLocations);
  const owner = view === "owner";

  function applyData(data: Record<string, unknown>, privateData: boolean) {
    setProducts(Array.isArray(data.products) ? data.products as Product[] : defaultProducts);
    setIPhones(Array.isArray(data.iphones) ? data.iphones as IPhoneModel[] : defaultIPhones);
    setSettings(data.settings && typeof data.settings === "object" ? { ...defaultSettings, ...data.settings as BusinessSettings } : defaultSettings);
    setDeliveryLocations(Array.isArray(data.deliveryLocations) ? data.deliveryLocations as DeliveryLocation[] : defaultDeliveryLocations);
    const config = privateData ? data.notificationsConfigured as { email?: boolean; sms?: boolean } | undefined : undefined;
    setNotificationsConfigured({ email: config?.email === true, sms: config?.sms === true });
    setSales(privateData && Array.isArray(data.sales) ? data.sales as Sale[] : defaultSales);
    setOrders(privateData && Array.isArray(data.orders) ? data.orders as CustomerOrder[] : defaultOrders);
  }
  useEffect(() => {
    let cancelled = false;
    loadAllBlobs().then(data => { if (!cancelled) { applyData(data, false); setShared(true); } })
      .catch(() => { if (!cancelled) setShared(false); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; cancelSaves(); };
  }, []);
  useEffect(() => {
    if (!owner) return;
    const id = window.setInterval(() => {
      loadAllBlobs().then(data => { if (Array.isArray(data.orders)) setOrders(data.orders as CustomerOrder[]); }).catch(() => {});
    }, 15000);
    return () => window.clearInterval(id);
  }, [owner]);
  useOwnerSave("products", products, owner, setError);
  useOwnerSave("iphones", iPhones, owner, setError);
  useOwnerSave("settings", settings, owner, setError);
  useOwnerSave("sales", sales, owner, setError);
  useOwnerSave("deliveryLocations", deliveryLocations, owner, setError);

  async function signIn(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try { await login(password); const data = await loadAllBlobs(); applyData(data, true); setShared(true); setPassword(""); setView("owner"); }
    catch (err) { setError(err instanceof Error ? err.message : "Sign-in failed"); }
    finally { setBusy(false); }
  }
  async function signOut() {
    try { await flushSaves(); await logout(); }
    catch (err) { setError(`Could not save changes or sign out: ${err instanceof Error ? err.message : "Please retry."}`); return; }
    cancelSaves(); setView("store"); setSales(defaultSales); setOrders(defaultOrders); setError("");
    try { const data = await loadAllBlobs(); applyData(data, false); }
    catch { setShared(false); applyData({}, false); }
  }
  const updateOrders: Dispatch<SetStateAction<CustomerOrder[]>> = (action) => {
    const next = typeof action === "function" ? action(orders) : action;
    const changes = orders.flatMap(old => { const updated = next.find(o => o.id === old.id); return !updated ? [[old.id, "delete"]] : updated.status !== old.status ? [[old.id, updated.status]] : []; });
    Promise.all(changes.map(([id, status]) => editOrder(id, status))).then(() => setOrders(next)).catch(err => setError(`Order update failed: ${err.message}`));
  };
  function resetAllData() {
    setProducts(defaultProducts); setIPhones(defaultIPhones); setSettings(defaultSettings); setSales(defaultSales); setDeliveryLocations(defaultDeliveryLocations);
    // Orders are intentionally retained; delete individual orders from the Orders tab.
  }
  return <>
    {loading && <div className="fixed top-0 inset-x-0 z-[100] bg-[#1d1d1f] text-white text-xs font-semibold text-center py-2">Loading shared data…</div>}
    {!loading && !shared && <div className="fixed top-0 inset-x-0 z-[100] bg-amber-500 text-white text-xs font-semibold text-center py-2 px-4">Shared storage unavailable. Orders cannot be submitted until the store is configured.</div>}
    {view === "store" && <StoreFront products={products} iPhones={iPhones} settings={settings} deliveryLocations={deliveryLocations} onCreateOrder={async order => { if (!shared) throw new Error("Shared storage is unavailable. Please contact the store directly."); await createOrder(order); }} onSwitchToOwner={() => { setError(""); setView("login"); }} />}
    {view === "login" && <main className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6"><form onSubmit={signIn} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl"><p className="text-xs tracking-widest uppercase text-gray-400 font-bold">Eliah & Co.</p><h1 className="mt-3 text-2xl font-black">Owner sign in</h1><p className="mt-2 text-sm text-gray-500">Enter the owner password to access the dashboard.</p><label className="block mt-6 text-sm font-semibold">Password<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3" /></label>{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}<button disabled={busy} className="mt-5 w-full rounded-full bg-[#1d1d1f] text-white font-semibold py-3">{busy ? "Signing in…" : "Sign in"}</button><button type="button" onClick={() => { setPassword(""); setError(""); setView("store"); }} className="mt-4 w-full text-sm text-gray-500">Back to store</button></form></main>}
    {owner && <>{(!notificationsConfigured.email || !notificationsConfigured.sms) && <div role="status" className="bg-amber-100 text-amber-900 text-sm text-center p-3">Order alerts need setup: {!notificationsConfigured.email && "email"}{!notificationsConfigured.email && !notificationsConfigured.sms && " and "}{!notificationsConfigured.sms && "SMS"}. Orders are saved, but these alerts will not be sent until configured.</div>}{error && <div role="alert" className="sticky top-0 z-[100] bg-red-700 text-white text-sm text-center p-3">{error} <button onClick={() => setError("")} className="underline">Dismiss</button></div>}<OwnerDashboard products={products} setProducts={setProducts} iPhones={iPhones} setIPhones={setIPhones} settings={settings} setSettings={setSettings} sales={sales} setSales={setSales} orders={orders} setOrders={updateOrders} deliveryLocations={deliveryLocations} setDeliveryLocations={setDeliveryLocations} onResetData={resetAllData} onSwitchToStore={signOut} /></>}
  </>;
}
