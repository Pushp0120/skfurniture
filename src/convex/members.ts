import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";

/** Public: a visitor registers. The OTP step happens in the browser. */
export const register = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    const email = args.email.trim().toLowerCase();

    if (name.length < 2) {
      throw new ConvexError("Please enter your name.");
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new ConvexError("Please enter a valid email address.");
    }

    const existing = await ctx.db
      .query("members")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existing) {
      return { id: existing._id as unknown as string, alreadyRegistered: true };
    }

    const id = await ctx.db.insert("members", {
      name: name.slice(0, 80),
      email: email.slice(0, 160),
      phone: args.phone?.trim() ? args.phone.trim().slice(0, 40) : undefined,
      createdAt: Date.now(),
    });

    return { id: id as unknown as string, alreadyRegistered: false };
  },
});
