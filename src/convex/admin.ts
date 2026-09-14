import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

// ---------------------------------------------------------------------------
// The single admin account. Change these two values to set your own login.
// ---------------------------------------------------------------------------
export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD = "Admin@123";

const SESSION_MS = 1000 * 60 * 60 * 12; // 12 hours

function randomToken(): string {
  try {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return (
      Math.random().toString(36).slice(2) +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2)
    );
  }
}

/** Returns true when the token maps to a live admin session. */
async function isAdmin(
  ctx: QueryCtx | MutationCtx,
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  const session = await ctx.db
    .query("adminSessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();
  return !!session && session.expiresAt > Date.now();
}

/** Throwing variant for mutations. */
export async function requireAdmin(
  ctx: MutationCtx,
  token: string | undefined,
) {
  if (!(await isAdmin(ctx, token))) {
    throw new ConvexError("Admin sign-in required.");
  }
}

/** Sign in with the admin username and password. */
export const login = mutation({
  args: { username: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    if (
      args.username.trim() !== ADMIN_USERNAME ||
      args.password !== ADMIN_PASSWORD
    ) {
      throw new ConvexError("Incorrect username or password.");
    }

    const token = randomToken();
    await ctx.db.insert("adminSessions", {
      token,
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_MS,
    });
    return { token };
  },
});

/** Sign the admin out (invalidates the current token). */
export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------
export const stats = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx, args.token))) return null;

    const [images, products, reviews, enquiries, members] = await Promise.all([
      ctx.db.query("galleryImages").collect(),
      ctx.db.query("products").collect(),
      ctx.db.query("reviews").collect(),
      ctx.db.query("enquiries").collect(),
      ctx.db.query("members").collect(),
    ]);

    return {
      images: images.length,
      products: products.length,
      pendingReviews: reviews.filter((r) => r.status === "pending").length,
      approvedReviews: reviews.filter((r) => r.status === "approved").length,
      newEnquiries: enquiries.filter((e) => e.status === "new").length,
      members: members.length,
    };
  },
});

// ---------------------------------------------------------------------------
// Gallery images
// ---------------------------------------------------------------------------
export const generateUploadUrl = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    return await ctx.storage.generateUploadUrl();
  },
});

export const addGalleryImage = mutation({
  args: { token: v.string(), title: v.string(), imageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    return await ctx.db.insert("galleryImages", {
      title: args.title.trim().slice(0, 120) || "Our work",
      imageId: args.imageId,
      order: Date.now(),
      createdAt: Date.now(),
    });
  },
});

export const deleteGalleryImage = mutation({
  args: { token: v.string(), id: v.id("galleryImages") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const doc = await ctx.db.get(args.id);
    if (!doc) return;
    try {
      await ctx.storage.delete(doc.imageId);
    } catch {
      // ignore missing file
    }
    await ctx.db.delete(args.id);
  },
});

// ---------------------------------------------------------------------------
// Products / rates
// ---------------------------------------------------------------------------
export const updateProduct = mutation({
  args: {
    token: v.string(),
    id: v.id("products"),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    if (!Number.isFinite(args.price) || args.price < 0) {
      throw new ConvexError("Enter a valid price.");
    }
    await ctx.db.patch(args.id, {
      name: args.name.trim().slice(0, 120) || "Service",
      description: args.description?.trim().slice(0, 400),
      price: Math.round(args.price),
      updatedAt: Date.now(),
    });
  },
});

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
export const listReviews = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx, args.token))) return [];
    return await ctx.db
      .query("reviews")
      .withIndex("by_created")
      .order("desc")
      .collect();
  },
});

export const setReviewStatus = mutation({
  args: {
    token: v.string(),
    id: v.id("reviews"),
    status: v.union(v.literal("pending"), v.literal("approved")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const deleteReview = mutation({
  args: { token: v.string(), id: v.id("reviews") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    await ctx.db.delete(args.id);
  },
});

// ---------------------------------------------------------------------------
// Enquiries
// ---------------------------------------------------------------------------
export const listEnquiries = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx, args.token))) return [];
    return await ctx.db
      .query("enquiries")
      .withIndex("by_created")
      .order("desc")
      .collect();
  },
});

export const setEnquiryStatus = mutation({
  args: {
    token: v.string(),
    id: v.id("enquiries"),
    status: v.union(v.literal("new"), v.literal("handled")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const deleteEnquiry = mutation({
  args: { token: v.string(), id: v.id("enquiries") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    await ctx.db.delete(args.id);
  },
});

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------
export const listMembers = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx, args.token))) return [];
    return await ctx.db
      .query("members")
      .withIndex("by_created")
      .order("desc")
      .collect();
  },
});
