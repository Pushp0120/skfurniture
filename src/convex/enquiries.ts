import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";

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
