import { pgTable, text, integer, real, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const tripsTable = pgTable("trips", {
  id: varchar("id", { length: 32 }).primaryKey(),
  travellerId: varchar("traveller_id", { length: 32 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  fromCity: text("from_city").notNull(),
  toCity: text("to_city").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  vehicle: text("vehicle").notNull(),
  capacityKg: real("capacity_kg").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type TripRow = typeof tripsTable.$inferSelect;

export const parcelsTable = pgTable("parcels", {
  id: varchar("id", { length: 32 }).primaryKey(),
  senderId: varchar("sender_id", { length: 32 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  fromCity: text("from_city").notNull(),
  toCity: text("to_city").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  weightKg: real("weight_kg").notNull(),
  priceOffer: integer("price_offer").notNull(),
  receiverName: text("receiver_name").notNull(),
  receiverPhone: text("receiver_phone").notNull(),
  imageUri: text("image_uri"),
  status: text("status").notNull().default("OPEN"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ParcelRow = typeof parcelsTable.$inferSelect;
