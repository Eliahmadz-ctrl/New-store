export type MediaItem = {
  type: "image" | "video";
  url: string;
};

export type ColorVariant = {
  color: string;
  stock: number;
  image: string;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  unitCost: number;
  shipping: number;
  unitPrice: number;
  image: string;
  inStock: number;
  description: string;
  details?: string;
  badge?: string;
  variants: ColorVariant[];
  gallery?: MediaItem[];
};

export type IPhoneModel = {
  id: string;
  name: string;
  condition: "99%" | "NEW";
  yuanPrice: number;
  zmwPrice: number;
  shipping: number;
  total: number;
  image?: string;
  description?: string;
  details?: string;
  gallery?: MediaItem[];
};

export type BusinessSettings = {
  businessName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  location: string;
  phone: string;
  email: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  heroImage: string;
  aboutImage: string;
  accentColor: string;
  currency: string;
};

export type SaleItem = {
  id: string;
  name: string;
  qty: number;
  price: number;
  cost: number;
};

export type Sale = {
  id: string;
  customerName: string;
  paymentMethod: string;
  status: "Paid" | "Pending" | "Refunded";
  createdAt: string;
  items: SaleItem[];
  discount: number;
};

export type OrderItem = {
  id: string;
  name: string;
  qty: number;
  color: string;
  price: number;
};

export type CustomerOrder = {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  deliveryArea: string;
  note: string;
  createdAt: string;
  status: "New" | "Contacted" | "Paid" | "Delivered" | "Cancelled";
  items: OrderItem[];
  total: number;
  deliveryLocationName: string;
  deliveryLocationId?: string;
  deliveryFee: number;
  notifications?: { email: "pending" | "accepted" | "failed" | "unknown" | "unconfigured"; sms: "pending" | "accepted" | "failed" | "unknown" | "unconfigured" };
};

export type DeliveryLocation = {
  id: string;
  name: string;
  fee: number;
  province: string;
};

const originalDeliveryLocations: DeliveryLocation[] = [
  { id: "pickup-cbu", name: "Pickup: Copperbelt University (CBU)", fee: 0, province: "Pickup" },
  { id: "pickup-kitwe", name: "Pickup: Kitwe Town", fee: 0, province: "Pickup" },
  { id: "cb-town", name: "Ndola, Kitwe, Mufulira, Luanshya, Chingola, Chililabombwe", fee: 30, province: "Copperbelt" },
  { id: "cb-kalulushi", name: "Kalulushi & Chambishi", fee: 20, province: "Copperbelt" },
  { id: "cb-kasumbalesa", name: "Kasumbalesa", fee: 30, province: "Copperbelt" },
  { id: "cb-mpongwe", name: "Mpongwe & Ibenga", fee: 50, province: "Copperbelt" },
  { id: "ct-kabwe", name: "Kabwe & Kapiri", fee: 40, province: "Central" },
  { id: "ct-serenje", name: "Serenje, Mukando & Mkushi", fee: 50, province: "Central" },
  { id: "nm-kasama", name: "Kasama & Mpika", fee: 150, province: "Northern/Muchinga" },
  { id: "nm-mununga", name: "Mununga Quarry, Chilonga, Senga Hill, Isoka, Chinsali, Nakonde, Lavushimanda", fee: 150, province: "Northern/Muchinga" },
  { id: "nm-mpulungu", name: "Mpulungu, Luwingu & Mbala", fee: 150, province: "Northern/Muchinga" },
  { id: "lk-lusaka", name: "Lusaka", fee: 40, province: "Lusaka" },
  { id: "nw-solwezi", name: "Solwezi", fee: 50, province: "North Western" },
  { id: "nw-kasempa", name: "Kasempa", fee: 100, province: "North Western" },
  { id: "ws-iumwana", name: "Iumwana R1, Manyama, Kisasa & Kalumbila", fee: 70, province: "Western" },
  { id: "ws-mongu", name: "Mongu, Kaoma, Tbz & Kalabo, Muumbwa", fee: 150, province: "Western" },
  { id: "st-sesheke", name: "Sesheke, Senanga, Katima Mulilo & Mwandi", fee: 150, province: "Southern" },
  { id: "st-kafue", name: "Kafue, Mazabuka, Zimba, Monze, Choma, Pemba, Kalomo, Livingstone", fee: 150, province: "Southern" },
  { id: "lp-mansa", name: "Mansa & Samfya", fee: 150, province: "Luapula" },
  { id: "lp-kazungula", name: "Kazungula", fee: 100, province: "Luapula" },
  { id: "et-nyimba", name: "Nyimba, Petauke, Katete, Sinda & Chipata", fee: 50, province: "Eastern" },
  { id: "et-lumezi", name: "Lumezi & Lundazi", fee: 150, province: "Eastern" },
];

/** Expand only known legacy groups. Preserve customised fees and unrelated custom locations. */
const legacyDeliveryGroups: Record<string, { original: string; locations: string[] }> = {
  "cb-town": { original: "Ndola, Kitwe, Mufulira, Luanshya, Chingola, Chililabombwe", locations: ["Ndola", "Kitwe", "Mufulira", "Luanshya", "Chingola", "Chililabombwe"] },
  "cb-kalulushi": { original: "Kalulushi & Chambishi", locations: ["Kalulushi", "Chambishi"] },
  "cb-mpongwe": { original: "Mpongwe & Ibenga", locations: ["Mpongwe", "Ibenga"] },
  "ct-kabwe": { original: "Kabwe & Kapiri", locations: ["Kabwe", "Kapiri"] },
  "ct-serenje": { original: "Serenje, Mukando & Mkushi", locations: ["Serenje", "Mukando", "Mkushi"] },
  "nm-kasama": { original: "Kasama & Mpika", locations: ["Kasama", "Mpika"] },
  "nm-mununga": { original: "Mununga Quarry, Chilonga, Senga Hill, Isoka, Chinsali, Nakonde, Lavushimanda", locations: ["Mununga Quarry", "Chilonga", "Senga Hill", "Isoka", "Chinsali", "Nakonde", "Lavushimanda"] },
  "nm-mpulungu": { original: "Mpulungu, Luwingu & Mbala", locations: ["Mpulungu", "Luwingu", "Mbala"] },
  "ws-iumwana": { original: "Iumwana R1, Manyama, Kisasa & Kalumbila", locations: ["Iumwana R1", "Manyama", "Kisasa", "Kalumbila"] },
  "ws-mongu": { original: "Mongu, Kaoma, Tbz & Kalabo, Muumbwa", locations: ["Mongu", "Kaoma", "Tbz", "Kalabo", "Muumbwa"] },
  "st-sesheke": { original: "Sesheke, Senanga, Katima Mulilo & Mwandi", locations: ["Sesheke", "Senanga", "Katima Mulilo", "Mwandi"] },
  "st-kafue": { original: "Kafue, Mazabuka, Zimba, Monze, Choma, Pemba, Kalomo, Livingstone", locations: ["Kafue", "Mazabuka", "Zimba", "Monze", "Choma", "Pemba", "Kalomo", "Livingstone"] },
  "lp-mansa": { original: "Mansa & Samfya", locations: ["Mansa", "Samfya"] },
  "et-nyimba": { original: "Nyimba, Petauke, Katete, Sinda & Chipata", locations: ["Nyimba", "Petauke", "Katete", "Sinda", "Chipata"] },
  "et-lumezi": { original: "Lumezi & Lundazi", locations: ["Lumezi", "Lundazi"] },
};
export function expandDeliveryLocations(locations: DeliveryLocation[]): DeliveryLocation[] {
  return locations.flatMap(location => {
    const group = legacyDeliveryGroups[location.id];
    if (!group || group.original !== location.name) return [location];
    return group.locations.map(name => ({ ...location, id: `${location.id}--${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, name }));
  });
}
export const defaultDeliveryLocations: DeliveryLocation[] = expandDeliveryLocations(originalDeliveryLocations);

function v(color: string, stock: number, image = ""): ColorVariant {
  return { color, stock, image };
}

export const products: Product[] = [
  {
    id: "mea-culpa",
    name: "Mea Culpa Tee",
    category: "Fashion",
    unitCost: 11,
    shipping: 300,
    unitPrice: 55,
    image: "https://images.pexels.com/photos/32638462/pexels-photo-32638462.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=600",
    inStock: 32,
    description: "Premium streetwear graphic tee. Bold design meets comfort.",
    badge: "Best Seller",
    variants: [v("Black", 12), v("White", 10), v("Grey", 10)],
  },
  {
    id: "perfumes",
    name: "Luxury Perfumes",
    category: "Beauty",
    unitCost: 3.3,
    shipping: 1600,
    unitPrice: 90,
    image: "https://images.pexels.com/photos/35930230/pexels-photo-35930230.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    inStock: 78,
    description: "Designer-inspired fragrances for every occasion. Long-lasting scent.",
    badge: "New",
    variants: [v("Classic", 40), v("Oud", 20), v("Floral", 18)],
  },
  {
    id: "durags",
    name: "Silk Durags",
    category: "Accessories",
    unitCost: 2.56,
    shipping: 400,
    unitPrice: 30,
    image: "https://images.pexels.com/photos/3905312/pexels-photo-3905312.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    inStock: 120,
    description: "Premium silky durags for waves and style. Comfortable all-day wear.",
    variants: [v("Black", 40), v("White", 30), v("Red", 25), v("Blue", 25)],
  },
  {
    id: "bonnets",
    name: "Satin Bonnets",
    category: "Accessories",
    unitCost: 1.8,
    shipping: 300,
    unitPrice: 45,
    image: "https://images.pexels.com/photos/5379139/pexels-photo-5379139.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    inStock: 85,
    description: "Protect your hair in style. Satin-lined for maximum moisture retention.",
    variants: [v("Black", 30), v("Pink", 30), v("Purple", 25)],
  },
  {
    id: "airpod-case-1",
    name: "AirPod Case Type 1",
    category: "Electronics",
    unitCost: 6.7,
    shipping: 100,
    unitPrice: 30,
    image: "https://images.pexels.com/photos/3394653/pexels-photo-3394653.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    inStock: 150,
    description: "Protective silicone case for AirPods. Sleek and durable.",
    variants: [v("Black", 50), v("White", 50), v("Clear", 50)],
  },
  {
    id: "airpod-case-2",
    name: "AirPod Case Type 2",
    category: "Electronics",
    unitCost: 6.7,
    shipping: 114,
    unitPrice: 30,
    image: "https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    inStock: 100,
    description: "Premium hard-shell AirPod case with keychain attachment.",
    variants: [v("Black", 35), v("White", 35), v("Blue", 30)],
  },
  {
    id: "phone-stand",
    name: "Phone Stand",
    category: "Electronics",
    unitCost: 7.5,
    shipping: 665,
    unitPrice: 75,
    image: "https://images.pexels.com/photos/8833423/pexels-photo-8833423.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    inStock: 45,
    description: "Adjustable phone stand for desk and bedside. Universal fit.",
    badge: "Popular",
    variants: [v("Black", 20), v("Silver", 15), v("White", 10)],
  },
  {
    id: "phone-stand-2",
    name: "Phone Stand Pro",
    category: "Electronics",
    unitCost: 7,
    shipping: 665,
    unitPrice: 55,
    image: "https://images.pexels.com/photos/5552789/pexels-photo-5552789.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    inStock: 65,
    description: "Premium aluminium phone stand with anti-slip base.",
    variants: [v("Silver", 35), v("Black", 30)],
  },
  {
    id: "earmuffs",
    name: "Winter Earmuffs",
    category: "Accessories",
    unitCost: 4,
    shipping: 475,
    unitPrice: 30,
    image: "https://images.pexels.com/photos/3756945/pexels-photo-3756945.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    inStock: 88,
    description: "Plush winter earmuffs. Foldable design for easy carry.",
    variants: [v("Black", 30), v("White", 30), v("Pink", 28)],
  },
  {
    id: "socks",
    name: "Designer Socks",
    category: "Fashion",
    unitCost: 2.5,
    shipping: 237.5,
    unitPrice: 15,
    image: "https://images.pexels.com/photos/10557895/pexels-photo-10557895.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    inStock: 250,
    description: "Colourful cotton-blend socks. Comfortable everyday wear.",
    variants: [v("Mixed", 100), v("Black", 80), v("White", 70)],
  },
  {
    id: "dr-martens",
    name: "Dr Martens Boots",
    category: "Footwear",
    unitCost: 80,
    shipping: 3600,
    unitPrice: 1200,
    image: "https://images.pexels.com/photos/27256456/pexels-photo-27256456.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    inStock: 15,
    description: "Iconic leather boots. Classic 1460 style, built to last.",
    badge: "Premium",
    variants: [v("Black", 8), v("Cherry", 4), v("Brown", 3)],
  },
  {
    id: "daras",
    name: "Dara Sneakers",
    category: "Footwear",
    unitCost: 16.5,
    shipping: 300,
    unitPrice: 250,
    image: "https://images.pexels.com/photos/19869759/pexels-photo-19869759.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    inStock: 24,
    description: "Trendy streetwear sneakers. Cushioned sole for all-day comfort.",
    variants: [v("White", 10), v("Black", 8), v("Blue", 6)],
  },
  {
    id: "jersey",
    name: "Sports Jersey",
    category: "Fashion",
    unitCost: 18,
    shipping: 200,
    unitPrice: 250,
    image: "https://images.pexels.com/photos/15986812/pexels-photo-15986812.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    inStock: 18,
    description: "Authentic-style sports jerseys. Breathable match-day quality.",
    variants: [v("Home", 10), v("Away", 8)],
  },
  {
    id: "shorts",
    name: "Athletic Shorts",
    category: "Fashion",
    unitCost: 6.5,
    shipping: 200,
    unitPrice: 100,
    image: "https://images.pexels.com/photos/17872898/pexels-photo-17872898.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    inStock: 42,
    description: "Lightweight athletic shorts. Quick-dry, perfect for sport and leisure.",
    variants: [v("Black", 15), v("Grey", 15), v("Navy", 12)],
  },
];

export const iPhones: IPhoneModel[] = [
  { id: "ip7-99", name: "iPhone 7", condition: "99%", yuanPrice: 1029, zmwPrice: 3601.5, shipping: 220, total: 3821.5 },
  { id: "ip7p-99", name: "iPhone 7 Pro", condition: "99%", yuanPrice: 1469, zmwPrice: 4921.15, shipping: 220, total: 5141.15 },
  { id: "ip8-99", name: "iPhone 8", condition: "99%", yuanPrice: 1519, zmwPrice: 5316.5, shipping: 220, total: 5536.5 },
  { id: "ip8p-99", name: "iPhone 8 Pro", condition: "99%", yuanPrice: 2059, zmwPrice: 6897.65, shipping: 220, total: 7117.65 },
  { id: "ip9-99", name: "iPhone 9", condition: "99%", yuanPrice: 2379, zmwPrice: 8326.5, shipping: 220, total: 8546.5 },
  { id: "ip9p-99", name: "iPhone 9 Pro", condition: "99%", yuanPrice: 2949, zmwPrice: 9879.15, shipping: 220, total: 10099.15 },
  { id: "ip7-new", name: "iPhone 7", condition: "NEW", yuanPrice: 1259, zmwPrice: 4217.65, shipping: 220, total: 4437.65 },
  { id: "ip7p-new", name: "iPhone 7 Pro", condition: "NEW", yuanPrice: 1779, zmwPrice: 5959.65, shipping: 220, total: 6179.65 },
  { id: "ip8-new", name: "iPhone 8", condition: "NEW", yuanPrice: 1778, zmwPrice: 5956.3, shipping: 220, total: 6176.3 },
  { id: "ip8p-new", name: "iPhone 8 Pro", condition: "NEW", yuanPrice: 2300, zmwPrice: 7705, shipping: 220, total: 7925 },
  { id: "ip9-new", name: "iPhone 9", condition: "NEW", yuanPrice: 2629, zmwPrice: 8807.15, shipping: 220, total: 9027.15 },
  { id: "ip9p-new", name: "iPhone 9 Pro", condition: "NEW", yuanPrice: 3269, zmwPrice: 10951.15, shipping: 220, total: 11171.15 },
];

export const categories = ["All", "Fashion", "Accessories", "Electronics", "Footwear", "Beauty", "Phones"];

export const settings: BusinessSettings = {
  businessName: "Eliah & Co.",
  tagline: "Zambian Retail",
  heroTitle: "Style that speaks for itself.",
  heroSubtitle: "Curated fashion, accessories and electronics delivered across Zambia. All prices in ZMW.",
  location: "Lusaka, Zambia",
  phone: "+260 97 XXX XXXX",
  email: "hello@eliahandco.com",
  whatsapp: "+260970000000",
  instagram: "https://instagram.com/eliahandco",
  facebook: "https://facebook.com/eliahandco",
  heroImage: "https://images.pexels.com/photos/35045845/pexels-photo-35045845.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600",
  aboutImage: "https://images.pexels.com/photos/30410067/pexels-photo-30410067.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=640",
  accentColor: "#b08d57",
  currency: "ZMW",
};

export const sales: Sale[] = [];
export const orders: CustomerOrder[] = [];

/* helper to get safe variants */
export function getVariants(p: Product): ColorVariant[] {
  return p.variants && p.variants.length > 0 ? p.variants : [{ color: "Default", stock: p.inStock, image: "" }];
}

export function variantImage(p: Product, color: string): string {
  const v = getVariants(p).find((x) => x.color === color);
  return v?.image || p.image;
}

export function variantStock(p: Product, color: string): number {
  const v = getVariants(p).find((x) => x.color === color);
  return v?.stock ?? 0;
}

export function totalStock(p: Product): number {
  const vars = getVariants(p);
  return vars.reduce((s, x) => s + x.stock, 0);
}
