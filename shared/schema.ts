import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});


export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;


export const memories = pgTable("memories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertMemorySchema = createInsertSchema(memories).pick({
  title: true,
  content: true,
});

export type InsertMemory = z.infer<typeof insertMemorySchema>;
export type Memory = typeof memories.$inferSelect;

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentName: text("agent_name").notNull().default("AtendePsi AI"),
  communicationTone: text("communication_tone").notNull().default("Objetiva"),
  restrictions: json("restrictions").$type<string[]>().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  isConnected: boolean("is_connected").notNull().default(true),
  whatsappActive: boolean("whatsapp_active").notNull().default(true),
  scheduleActive: boolean("schedule_active").notNull().default(true),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

export const googleTokens = pgTable("google_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Intentionally not a foreign key for now if users table is not strictly managed or if we want flexibility
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  email: text("email").notNull(),
  scope: text("scope").notNull(),
  expiresIn: text("expires_in"), // Storing as text or number depending on provider, text is safer for varying formats
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertGoogleTokenSchema = createInsertSchema(googleTokens).omit({
  id: true,
  createdAt: true
});

export type InsertGoogleToken = z.infer<typeof insertGoogleTokenSchema>;
export type GoogleToken = typeof googleTokens.$inferSelect;
