import { pgTable, text, integer, real, timestamp, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: varchar("id", { length: 32 }).primaryKey(),
  phone: text("phone").notNull().unique(),
  name: text("name").notNull(),
  avatarColor: text("avatar_color").notNull(),
  rating: real("rating").notNull().default(5),
  ratingsCount: integer("ratings_count").notNull().default(0),
  pushToken: text("push_token"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UserRow = typeof usersTable.$inferSelect;

export const otpCodesTable = pgTable("otp_codes", {
  phone: text("phone").primaryKey(),
  code: varchar("code", { length: 8 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const sessionsTable = pgTable("sessions", {
  token: varchar("token", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 32 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SessionRow = typeof sessionsTable.$inferSelect;
