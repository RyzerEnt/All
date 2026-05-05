import { pgTable, serial, text, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sportsTable = pgTable("sports", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  baseMet: real("base_met").notNull(),
  icon: text("icon").notNull().default("🏃"),
  appliesElevation: boolean("applies_elevation").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSportSchema = createInsertSchema(sportsTable).omit({ id: true, createdAt: true });
export type InsertSport = z.infer<typeof insertSportSchema>;
export type Sport = typeof sportsTable.$inferSelect;
