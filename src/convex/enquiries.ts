import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";

/** The first signed-in user becomes the owner (admin) of the enquiries inbox. */
export const claimOwner = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("You must be signed in.");
    }

    const users = await ctx.db.query("users").collect();
    const admin = users.find((u) => u.role === "admin");

    if (admin) {
      return { isOwner: admin._id === userId };
    }

    await ctx.db.patch(userId, { role: "admin" });
    return { isOwner: true };
  },
});

/** Public: a visitor submits an enquiry from the website contact form. */
export const submit = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    requirement: v.optional(v.string()),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    const phone = args.phone.trim();
    const message = args.message.trim();

    if (name.length < 2) {
      throw new ConvexError("Please enter your name.");
    }
    if (phone.replace(/\D/g, "").length < 7) {
      throw new ConvexError("Please enter a valid phone number.");
    }
    if (message.length < 5) {
      throw new ConvexError("Please tell us a little about what you need.");
    }

    return await ctx.db.insert("enquiries", {
      name: name.slice(0, 120),
      phone: phone.slice(0, 40),
      email: args.email?.trim() ? args.email.trim().slice(0, 160) : undefined,
      requirement: args.requirement?.trim()
        ? args.requirement.trim().slice(0, 80)
        : undefined,
      message: message.slice(0, 2000),
      status: "new",
      createdAt: Date.now(),
    });
  },
});

/** Owner: all enquiries, newest first. Only the inbox owner (admin) sees them. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isOwner(ctx))) {
      return [];
    }

    return await ctx.db
      .query("enquiries")
      .withIndex("by_created")
      .order("desc")
      .collect();
  },
});

/** Owner: mark an enquiry as handled or new. */
export const setStatus = mutation({
  args: {
    id: v.id("enquiries"),
    status: v.union(v.literal("new"), v.literal("handled")),
  },
  handler: async (ctx, args) => {
    if (!(await isOwner(ctx))) {
      throw new ConvexError("This inbox is private to the account owner.");
    }
    await ctx.db.patch(args.id, { status: args.status });
  },
});

/** Owner: delete an enquiry. */
export const remove = mutation({
  args: { id: v.id("enquiries") },
  handler: async (ctx, args) => {
    if (!(await isOwner(ctx))) {
      throw new ConvexError("This inbox is private to the account owner.");
    }
    await ctx.db.delete(args.id);
  },
});

async function isOwner(ctx: QueryCtx): Promise<boolean> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return false;
  const user = await ctx.db.get(userId);
  return user?.role === "admin";
}
