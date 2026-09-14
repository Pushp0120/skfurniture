import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

// A single colour extracted from a profile's visual identity
export const brandColourValidator = v.object({
  name: v.string(),
  hex: v.string(),
  role: v.optional(v.string()),
});

// The 7-part brand analysis returned for an Instagram profile
export const brandReportValidator = v.object({
  brandName: v.optional(v.string()),
  handle: v.optional(v.string()),
  brandPersonality: v.optional(v.string()),
  targetAudience: v.optional(v.string()),
  coreOffer: v.optional(v.string()),
  brandColours: v.optional(v.array(brandColourValidator)),
  contentStyle: v.optional(v.string()),
  websiteGoal: v.optional(v.string()),
  keyMessage: v.optional(v.string()),
  evidence: v.optional(v.string()),
});

export const analysisStatusValidator = v.union(
  v.literal("pending"),
  v.literal("complete"),
  v.literal("error"),
);

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // Brand analyses generated from Instagram profile links
    analyses: defineTable({
      userId: v.id("users"),
      instagramUrl: v.string(),
      username: v.optional(v.string()),
      userContext: v.optional(v.string()),
      status: analysisStatusValidator,
      error: v.optional(v.string()),
      scrapedText: v.optional(v.string()),
      report: v.optional(brandReportValidator),
      createdAt: v.number(),
    }).index("by_user", ["userId", "createdAt"])
  },
  {
    schemaValidation: false,
  },
);

export default schema;
