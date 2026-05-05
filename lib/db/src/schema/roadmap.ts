import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roadmapItems = pgTable("roadmap_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  status: text("status").notNull().default("planned"),
  quarter: text("quarter").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRoadmapSchema = createInsertSchema(roadmapItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateRoadmapSchema = insertRoadmapSchema.partial();

export type RoadmapItem = typeof roadmapItems.$inferSelect;
export type InsertRoadmapItem = z.infer<typeof insertRoadmapSchema>;
