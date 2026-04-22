import { pgTable, text, integer, real, timestamp, varchar, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { tripsTable, parcelsTable } from "./trips";

export const requestsTable = pgTable("delivery_requests", {
  id: varchar("id", { length: 32 }).primaryKey(),
  parcelId: varchar("parcel_id", { length: 32 }).notNull().references(() => parcelsTable.id, { onDelete: "cascade" }),
  tripId: varchar("trip_id", { length: 32 }).notNull().references(() => tripsTable.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id", { length: 32 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  travellerId: varchar("traveller_id", { length: 32 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("PENDING"),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type RequestRow = typeof requestsTable.$inferSelect;

export const deliveriesTable = pgTable("deliveries", {
  id: varchar("id", { length: 32 }).primaryKey(),
  requestId: varchar("request_id", { length: 32 }).notNull().references(() => requestsTable.id, { onDelete: "cascade" }),
  parcelId: varchar("parcel_id", { length: 32 }).notNull().references(() => parcelsTable.id, { onDelete: "cascade" }),
  tripId: varchar("trip_id", { length: 32 }).notNull().references(() => tripsTable.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id", { length: 32 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  travellerId: varchar("traveller_id", { length: 32 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  stage: text("stage").notNull().default("AWAITING_PICKUP"),
  pickupConfirmedAt: timestamp("pickup_confirmed_at", { withTimezone: true }),
  deliveryConfirmedAt: timestamp("delivery_confirmed_at", { withTimezone: true }),
  otp: varchar("otp", { length: 8 }).notNull(),
  pricePaid: integer("price_paid").notNull(),
  escrowReleased: boolean("escrow_released").notNull().default(false),
  failedReason: text("failed_reason"),
  senderRated: boolean("sender_rated").notNull().default(false),
  travellerRated: boolean("traveller_rated").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DeliveryRow = typeof deliveriesTable.$inferSelect;

export const messagesTable = pgTable("messages", {
  id: varchar("id", { length: 32 }).primaryKey(),
  threadId: varchar("thread_id", { length: 32 }).notNull(),
  senderId: varchar("sender_id", { length: 32 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  recipientId: varchar("recipient_id", { length: 32 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type MessageRow = typeof messagesTable.$inferSelect;

export const notificationsTable = pgTable("notifications", {
  id: varchar("id", { length: 32 }).primaryKey(),
  userId: varchar("user_id", { length: 32 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  data: text("data"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type NotificationRow = typeof notificationsTable.$inferSelect;

export const ratingsTable = pgTable("ratings", {
  id: varchar("id", { length: 32 }).primaryKey(),
  deliveryId: varchar("delivery_id", { length: 32 }).notNull().references(() => deliveriesTable.id, { onDelete: "cascade" }),
  raterId: varchar("rater_id", { length: 32 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  rateeId: varchar("ratee_id", { length: 32 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  stars: integer("stars").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
