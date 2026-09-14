import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { brandReportValidator } from "./schema";

/** Create a pending analysis record owned by the signed-in user. */
export const create = mutation({
  args: {
    instagramUrl: v.string(),
    userContext: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("You must be signed in to run an analysis.");
    }

    return await ctx.db.insert("analyses", {
      userId,
      instagramUrl: args.instagramUrl,
      userContext: args.userContext,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

/** All analyses for the signed-in user, newest first. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    return await ctx.db
      .query("analyses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

/** A single analysis, only if owned by the signed-in user. */
export const get = query({
  args: { id: v.id("analyses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== userId) {
      return null;
    }
    return doc;
  },
});

/** Delete one of the signed-in user's analyses. */
export const remove = mutation({
  args: { id: v.id("analyses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("You must be signed in.");
    }

    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== userId) {
      throw new ConvexError("Analysis not found.");
    }
    await ctx.db.delete(args.id);
  },
});

/** Internal read used by the analyze action to verify ownership. */
export const getInternal = internalQuery({
  args: { id: v.id("analyses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/** Internal write used when an analysis finishes successfully. */
export const markComplete = internalMutation({
  args: {
    id: v.id("analyses"),
    username: v.string(),
    scrapedText: v.optional(v.string()),
    report: brandReportValidator,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "complete",
      username: args.username,
      scrapedText: args.scrapedText,
      report: args.report,
      error: undefined,
    });
  },
});

/** Internal write used when an analysis fails. */
export const markError = internalMutation({
  args: { id: v.id("analyses"), error: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "error",
      error: args.error,
    });
  },
});
