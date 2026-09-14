import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Public: a visitor leaves a review. Held for admin approval. */
export const submit = mutation({
  args: {
    name: v.string(),
    rating: v.number(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    const text = args.text.trim();
    const rating = Math.round(args.rating);

    if (name.length < 2) {
      throw new ConvexError("Please add your name.");
    }
    if (rating < 1 || rating > 5) {
      throw new ConvexError("Please choose a rating from 1 to 5.");
    }
    if (text.length < 5) {
      throw new ConvexError("Please write a short review.");
    }

    return await ctx.db.insert("reviews", {
      name: name.slice(0, 80),
      rating,
      text: text.slice(0, 1000),
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

/** Public: approved reviews, newest first. */
export const listApproved = query({
  args: {},
  handler: async (ctx) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_created")
      .order("desc")
      .collect();
    return reviews.filter((review) => review.status === "approved");
  },
});
