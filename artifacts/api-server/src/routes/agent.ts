import { Router, type IRouter } from "express";
import { eq, count, sql, desc } from "drizzle-orm";
import { db, conversationsTable, messagesTable, incidentsTable } from "@workspace/db";
import {
  QueryAgentBody,
  CreateConversationBody,
  GetConversationMessagesParams,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ── Conversations ────────────────────────────────────────────────

router.get("/agent/conversations", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: conversationsTable.id,
      title: conversationsTable.title,
      createdAt: conversationsTable.createdAt,
      messageCount: count(messagesTable.id),
    })
    .from(conversationsTable)
    .leftJoin(messagesTable, eq(messagesTable.conversationId, conversationsTable.id))
    .groupBy(conversationsTable.id)
    .orderBy(desc(conversationsTable.createdAt));

  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/agent/conversations", async (req, res): Promise<void> => {
  const parsed = CreateConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [convo] = await db.insert(conversationsTable).values(parsed.data).returning();
  const result = { id: convo.id, title: convo.title, createdAt: convo.createdAt.toISOString(), messageCount: 0 };
  res.status(201).json(result);
});

router.get("/agent/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = GetConversationMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const msgs = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, params.data.id))
    .orderBy(messagesTable.createdAt);

  res.json(msgs.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })));
});

// ── AI Query ──────────────────────────────────────────────────────

router.post("/agent/query", async (req, res): Promise<void> => {
  const parsed = QueryAgentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { question, conversationId } = parsed.data;

  // Gather live context from the DB to use as RAG context
  const [summaryRow] = await db
    .select({ count: count() })
    .from(incidentsTable);

  const topTypes = await db
    .select({ crimeType: incidentsTable.crimeType, count: count() })
    .from(incidentsTable)
    .groupBy(incidentsTable.crimeType)
    .orderBy(desc(count()))
    .limit(5);

  const topDistricts = await db
    .select({ district: incidentsTable.district, count: count() })
    .from(incidentsTable)
    .groupBy(incidentsTable.district)
    .orderBy(desc(count()))
    .limit(5);

  const recentIncidents = await db
    .select()
    .from(incidentsTable)
    .orderBy(sql`${incidentsTable.occurredAt} desc`)
    .limit(5);

  const context = `
Crime Database Context:
- Total incidents recorded: ${summaryRow?.count ?? 0}
- Top crime types: ${topTypes.map(t => `${t.crimeType} (${t.count})`).join(", ")}
- Most affected districts: ${topDistricts.map(d => `${d.district} (${d.count})`).join(", ")}
- Recent incidents: ${recentIncidents.map(i => `[${i.severity.toUpperCase()}] ${i.crimeType} in ${i.district} on ${i.occurredAt.toLocaleDateString()}`).join("; ")}
`.trim();

  // Resolve or create conversation
  let convoId = conversationId ?? null;
  if (!convoId) {
    const [newConvo] = await db
      .insert(conversationsTable)
      .values({ title: question.slice(0, 60) })
      .returning();
    convoId = newConvo.id;
  }

  // Save user message
  const [userMsg] = await db
    .insert(messagesTable)
    .values({ conversationId: convoId, role: "user", content: question })
    .returning();

  // Check for OpenAI API key
  const apiKey = process.env.OPENAI_API_KEY;

  let answer: string;
  let insights: string[] = [];
  let sources: string[] = ["Live crime database", "Incident records"];

  if (!apiKey) {
    answer = "AI agent is not configured. Please provide an OPENAI_API_KEY environment variable to enable natural language crime analysis.";
  } else {
    try {
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey });

      // Retrieve prior conversation messages for context
      const priorMessages = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.conversationId, convoId))
        .orderBy(messagesTable.createdAt)
        .limit(20);

      const chatMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
        {
          role: "system",
          content: `You are an expert crime analysis AI agent embedded in a law enforcement intelligence dashboard. 
You have access to real-time crime data from the database. Use the context provided to give evidence-based, analytical responses.
Always be precise, cite the data, and provide actionable insights where possible.
Format your response clearly. End with 2-3 bullet-point insights if relevant.

${context}`,
        },
        ...priorMessages
          .filter(m => m.id !== userMsg.id)
          .map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user", content: question },
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: chatMessages,
        max_tokens: 1024,
      });

      answer = completion.choices[0]?.message?.content ?? "No response generated.";

      // Extract bullet insights from response
      const bulletMatches = answer.match(/^[-•*]\s+.+/gm) ?? [];
      insights = bulletMatches.slice(0, 3).map(b => b.replace(/^[-•*]\s+/, ""));
    } catch (err) {
      logger.error({ err }, "OpenAI API error");
      answer = "An error occurred while querying the AI agent. Please check your API key configuration.";
    }
  }

  // Save assistant message
  const [assistantMsg] = await db
    .insert(messagesTable)
    .values({ conversationId: convoId, role: "assistant", content: answer })
    .returning();

  res.json({
    answer,
    conversationId: convoId,
    messageId: assistantMsg.id,
    sources,
    insights,
  });
});

export default router;
