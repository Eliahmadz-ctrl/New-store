import { Dispatch, SetStateAction, useEffect, useState } from "react";
import StoreFront from "./pages/StoreFront";
import OwnerDashboard from "./pages/OwnerDashboard";
import {
  iPhones as defaultIPhones,
  orders as defaultOrders,
  products as defaultProducts,
  sales as defaultSales,
  settings as defaultSettings,
  defaultDeliveryLocations,
  type BusinessSettings,
  type CustomerOrder,
  type IPhoneModel,
  type Product,
  type Sale,
  type DeliveryLocation,
} from "./data";
import { loadAllBlobs, debouncedSave } from "./lib/blobsClient";

/* ---------- Local storage cache (fast first paint + offline fallback) ---------- */

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function useStoredState<T>(key: string, fallback: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => readStored(key, fallback));
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota / private mode — ignore */
    }
  }, [key, value]);
  return [value, setValue];
}

/* ---------- Seed default iPhone product into products list if missing ---------- */

function ensureDefaultPhone(products: Product[]): Product[] {
  const phone = defaultProducts.find((p) => p.id === "iphone-7-99-product");
  if (!phone) return products;
  return products.some((p) => p.id === phone.id) ? products : [phone, ...products];
}

/* ---------- App ---------- */

export default function App() {
  const [view, setView] = useState<"store" | "owner">("store");
  const [loading, setLoading] = useState(true);
  const [blobsActive, setBlobsActive] = useState(false);

  // Initialise from localStorage for instant paint; server will override if available.
  const [products, setProducts] = useStoredState<Product[]>("eliah.products", defaultProducts);
  const [iPhones, setIPhones] = useStoredState<IPhoneModel[]>("eliah.iphones", defaultIPhones);
  const [settings, setSettings] = useStoredState<BusinessSettings>("eliah.settings", defaultSettings);
  const [sales, setSales] = useStoredState<Sale[]>("eliah.sales", defaultSales);
  const [orders, setOrders] = useStoredState<CustomerOrder[]>("eliah.orders", defaultOrders);
  const [deliveryLocations, setDeliveryLocations] = useStoredState<DeliveryLocation[]>(
    "eliah.delivery",
    defaultDeliveryLocations
  );

  /* ---- Load from Netlify Blobs on mount ---- */
  useEffect(() => {
    let cancelled = false;
    loadAllBlobs()
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data.products)) setProducts(ensureDefaultPhone(data.products as Product[]));
        if (Array.isArray(data.iphones)) setIPhones(data.iphones as IPhoneModel[]);
        if (data.settings && typeof data.settings === "object")
          setSettings({ ...defaultSettings, ...(data.settings as BusinessSettings) });
        if (Array.isArray(data.sales)) setSales(data.sales as Sale[]);
        if (Array.isArray(data.orders)) setOrders(data.orders as CustomerOrder[]);
        if (Array.isArray(data.deliveryLocations))
          setDeliveryLocations(data.deliveryLocations as DeliveryLocation[]);
        setBlobsActive(true);
      })
      .catch(() => {
        // Blobs unreachable (e.g. plain `vite dev` without Netlify runtime).
        // Keep using localStorage only.
        setBlobsActive(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Persist every change back to Blobs (debounced), once active ---- */
  useEffect(() => {
    if (!blobsActive) return;
    debouncedSave("products", products);
  }, [products, blobsActive]);
  useEffect(() => {
    if (!blobsActive) return;
    debouncedSave("iphones", iPhones);
  }, [iPhones, blobsActive]);
  useEffect(() => {
    if (!blobsActive) return;
    debouncedSave("settings", settings);
  }, [settings, blobsActive]);
  useEffect(() => {
    if (!blobsActive) return;
    debouncedSave("sales", sales);
  }, [sales, blobsActive]);
  useEffect(() => {
    if (!blobsActive) return;
    debouncedSave("orders", orders);
  }, [orders, blobsActive]);
  useEffect(() => {
    if (!blobsActive) return;
    debouncedSave("deliveryLocations", deliveryLocations);
  }, [deliveryLocations, blobsActive]);

  function resetAllData() {
    setProducts(defaultProducts);
    setIPhones(defaultIPhones);
    setSettings(defaultSettings);
    setSales(defaultSales);
    setOrders(defaultOrders);
    setDeliveryLocations(defaultDeliveryLocations);
  }

  return (
    <>
      {/* Sync banner — shows while Blobs are loading / unavailable */}
      {loading && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-[#1d1d1f] text-white text-xs font-semibold text-center py-2">
          Loading shared data…
        </div>
      )}
      {!loading && !blobsActive && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white text-xs font-semibold text-center py-2 px-4">
          Running offline — edits are saved on this device only. Deploy to Vercel and add an Upstash Redis integration to sync for all visitors.
        </div>
      )}

      {view === "store" ? (
        <StoreFront
          products={products}
          iPhones={iPhones}
          settings={settings}
          deliveryLocations={deliveryLocations}
          onCreateOrder={(order) => setOrders((current) => [order, ...current])}
          onSwitchToOwner={() => setView("owner")}
        />
      ) : (
        <OwnerDashboard
          products={products}
          setProducts={setProducts}
          iPhones={iPhones}
          setIPhones={setIPhones}
          settings={settings}
          setSettings={setSettings}
          sales={sales}
          setSales={setSales}
          orders={orders}
          setOrders={setOrders}
          deliveryLocations={deliveryLocations}
          setDeliveryLocations={setDeliveryLocations}
          onResetData={resetAllData}
          onSwitchToStore={() => setView("store")}
        />
      )}
    </>
  );
}
