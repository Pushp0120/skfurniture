import { mutation, query } from "./_generated/server";

const DEFAULT_PRODUCTS = [
  {
    name: "Modular Kitchens",
    description:
      "L-shaped, straight or parallel kitchen layouts with soft-close hardware and moisture-resistant carcass.",
    price: 14999,
    priceNote: "onwards",
    order: 1,
  },
  {
    name: "PVC Wardrobes & Storage",
    description:
      "Waterproof, termite-resistant wardrobes, lofts and utility cabinets built to your exact wall.",
    price: 8999,
    priceNote: "onwards",
    order: 2,
  },
  {
    name: "PVC TV Units & Consoles",
    description:
      "Wall-mounted TV units and consoles finished to match your existing interiors.",
    price: 5999,
    priceNote: "onwards",
    order: 3,
  },
  {
    name: "Custom Furniture & Decor",
    description:
      "Study tables, bathroom vanities and bespoke pieces, made to measure in your choice of finish.",
    price: 4999,
    priceNote: "onwards",
    order: 4,
  },
];

/** Public: the list of services/products with their current rates. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("products").withIndex("by_order").order("asc").collect();
  },
});

/** Idempotent: seeds the default services the first time the site is opened. */
export const ensureSeed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("products").first();
    if (existing) {
      return;
    }
    const now = Date.now();
    for (const product of DEFAULT_PRODUCTS) {
      await ctx.db.insert("products", { ...product, updatedAt: now });
    }
  },
});
