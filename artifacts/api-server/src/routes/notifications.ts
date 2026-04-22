import { Router, type IRouter } from "express";
import { db, notificationsTable, requestsTable, messagesTable } from "@workspace/db";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { serializeNotification } from "../lib/serialize";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/notifications", async (req, res) => {
  const rows = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, req.user!.id))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(100);
  res.json(rows.map(serializeNotification));
});

router.post("/notifications/read-all", async (req, res) => {
  await db
    .update(notificationsTable)
    .set({ readAt: new Date() })
    .where(and(eq(notificationsTable.userId, req.user!.id), isNull(notificationsTable.readAt)));
  res.json({ ok: true });
});

router.get("/notifications/unread-count", async (req, res) => {
  const me = req.user!.id;
  const [n] = await db
    .select({ c: sql<number>`count(*)` })
    .from(notificationsTable)
    .where(and(eq(notificationsTable.userId, me), isNull(notificationsTable.readAt)));
  const [m] = await db
    .select({ c: sql<number>`count(*)` })
    .from(messagesTable)
    .where(and(eq(messagesTable.recipientId, me), isNull(messagesTable.readAt)));
  const [r] = await db
    .select({ c: sql<number>`count(*)` })
    .from(requestsTable)
    .where(and(eq(requestsTable.travellerId, me), eq(requestsTable.status, "PENDING")));
  res.json({
    notifications: Number(n?.c ?? 0),
    chats: Number(m?.c ?? 0),
    requests: Number(r?.c ?? 0),
  });
});

export default router;
