import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, documentsTable } from "@workspace/db";
import { DeleteDocumentParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/documents", async (_req, res): Promise<void> => {
  const docs = await db
    .select()
    .from(documentsTable)
    .orderBy(documentsTable.createdAt);

  res.json(docs.map(d => ({ ...d, createdAt: d.createdAt.toISOString() })));
});

router.delete("/documents/:id", async (req, res): Promise<void> => {
  const params = DeleteDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [doc] = await db
    .delete(documentsTable)
    .where(eq(documentsTable.id, params.data.id))
    .returning();

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
