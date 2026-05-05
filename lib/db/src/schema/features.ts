import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const featuresTable = pgTable("features", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  emoji: text("emoji").notNull().default("✨"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFeatureSchema = createInsertSchema(featuresTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateFeatureSchema = insertFeatureSchema.partial();

export type Feature = typeof featuresTable.$inferSelect;
export type InsertFeature = z.infer<typeof insertFeatureSchema>;
