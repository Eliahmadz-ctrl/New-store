import { useState, useMemo, useRef } from "react";
import {
  type BusinessSettings,
  type CustomerOrder,
  type IPhoneModel,
  type Product,
  type DeliveryLocation,
  getVariants,
  totalStock,
  variantImage,
  variantStock,
} from "../data";

function K(n: number) {
  return `K${n.toLocaleString("en-ZM", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

type CartItem = { product: Product; qty: number; color: string };

function safeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
}

function socialUrl(platform: "instagram" | "facebook", value: string) {
  const cleaned = value.trim().replace(/^@/, "");
  if (!cleaned) return platform === "instagram" ? "https://instagram.com" : "https://facebook.com";
  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  return platform === "instagram"
    ? `https://instagram.com/${cleaned.replace(/^instagram\.com\//i, "")}`
    : `https://facebook.com/${cleaned.replace(/^facebook\.com\//i, "")}`;
}

function phoneProductFromIPhone(phone: IPhoneModel): Product {
  return {
    id: `iphone-product-${phone.id}`,
    name: `${phone.name} ${phone.condition}`,
    category: "Phones",
    unitCost: phone.total,
    shipping: phone.shipping,
    unitPrice: phone.total,
    image: "https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=600",
    inStock: 10,
    description: `${phone.name} in ${phone.condition} condition.`,
    badge: phone.condition,
    variants: [
      { color: "Black", stock: 3, image: "" },
      { color: "White", stock: 3, image: "" },
      { color: "Silver", stock: 2, image: "" },
      { color: "Gold", stock: 2, image: "" },
    ],
  };
}

export default function StoreFront({
  products,
  iPhones,
  settings,
  deliveryLocations,
  onCreateOrder,
  onSwitchToOwner,
}: {
  products: Product[];
  iPhones: IPhoneModel[];
  settings: BusinessSettings;
  deliveryLocations: DeliveryLocation[];
  onCreateOrder: (order: CustomerOrder) => Promise<void>;
  onSwitchToOwner: () => void;
}) {
  const [activeCat, setActiveCat] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState("Default");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [orderSuccess, setOrderSuccess] = useState("");
  const [orderError, setOrderError] = useState("");
  const [orderPending, setOrderPending] = useState(false);
  const [deliveryLocationId, setDeliveryLocationId] = useState("pickup-kitwe");
  const shopRef = useRef<HTMLElement>(null);
  const [ownerClicks, setOwnerClicks] = useState(0);

  const storefrontProducts = useMemo(() => {
    const editableProducts = products.filter((p) => p.id !== "iphone-7-99-product");
    return [...editableProducts, ...iPhones.map(phoneProductFromIPhone)];
  }, [iPhones, products]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(storefrontProducts.map((p) => p.category))).sort()],
    [storefrontProducts]
  );

  const filtered = useMemo(() => {
    return storefrontProducts.filter((p) => {
      const catMatch = activeCat === "All" || p.category === activeCat;
      const searchMatch =
        search.trim() === "" ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());
      return catMatch && searchMatch;
    });
  }, [activeCat, search, storefrontProducts]);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.qty * i.product.unitPrice, 0);
  const selectedDelivery = deliveryLocations.find((d) => d.id === deliveryLocationId) || deliveryLocations[0];
  const deliveryFee = selectedDelivery.fee;
  const grandTotal = cartTotal + deliveryFee;
  const accent = settings.accentColor || "#b08d57";
  const cleanWhatsapp = settings.whatsapp.replace(/[^0-9]/g, "");
  const phoneHref = `tel:${settings.phone.replace(/\s/g, "")}`;
  const instagramHref = socialUrl("instagram", settings.instagram);
  const facebookHref = socialUrl("facebook", settings.facebook);
  function buildOrderMessage() {
    const items = cart.map((item) => `• ${item.qty} x ${item.product.name} (${item.color}) — ${K(item.product.unitPrice * item.qty)}`).join("\n");
    return encodeURIComponent(
      `*New Order for ${settings.businessName}*\n\n` +
      `*Customer:* ${customerName.trim() || "Not provided"}\n` +
      `*Phone:* ${customerPhone.trim() || "Not provided"}\n` +
      `*Email:* ${customerEmail.trim() || "Not provided"}\n` +
      `*Delivery:* ${selectedDelivery.name}${deliveryFee > 0 ? ` (K${deliveryFee})` : " (Free)"}\n` +
      `${orderNote.trim() ? `*Note:* ${orderNote.trim()}\n` : ""}\n` +
      `*Items:*\n${items}\n\n` +
      `*Subtotal:* ${K(cartTotal)}\n` +
      `${deliveryFee > 0 ? `*Delivery:* K${deliveryFee}\n` : ""}` +
      `*Grand Total:* ${K(grandTotal)}`
    );
  }

  const checkoutUrl = `https://wa.me/${cleanWhatsapp}?text=${buildOrderMessage()}`;
  const emailSubject = encodeURIComponent(`New order from ${customerName.trim() || "Website customer"} — ${settings.businessName}`);
  const emailUrl = `mailto:${settings.email}?subject=${emailSubject}&body=${buildOrderMessage()}`;
  const smsUrl = `sms:${settings.phone.replace(/\s/g, "")}?&body=${buildOrderMessage()}`;

  function addToCart(product: Product, color: string) {
    setOrderSuccess("");
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id && i.color === color);
      if (existing)
        return prev.map((i) =>
          i.product.id === product.id && i.color === color ? { ...i, qty: i.qty + 1 } : i
        );
      return [...prev, { product, qty: 1, color }];
    });
  }

  function removeFromCart(id: string, color: string) {
    setOrderSuccess("");
    setCart((prev) => prev.filter((i) => !(i.product.id === id && i.color === color)));
  }

  function updateQty(id: string, color: string, delta: number) {
    setOrderSuccess("");
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === id && i.color === color ? { ...i, qty: Math.max(0, i.qty + delta) } : i
        )
        .filter((i) => i.qty > 0)
    );
  }

  function openProduct(product: Product) {
    setSelectedProduct(product);
    setSelectedColor(getVariants(product)[0].color);
  }

  async function submitOrder() {
    if (!cart.length || orderSuccess || orderPending) return;
    if (!customerName.trim() || !customerPhone.trim()) { setOrderError("Please provide your name and phone number."); return; }
    setOrderError(""); setOrderPending(true);
    const order: CustomerOrder = {
      id: safeId("order"),
      customerName: customerName.trim() || "Website customer",
      phone: customerPhone.trim(),
      email: customerEmail.trim(),
      deliveryArea: selectedDelivery.name,
      note: orderNote.trim(),
      createdAt: new Date().toISOString(),
      status: "New",
      total: grandTotal,
      deliveryLocationName: selectedDelivery.name,
      deliveryLocationId: selectedDelivery.id,
      deliveryFee: deliveryFee,
      items: cart.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        qty: item.qty,
        color: item.color,
        price: item.product.unitPrice,
      })),
    };
    try {
      await onCreateOrder(order);
      setOrderSuccess("Order sent! Use WhatsApp, email or SMS below to notify the owner.");
    } catch (err) { setOrderError(err instanceof Error ? err.message : "Could not send order. Please try again."); }
    finally { setOrderPending(false); }
  }

  function handleLogoClick() {
    const next = ownerClicks + 1;
    setOwnerClicks(next);
    if (next >= 5) {
      setOwnerClicks(0);
      onSwitchToOwner();
    }
    setTimeout(() => setOwnerClicks(0), 3000);
  }

  const selectedVariants = selectedProduct ? getVariants(selectedProduct) : [];
  const selectedVariant = selectedVariants.find((v) => v.color === selectedColor);
  const modalImage = selectedProduct
    ? selectedVariant?.image || variantImage(selectedProduct, selectedColor)
    : "";
  const colorStock = selectedProduct ? variantStock(selectedProduct, selectedColor) : 0;
  const cartQtyForColor = selectedProduct
    ? cart.find((i) => i.product.id === selectedProduct.id && i.color === selectedColor)?.qty ?? 0
    : 0;

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a]">
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <button onClick={handleLogoClick} className="flex items-center gap-2 select-none">
              <span className="text-xl sm:text-2xl font-light tracking-[0.25em] text-[#1a1a1a]">
                {settings.businessName.replace(" & Co.", "").replace("& Co.", "").toUpperCase()}
                <span style={{ color: accent }}>&</span>CO
              </span>
            </button>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
              <a href="#shop" className="hover:text-[#1a1a1a] transition-colors">Shop</a>
              <a href="#about" className="hover:text-[#1a1a1a] transition-colors">About</a>
              <a href="#contact" className="hover:text-[#1a1a1a] transition-colors">Contact</a>
            </nav>
            <div className="flex items-center gap-3">
              <button onClick={() => setCartOpen(true)} className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                {cartCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 text-white text-[10px] font-bold flex items-center justify-center rounded-full" style={{ backgroundColor: accent }}>{cartCount}</span>}
              </button>
              <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>{mobileMenu ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />}</svg>
              </button>
            </div>
          </div>
        </div>
        {mobileMenu && (
          <div className="md:hidden border-t border-black/5 bg-white px-4 py-4">
            <nav className="flex flex-col gap-3 text-base font-medium text-gray-600">
              <a href="#shop" onClick={() => setMobileMenu(false)} className="py-2">Shop</a>
              <a href="#about" onClick={() => setMobileMenu(false)} className="py-2">About</a>
              <a href="#contact" onClick={() => setMobileMenu(false)} className="py-2">Contact</a>
            </nav>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#1a1a1a] text-white">
        <div className="absolute inset-0"><img src={settings.heroImage} alt="" className="w-full h-full object-cover opacity-40" /></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-44">
          <div className="max-w-2xl">
            <p className="text-sm font-medium tracking-[0.3em] uppercase mb-4 sm:mb-6" style={{ color: accent }}>{settings.tagline}</p>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-light leading-[0.95] tracking-tight">{settings.heroTitle}</h1>
            <p className="mt-6 text-lg sm:text-xl text-white/60 max-w-lg leading-relaxed">{settings.heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href="#shop" className="inline-flex items-center px-8 py-4 text-white text-sm font-semibold tracking-wider uppercase rounded-full" style={{ backgroundColor: accent }}>Shop Now</a>
              <a href="#about" className="inline-flex items-center px-8 py-4 border border-white/25 text-white text-sm font-semibold tracking-wider uppercase rounded-full hover:bg-white/10 transition-colors">Our Story</a>
            </div>
          </div>
        </div>
      </section>

      {/* SHOP */}
      <section ref={shopRef} id="shop" className="scroll-mt-20 py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-medium tracking-[0.3em] uppercase mb-3" style={{ color: accent }}>Collection</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight">Shop Our Range</h2>
        </div>
        <div className="mb-10 space-y-6">
          <div className="max-w-md mx-auto relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
            <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-full bg-white text-sm focus:outline-none transition-colors" />
          </div>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCat(cat)} className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${activeCat === cat ? "bg-[#1a1a1a] text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}>{cat}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filtered.map((product) => {
            const stock = totalStock(product);
            const vars = getVariants(product);
            return (
              <div key={product.id} className="group bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-100 hover:shadow-xl hover:shadow-black/5 transition-all duration-300 cursor-pointer" onClick={() => openProduct(product)}>
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {product.badge && <span className="absolute top-3 left-3 px-3 py-1 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full" style={{ backgroundColor: accent }}>{product.badge}</span>}
                  <span className="absolute bottom-3 right-3 px-2 py-1 bg-white/90 backdrop-blur rounded-full text-[10px] font-bold text-gray-600">{stock} in stock</span>
                </div>
                <div className="p-3 sm:p-5">
                  <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">{product.category}</p>
                  <h3 className="mt-1 text-sm sm:text-base font-semibold text-[#1a1a1a] leading-tight">{product.name}</h3>
                  <p className="mt-1 text-[11px] font-medium text-gray-400">{vars.map((v) => v.color).join(", ")}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-base sm:text-lg font-bold text-[#1a1a1a]">{K(product.unitPrice)}</span>
                    <button onClick={(e) => { e.stopPropagation(); addToCart(product, vars[0].color); }} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-[#1a1a1a] text-white rounded-full hover:opacity-80 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && <div className="text-center py-20"><p className="text-4xl mb-4">🔍</p><p className="text-xl font-semibold">No products found</p></div>}
      </section>

      {/* ABOUT */}
      <section id="about" className="scroll-mt-20 bg-[#1a1a1a] text-white py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-sm font-medium tracking-[0.3em] uppercase mb-4" style={{ color: accent }}>About Us</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight leading-tight">{settings.businessName}</h2>
              <div className="mt-6 space-y-4 text-white/60 text-base sm:text-lg leading-relaxed">
                <p>Born in Zambia, built for style. We curate the best in streetwear, accessories, beauty, and electronics, sourced globally and priced fairly in Kwacha.</p>
                <p>From Mea Culpa tees to designer perfumes, every item in our range is hand-picked for quality and value.</p>
              </div>
            </div>
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden"><img src={settings.aboutImage} alt="" className="w-full h-full object-cover" /></div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="scroll-mt-20 py-20 sm:py-28 bg-[#f5f0eb]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm font-medium tracking-[0.3em] uppercase mb-4" style={{ color: accent }}>Get In Touch</p>
          <h2 className="text-3xl sm:text-4xl font-light tracking-tight mb-8">Let's Connect</h2>
          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            {[
              ["📍", settings.location, `https://maps.google.com/?q=${encodeURIComponent(settings.location)}`],
              ["📞", settings.phone, phoneHref],
              ["✉️", settings.email, `mailto:${settings.email}`],
            ].map(([icon, text, href]) => (
              <a key={text} href={href} target="_blank" rel="noreferrer" className="bg-white rounded-2xl p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <p className="text-2xl mb-2">{icon}</p>
                <p className="text-sm font-medium text-gray-700">{text}</p>
              </a>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={phoneHref} className="px-6 py-3 bg-[#1a1a1a] text-white text-sm font-medium rounded-full">📞 Call</a>
            <a href={`https://wa.me/${cleanWhatsapp}`} target="_blank" rel="noreferrer" className="px-6 py-3 bg-[#25D366] text-white text-sm font-medium rounded-full">WhatsApp</a>
            <a href={instagramHref} target="_blank" rel="noreferrer" className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-full">Instagram</a>
            <a href={facebookHref} target="_blank" rel="noreferrer" className="px-6 py-3 bg-[#1877F2] text-white text-sm font-medium rounded-full">Facebook</a>
            <a href={`mailto:${settings.email}`} className="px-6 py-3 bg-[#1a1a1a] text-white text-sm font-medium rounded-full">✉️ Email</a>
          </div>
        </div>
      </section>

      <footer className="bg-[#1a1a1a] text-white/40 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm font-light tracking-[0.25em]">{settings.businessName.toUpperCase().replace(" & ", "&")}</p>
          <p className="text-xs">© 2025 {settings.businessName} All rights reserved. {settings.location}.</p>
        </div>
      </footer>

      {/* PRODUCT DETAIL MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedProduct(null)}>
          <div className="bg-white w-full sm:w-auto sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="relative aspect-square sm:aspect-[4/3] overflow-hidden sm:rounded-t-3xl bg-gray-100">
              <div className="flex overflow-x-auto snap-x snap-mandatory h-full scrollbar-hide">
                <div className="snap-start w-full flex-shrink-0 h-full">
                  <img src={modalImage} alt={selectedProduct.name} className="w-full h-full object-cover" />
                </div>
                {selectedProduct.gallery?.map((media, idx) => (
                  <div key={idx} className="snap-start w-full flex-shrink-0 h-full">
                    {media.type === "video" ? (
                      <video src={media.url} controls className="w-full h-full object-cover" />
                    ) : (
                      <img src={media.url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
              
              <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center z-10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
              {selectedProduct.badge && <span className="absolute top-4 left-4 px-3 py-1 text-white text-xs font-bold uppercase tracking-wider rounded-full z-10" style={{ backgroundColor: accent }}>{selectedProduct.badge}</span>}
              
              {(selectedProduct.gallery?.length ?? 0) > 0 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                   <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm"></div>
                   {selectedProduct.gallery?.map((_, idx) => (
                     <div key={idx} className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
                   ))}
                </div>
              )}
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-xs text-gray-400 uppercase tracking-wider">{selectedProduct.category}</p>
              <h3 className="mt-1 text-2xl font-semibold">{selectedProduct.name}</h3>
              <p className="mt-3 text-gray-500 leading-relaxed">{selectedProduct.description}</p>

              {/* Colour options with per-colour stock */}
              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400 mb-3">Choose colour &amp; view stock</p>
                <div className="space-y-2">
                  {selectedVariants.map((variant) => {
                    const active = selectedColor === variant.color;
                    const inCart = cart.find((i) => i.product.id === selectedProduct.id && i.color === variant.color)?.qty ?? 0;
                    return (
                      <button
                        key={variant.color}
                        type="button"
                        onClick={() => setSelectedColor(variant.color)}
                        className={`w-full flex items-center justify-between rounded-2xl border p-3 text-left transition ${active ? "border-[#1a1a1a] bg-gray-50" : "border-gray-100 bg-white"}`}
                      >
                        <div className="flex items-center gap-3">
                          {variant.image && <img src={variant.image} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                          <span className={`text-sm font-bold ${active ? "text-[#1a1a1a]" : "text-gray-600"}`}>{variant.color}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold">
                          {inCart > 0 && <span className="rounded-full px-2 py-1 text-white" style={{ backgroundColor: accent }}>{inCart} in cart</span>}
                          <span className={variant.stock > 0 ? "text-green-600" : "text-red-500"}>{variant.stock} left</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <span className="text-3xl font-bold">{K(selectedProduct.unitPrice)}</span>
                <div className="text-right text-sm">
                  <p className="font-bold" style={{ color: accent }}>{selectedColor}</p>
                  <p className={colorStock > 0 ? "text-green-600 font-medium" : "text-red-500 font-medium"}>{colorStock > 0 ? `${colorStock} available` : "Out of stock"}{cartQtyForColor > 0 ? ` (${cartQtyForColor} in cart)` : ""}</p>
                </div>
              </div>
              <button
                disabled={colorStock <= 0}
                onClick={() => { addToCart(selectedProduct, selectedColor); }}
                className="mt-5 w-full py-4 bg-[#1a1a1a] text-white font-semibold rounded-full transition-colors disabled:bg-gray-300"
              >
                {colorStock > 0 ? `Add ${selectedColor} to Cart — ${K(selectedProduct.unitPrice)}` : "Out of stock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      {cartOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/40 backdrop-blur-sm" onClick={() => setCartOpen(false)}>
          <div className="bg-white w-full sm:w-[420px] h-full flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Fixed header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-semibold">Your Cart ({cartCount})</h2>
              <button onClick={() => setCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
            </div>

            {/* Scrollable body — items + checkout together */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {cart.length === 0 ? (
                <div className="text-center py-20"><p className="text-5xl mb-4">🛒</p><p className="font-semibold text-gray-900">Cart is empty</p></div>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={`${item.product.id}-${item.color}`} className="flex gap-3 p-3 bg-gray-50 rounded-2xl">
                        <img src={variantImage(item.product, item.color)} alt="" className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{item.product.name}</p>
                          <p className="text-sm text-gray-500">{K(item.product.unitPrice)} | {item.color}</p>
                          <div className="mt-2 flex items-center gap-3">
                            <button onClick={() => updateQty(item.product.id, item.color, -1)} className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-full text-sm font-bold">−</button>
                            <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                            <button onClick={() => updateQty(item.product.id, item.color, 1)} className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-full text-sm font-bold">+</button>
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-between shrink-0">
                          <button onClick={() => removeFromCart(item.product.id, item.color)} className="text-gray-400 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button>
                          <p className="text-sm font-bold">{K(item.product.unitPrice * item.qty)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Checkout Section */}
                  <div className="mt-6 space-y-4">
                    {orderSuccess ? (
                      <div className="rounded-2xl bg-green-50 p-4 text-center">
                        <p className="text-sm font-bold text-green-700">{orderSuccess}</p>
                        <p className="mt-2 text-xs text-green-600">Choose how to send your order details to the owner:</p>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <a href={checkoutUrl} target="_blank" rel="noreferrer" className="rounded-full bg-[#25D366] px-3 py-3 text-xs font-bold text-white text-center">WhatsApp</a>
                          <a href={emailUrl} className="rounded-full bg-gray-200 px-3 py-3 text-xs font-bold text-gray-700 text-center">Email</a>
                          <a href={smsUrl} className="rounded-full bg-gray-200 px-3 py-3 text-xs font-bold text-gray-700 text-center">SMS</a>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full Name" className="rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none" />
                          <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone Number" className="rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none" />
                          <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Email (optional)" className="rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none" />
                          <textarea value={orderNote} onChange={(e) => setOrderNote(e.target.value)} placeholder="Order note (optional)" className="rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none resize-none" rows={2} />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Delivery Location</label>
                          <select value={deliveryLocationId} onChange={(e) => setDeliveryLocationId(e.target.value)} className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none bg-white">
                            {deliveryLocations.map((loc) => (
                              <option key={loc.id} value={loc.id}>
                                {loc.name} — {loc.fee === 0 ? "Free" : `K${loc.fee}`}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="rounded-2xl bg-gray-50 p-4 space-y-2">
                          <div className="flex justify-between text-sm font-bold text-gray-500"><span>Subtotal</span><span>{K(cartTotal)}</span></div>
                          <div className="flex justify-between text-sm font-bold text-gray-500"><span>Delivery Fee</span><span>{deliveryFee === 0 ? "Free" : `K${deliveryFee}`}</span></div>
                          <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2"><span>Grand Total</span><span>{K(grandTotal)}</span></div>
                        </div>
                        {orderError && <p role="alert" className="text-sm text-red-700">{orderError}</p>}
                        <button onClick={submitOrder} disabled={orderPending} className="block w-full rounded-full py-4 text-center font-semibold text-white transition-colors disabled:opacity-50" style={{ backgroundColor: accent }}>{orderPending ? "Submitting…" : "Submit Order to Owner"}</button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
