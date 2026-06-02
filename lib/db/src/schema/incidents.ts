import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const incidentsTable = pgTable("incidents", {
  id: serial("id").primaryKey(),
  crimeType: text("crime_type").notNull(),
  description: text("description"),
  district: text("district").notNull(),
  address: text("address"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  severity: text("severity").notNull().default("medium"),
  status: text("status").notNull().default("open"),
  victimCount: integer("victim_count"),
  suspectDescription: text("suspect_description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertIncidentSchema = createInsertSchema(incidentsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type Incident = typeof incidentsTable.$inferSelect;
