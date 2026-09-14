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

// Lifecycle of a customer enquiry submitted from the website
export const enquiryStatusValidator = v.union(
  v.literal("new"),
  v.literal("handled"),
);
export type EnquiryStatus = Infer<typeof enquiryStatusValidator>;

// Moderation state of a customer review
export const reviewStatusValidator = v.union(
  v.literal("pending"),
  v.literal("approved"),
);
export type ReviewStatus = Infer<typeof reviewStatusValidator>;

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

    // Customer enquiries captured by the website's contact form
    enquiries: defineTable({
      name: v.string(),
      phone: v.string(),
      email: v.optional(v.string()),
      requirement: v.optional(v.string()),
      message: v.string(),
      status: enquiryStatusValidator,
      createdAt: v.number(),
    }).index("by_created", ["createdAt"]),

    // Signed-in sessions for the single admin account
    adminSessions: defineTable({
      token: v.string(),
      createdAt: v.number(),
      expiresAt: v.number(),
    }).index("by_token", ["token"]),

    // Services / products whose rates the admin can edit
    products: defineTable({
      name: v.string(),
      description: v.optional(v.string()),
      price: v.number(),
      priceNote: v.optional(v.string()),
      order: v.number(),
      updatedAt: v.number(),
    }).index("by_order", ["order"]),

    // Images the admin uploads to showcase on the homepage
    galleryImages: defineTable({
      title: v.string(),
      imageId: v.id("_storage"),
      order: v.number(),
      createdAt: v.number(),
    }).index("by_order", ["order"]),

    // Customer reviews
    reviews: defineTable({
      name: v.string(),
      rating: v.number(),
      text: v.string(),
      status: reviewStatusValidator,
      createdAt: v.number(),
    }).index("by_created", ["createdAt"]),

    // Customers who registered from the website
    members: defineTable({
      name: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_created", ["createdAt"])
      .index("by_email", ["email"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
