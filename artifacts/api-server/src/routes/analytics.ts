import { Router, type IRouter } from "express";
import { eq, and, gte, lte, sql, count, desc } from "drizzle-orm";
import { db, incidentsTable } from "@workspace/db";
import {
  GetIncidentsByTypeQueryParams,
  GetIncidentsByDistrictQueryParams,
  GetCrimeTrendQueryParams,
  GetHotspotsQueryParams,
  GetRecentIncidentsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/analytics/summary", async (_req, res): Promise<void> => {
  const [totalRow] = await db
    .select({ count: count() })
    .from(incidentsTable);

  const [openRow] = await db
    .select({ count: count() })
    .from(incidentsTable)
    .where(eq(incidentsTable.status, "open"));

  const [closedRow] = await db
    .select({ count: count() })
    .from(incidentsTable)
    .where(eq(incidentsTable.status, "closed"));

  const [criticalRow] = await db
    .select({ count: count() })
    .from(incidentsTable)
    .where(eq(incidentsTable.severity, "critical"));

  // Top crime type
  const topTypeRows = await db
    .select({ crimeType: incidentsTable.crimeType, count: count() })
    .from(incidentsTable)
    .groupBy(incidentsTable.crimeType)
    .orderBy(desc(count()))
    .limit(1);

  // Top district
  const topDistrictRows = await db
    .select({ district: incidentsTable.district, count: count() })
    .from(incidentsTable)
    .groupBy(incidentsTable.district)
    .orderBy(desc(count()))
    .limit(1);

  const total = totalRow?.count ?? 0;

  // Monthly change: compare this month vs last month
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [thisMonthRow] = await db
    .select({ count: count() })
    .from(incidentsTable)
    .where(gte(incidentsTable.occurredAt, thisMonthStart));

  const [lastMonthRow] = await db
    .select({ count: count() })
    .from(incidentsTable)
    .where(
      and(
        gte(incidentsTable.occurredAt, lastMonthStart),
        lte(incidentsTable.occurredAt, thisMonthStart)
      )
    );

  const thisMonth = thisMonthRow?.count ?? 0;
  const lastMonth = lastMonthRow?.count ?? 1;
  const changeFromLastMonth = lastMonth > 0
    ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100 * 10) / 10
    : 0;

  // Avg daily: total / 30
  const avgDailyIncidents = Math.round((total / 30) * 10) / 10;

  res.json({
    totalIncidents: total,
    openCases: openRow?.count ?? 0,
    closedCases: closedRow?.count ?? 0,
    criticalIncidents: criticalRow?.count ?? 0,
    avgDailyIncidents,
    topCrimeType: topTypeRows[0]?.crimeType ?? "N/A",
    topDistrict: topDistrictRows[0]?.district ?? "N/A",
    changeFromLastMonth,
  });
});

router.get("/analytics/by-type", async (req, res): Promise<void> => {
  const query = GetIncidentsByTypeQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { startDate, endDate } = query.data;
  const conditions = [];
  if (startDate) conditions.push(gte(incidentsTable.occurredAt, new Date(startDate)));
  if (endDate) conditions.push(lte(incidentsTable.occurredAt, new Date(endDate)));

  const rows = await db
    .select({ crimeType: incidentsTable.crimeType, count: count() })
    .from(incidentsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(incidentsTable.crimeType)
    .orderBy(desc(count()));

  res.json(rows);
});

router.get("/analytics/by-district", async (req, res): Promise<void> => {
  const query = GetIncidentsByDistrictQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { startDate, endDate } = query.data;
  const conditions = [];
  if (startDate) conditions.push(gte(incidentsTable.occurredAt, new Date(startDate)));
  if (endDate) conditions.push(lte(incidentsTable.occurredAt, new Date(endDate)));

  const rows = await db
    .select({ district: incidentsTable.district, count: count() })
    .from(incidentsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(incidentsTable.district)
    .orderBy(desc(count()));

  res.json(rows);
});

router.get("/analytics/trend", async (req, res): Promise<void> => {
  const query = GetCrimeTrendQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { crimeType, months = 12 } = query.data;
  const monthsBack = months ?? 12;

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - monthsBack);

  const conditions: ReturnType<typeof eq>[] = [];
  if (crimeType) conditions.push(eq(incidentsTable.crimeType, crimeType));
  conditions.push(gte(incidentsTable.occurredAt, startDate));

  const rows = await db
    .select({
      month: sql<string>`to_char(${incidentsTable.occurredAt}, 'YYYY-MM')`,
      count: count(),
    })
    .from(incidentsTable)
    .where(and(...conditions))
    .groupBy(sql`to_char(${incidentsTable.occurredAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${incidentsTable.occurredAt}, 'YYYY-MM')`);

  res.json(rows.map(r => ({ month: r.month, count: r.count, crimeType: crimeType ?? null })));
});

router.get("/analytics/hotspots", async (req, res): Promise<void> => {
  const query = GetHotspotsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { crimeType, limit = 20 } = query.data;
  const conditions = [];
  if (crimeType) conditions.push(eq(incidentsTable.crimeType, crimeType));

  const rows = await db
    .select({
      latitude: sql<number>`round(${incidentsTable.latitude}::numeric, 2)`,
      longitude: sql<number>`round(${incidentsTable.longitude}::numeric, 2)`,
      district: incidentsTable.district,
      crimeType: incidentsTable.crimeType,
      count: count(),
    })
    .from(incidentsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(
      sql`round(${incidentsTable.latitude}::numeric, 2)`,
      sql`round(${incidentsTable.longitude}::numeric, 2)`,
      incidentsTable.district,
      incidentsTable.crimeType
    )
    .orderBy(desc(count()))
    .limit(limit ?? 20);

  res.json(
    rows.map(r => ({
      ...r,
      riskLevel: r.count >= 10 ? "critical" : r.count >= 5 ? "high" : r.count >= 2 ? "medium" : "low",
    }))
  );
});

router.get("/analytics/hourly-pattern", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      hour: sql<number>`extract(hour from ${incidentsTable.occurredAt})::int`,
      count: count(),
    })
    .from(incidentsTable)
    .groupBy(sql`extract(hour from ${incidentsTable.occurredAt})`)
    .orderBy(sql`extract(hour from ${incidentsTable.occurredAt})`);

  // Fill in missing hours with 0
  const hourMap = new Map(rows.map(r => [r.hour, r.count]));
  const full = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: hourMap.get(h) ?? 0,
  }));

  res.json(full);
});

router.get("/analytics/recent", async (req, res): Promise<void> => {
  const query = GetRecentIncidentsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { limit = 10 } = query.data;

  const incidents = await db
    .select()
    .from(incidentsTable)
    .orderBy(sql`${incidentsTable.occurredAt} desc`)
    .limit(limit ?? 10);

  res.json(
    incidents.map(i => ({
      ...i,
      occurredAt: i.occurredAt.toISOString(),
      createdAt: i.createdAt.toISOString(),
    }))
  );
});

export default router;
