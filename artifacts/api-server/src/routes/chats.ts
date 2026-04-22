import { Router, type IRouter } from "express";
import { db, messagesTable, requestsTable, deliveriesTable, parcelsTable, usersTable } from "@workspace/db";
import { aliasedTable, and, asc, desc, eq, isNull, or, sql } from "drizzle-orm";
import { zodSchemas } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { makeId } from "../lib/ids";
import { serializeMessage, serializeUser } from "../lib/serialize";
import { notify } from "../lib/notify";

const router: IRouter = Router();
router.use(requireAuth);

// threadId is the requestId (one chat per accepted/active request).
// Verify the user is part of the request.
async function verifyThreadAccess(threadId: string, userId: string) {
  const r = (await db.select().from(requestsTable).where(eq(requestsTable.id, threadId)).limit(1))[0];
  if (!r) return null;
  if (r.senderId !== userId && r.travellerId !== userId) return null;
  return r;
}

router.get("/chats", async (req, res) => {
  const me = req.user!.id;
  // All requests where user participates and that are accepted (delivery exists) or pending.
  const reqRows = await db
    .select()
    .from(requestsTable)
    .where(or(eq(requestsTable.senderId, me), eq(requestsTable.travellerId, me)))
    .orderBy(desc(requestsTable.updatedAt));

  const result = [] as unknown[];
  for (const r of reqRows) {
    const otherId = r.senderId === me ? r.travellerId : r.senderId;
    const otherUser = (await db.select().from(usersTable).where(eq(usersTable.id, otherId)).limit(1))[0];
    if (!otherUser) continue;
    const parcel = (await db.select().from(parcelsTable).where(eq(parcelsTable.id, r.parcelId)).limit(1))[0];
    const lastMsg = (
      await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.threadId, r.id))
        .orderBy(desc(messagesTable.createdAt))
        .limit(1)
    )[0];
    if (!lastMsg) continue;
    const unreadAgg = await db
      .select({ c: sql<number>`count(*)` })
      .from(messagesTable)
      .where(and(eq(messagesTable.threadId, r.id), eq(messagesTable.recipientId, me), isNull(messagesTable.readAt)));
    const unreadCount = Number(unreadAgg[0]?.c ?? 0);
    const delivery = (await db.select().from(deliveriesTable).where(eq(deliveriesTable.requestId, r.id)).limit(1))[0];
    result.push({
      threadId: r.id,
      otherUser: serializeUser(otherUser),
      parcelTitle: parcel ? `${parcel.fromCity} → ${parcel.toCity}` : "Parcel",
      deliveryStage: delivery?.stage ?? null,
      unreadCount,
      lastMessage: serializeMessage(lastMsg),
    });
  }
  res.json(result);
});

router.get("/chats/:threadId/messages", async (req, res) => {
  const r = await verifyThreadAccess(req.params.threadId, req.user!.id);
  if (!r) return res.status(404).json({ error: "Thread not found" });
  const rows = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.threadId, req.params.threadId))
    .orderBy(asc(messagesTable.createdAt));
  res.json(rows.map(serializeMessage));
});

router.post("/chats/:threadId/messages", async (req, res) => {
  const body = zodSchemas.SendMessageBody.parse(req.body);
  const r = await verifyThreadAccess(req.params.threadId, req.user!.id);
  if (!r) return res.status(404).json({ error: "Thread not found" });
  const recipientId = r.senderId === req.user!.id ? r.travellerId : r.senderId;
  const inserted = (
    await db
      .insert(messagesTable)
      .values({
        id: makeId("msg"),
        threadId: req.params.threadId,
        senderId: req.user!.id,
        recipientId,
        text: body.text,
      })
      .returning()
  )[0];
  await notify({
    userId: recipientId,
    type: "MESSAGE",
    title: req.user!.name,
    body: body.text.slice(0, 120),
    data: { threadId: req.params.threadId },
  });
  res.json(serializeMessage(inserted));
});

router.post("/chats/:threadId/read", async (req, res) => {
  const r = await verifyThreadAccess(req.params.threadId, req.user!.id);
  if (!r) return res.status(404).json({ error: "Thread not found" });
  await db
    .update(messagesTable)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(messagesTable.threadId, req.params.threadId),
        eq(messagesTable.recipientId, req.user!.id),
        isNull(messagesTable.readAt),
      ),
    );
  res.json({ ok: true });
});

export default router;
