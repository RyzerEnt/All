import { pgTable, serial, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const calcMultipliersTable = pgTable("calc_multipliers", {
  id: serial("id").primaryKey(),
  paramKey: text("param_key").notNull().unique(),
  label: text("label").notNull(),
  value: real("value").notNull(),
  description: text("description").notNull().default(""),
  minValue: real("min_value").notNull().default(0),
  maxValue: real("max_value").notNull().default(10),
  unit: text("unit").notNull().default(""),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCalcMultiplierSchema = createInsertSchema(calcMultipliersTable).omit({ id: true, updatedAt: true });
export type InsertCalcMultiplier = z.infer<typeof insertCalcMultiplierSchema>;
export type CalcMultiplier = typeof calcMultipliersTable.$inferSelect;
