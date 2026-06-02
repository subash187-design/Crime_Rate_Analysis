import { Router, type IRouter } from "express";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db, incidentsTable } from "@workspace/db";
import {
  ListIncidentsQueryParams,
  CreateIncidentBody,
  GetIncidentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/incidents", async (req, res): Promise<void> => {
  const query = ListIncidentsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { crimeType, district, startDate, endDate, limit = 50, offset = 0 } = query.data;

  const conditions = [];
  if (crimeType) conditions.push(eq(incidentsTable.crimeType, crimeType));
  if (district) conditions.push(eq(incidentsTable.district, district));
  if (startDate) conditions.push(gte(incidentsTable.occurredAt, new Date(startDate)));
  if (endDate) conditions.push(lte(incidentsTable.occurredAt, new Date(endDate)));

  const incidents = await db
    .select()
    .from(incidentsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`${incidentsTable.occurredAt} desc`)
    .limit(limit ?? 50)
    .offset(offset ?? 0);

  res.json(incidents.map(toIncidentResponse));
});

router.post("/incidents", async (req, res): Promise<void> => {
  const parsed = CreateIncidentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { occurredAt, ...rest } = parsed.data;
  const [incident] = await db
    .insert(incidentsTable)
    .values({ ...rest, occurredAt: new Date(occurredAt) })
    .returning();

  res.status(201).json(toIncidentResponse(incident));
});

router.get("/incidents/:id", async (req, res): Promise<void> => {
  const params = GetIncidentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [incident] = await db
    .select()
    .from(incidentsTable)
    .where(eq(incidentsTable.id, params.data.id));

  if (!incident) {
    res.status(404).json({ error: "Incident not found" });
    return;
  }

  res.json(toIncidentResponse(incident));
});

function toIncidentResponse(incident: typeof incidentsTable.$inferSelect) {
  return {
    ...incident,
    occurredAt: incident.occurredAt.toISOString(),
    createdAt: incident.createdAt.toISOString(),
  };
}

export default router;
