import type { IPhoneModel, Product } from "../data";

// Starter copy uses only information already in the catalogue; it is not a
// claim about materials, specifications, or the particular item in stock.
export function starterProductDetails(product: Pick<Product, "name" | "category">): string {
  return `${product.name} is part of our ${product.category || "store"} collection. Choose an available option below, and contact us if you would like more information before ordering.`;
}
export function starterPhoneDetails(phone: Pick<IPhoneModel, "name" | "condition">): string {
  return `${phone.name} is listed in ${phone.condition} condition. Contact us for the available specifications and further details before ordering.`;
}
