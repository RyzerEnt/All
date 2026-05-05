import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const waitlistTable = pgTable("waitlistemail", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWaitlistSchema = createInsertSchema(waitlistTable).omit({
  id: true,
  createdAt: true,
});

export const waitlistEmailSchema = z.object({
  email: z.string().email("Adresse email invalide"),
});

export type WaitlistEntry = typeof waitlistTable.$inferSelect;
export type InsertWaitlistEntry = z.infer<typeof insertWaitlistSchema>;
