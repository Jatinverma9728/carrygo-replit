import { Router, type IRouter } from "express";
import { db, requestsTable, parcelsTable, tripsTable, usersTable, deliveriesTable } from "@workspace/db";
import { aliasedTable } from "drizzle-orm";
import { and, desc, eq, or } from "drizzle-orm";
import { zodSchemas } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { makeId, makeOtp } from "../lib/ids";
import { serializeRequest, serializeDelivery } from "../lib/serialize";
import { notify } from "../lib/notify";

const router: IRouter = Router();
router.use(requireAuth);

const sender = aliasedTable(usersTable, "sender");
const traveller = aliasedTable(usersTable, "traveller");

async function loadRequest(id: string) {
  const rows = await db
    .select({
      request: requestsTable,
      parcel: parcelsTable,
      trip: tripsTable,
      sender,
      traveller,
    })
    .from(requestsTable)
    .innerJoin(parcelsTable, eq(parcelsTable.id, requestsTable.parcelId))
    .innerJoin(tripsTable, eq(tripsTable.id, requestsTable.tripId))
    .innerJoin(sender, eq(sender.id, requestsTable.senderId))
    .innerJoin(traveller, eq(traveller.id, requestsTable.travellerId))
    .where(eq(requestsTable.id, id))
    .limit(1);
  return rows[0];
}

router.get("/requests", async (req, res) => {
  const direction = typeof req.query.direction === "string" ? req.query.direction : "all";
  const me = req.user!.id;
  const cond =
    direction === "incoming"
      ? eq(requestsTable.travellerId, me)
      : direction === "outgoing"
      ? eq(requestsTable.senderId, me)
      : or(eq(requestsTable.travellerId, me), eq(requestsTable.senderId, me));
  const rows = await db
    .select({
      request: requestsTable,
      parcel: parcelsTable,
      trip: tripsTable,
      sender,
      traveller,
    })
    .from(requestsTable)
    .innerJoin(parcelsTable, eq(parcelsTable.id, requestsTable.parcelId))
    .innerJoin(tripsTable, eq(tripsTable.id, requestsTable.tripId))
    .innerJoin(sender, eq(sender.id, requestsTable.senderId))
    .innerJoin(traveller, eq(traveller.id, requestsTable.travellerId))
    .where(cond)
    .orderBy(desc(requestsTable.createdAt));
  res.json(
    rows.map((r) => serializeRequest(r.request, r.parcel, r.trip, r.sender, r.traveller)),
  );
});

router.post("/requests", async (req, res) => {
  const body = zodSchemas.CreateRequestBody.parse(req.body);
  const parcel = (await db.select().from(parcelsTable).where(eq(parcelsTable.id, body.parcelId)).limit(1))[0];
  const trip = (await db.select().from(tripsTable).where(eq(tripsTable.id, body.tripId)).limit(1))[0];
  if (!parcel || !trip) return res.status(404).json({ error: "Not found" });
  if (parcel.senderId !== req.user!.id) return res.status(403).json({ error: "Only sender may request" });
  if (parcel.status !== "OPEN") return res.status(400).json({ error: "Parcel is not open" });

  const dup = (
    await db
      .select()
      .from(requestsTable)
      .where(
        and(
          eq(requestsTable.parcelId, body.parcelId),
          eq(requestsTable.tripId, body.tripId),
          eq(requestsTable.status, "PENDING"),
        ),
      )
      .limit(1)
  )[0];
  if (dup) {
    const full = await loadRequest(dup.id);
    return res.json(serializeRequest(full.request, full.parcel, full.trip, full.sender, full.traveller));
  }

  const inserted = (
    await db
      .insert(requestsTable)
      .values({
        id: makeId("req"),
        parcelId: body.parcelId,
        tripId: body.tripId,
        senderId: parcel.senderId,
        travellerId: trip.travellerId,
        message: body.message ?? null,
      })
      .returning()
  )[0];

  await notify({
    userId: trip.travellerId,
    type: "REQUEST_NEW",
    title: "New parcel request",
    body: `${req.user!.name} wants you to carry a parcel from ${parcel.fromCity} to ${parcel.toCity}.`,
    data: { requestId: inserted.id, parcelId: parcel.id },
  });

  const full = await loadRequest(inserted.id);
  res.json(serializeRequest(full.request, full.parcel, full.trip, full.sender, full.traveller));
});

router.post("/requests/:id/accept", async (req, res) => {
  const reqRow = (await db.select().from(requestsTable).where(eq(requestsTable.id, req.params.id)).limit(1))[0];
  if (!reqRow) return res.status(404).json({ error: "Not found" });
  if (reqRow.travellerId !== req.user!.id) return res.status(403).json({ error: "Forbidden" });
  if (reqRow.status !== "PENDING") return res.status(400).json({ error: "Not pending" });

  const parcel = (await db.select().from(parcelsTable).where(eq(parcelsTable.id, reqRow.parcelId)).limit(1))[0];
  if (!parcel) return res.status(404).json({ error: "Parcel missing" });

  await db
    .update(requestsTable)
    .set({ status: "ACCEPTED", updatedAt: new Date() })
    .where(eq(requestsTable.id, reqRow.id));
  // auto-reject other pending requests for the same parcel
  await db
    .update(requestsTable)
    .set({ status: "REJECTED", updatedAt: new Date() })
    .where(and(eq(requestsTable.parcelId, reqRow.parcelId), eq(requestsTable.status, "PENDING")));
  await db.update(parcelsTable).set({ status: "MATCHED" }).where(eq(parcelsTable.id, parcel.id));

  const delivery = (
    await db
      .insert(deliveriesTable)
      .values({
        id: makeId("dlv"),
        requestId: reqRow.id,
        parcelId: parcel.id,
        tripId: reqRow.tripId,
        senderId: reqRow.senderId,
        travellerId: reqRow.travellerId,
        otp: makeOtp(),
        pricePaid: parcel.priceOffer,
      })
      .returning()
  )[0];

  await notify({
    userId: reqRow.senderId,
    type: "REQUEST_ACCEPTED",
    title: "Request accepted",
    body: `${req.user!.name} accepted your delivery request.`,
    data: { deliveryId: delivery.id },
  });

  const senderUser = (await db.select().from(usersTable).where(eq(usersTable.id, reqRow.senderId)).limit(1))[0];
  const trip = (await db.select().from(tripsTable).where(eq(tripsTable.id, reqRow.tripId)).limit(1))[0];
  res.json(serializeDelivery(delivery, parcel, trip, senderUser, req.user!, req.user!.id));
});

router.post("/requests/:id/reject", async (req, res) => {
  const reqRow = (await db.select().from(requestsTable).where(eq(requestsTable.id, req.params.id)).limit(1))[0];
  if (!reqRow) return res.status(404).json({ error: "Not found" });
  if (reqRow.travellerId !== req.user!.id) return res.status(403).json({ error: "Forbidden" });
  await db
    .update(requestsTable)
    .set({ status: "REJECTED", updatedAt: new Date() })
    .where(eq(requestsTable.id, reqRow.id));
  await notify({
    userId: reqRow.senderId,
    type: "REQUEST_REJECTED",
    title: "Request declined",
    body: `${req.user!.name} declined your delivery request.`,
    data: { requestId: reqRow.id },
  });
  const full = await loadRequest(reqRow.id);
  res.json(serializeRequest(full.request, full.parcel, full.trip, full.sender, full.traveller));
});

router.post("/requests/:id/cancel", async (req, res) => {
  const reqRow = (await db.select().from(requestsTable).where(eq(requestsTable.id, req.params.id)).limit(1))[0];
  if (!reqRow) return res.status(404).json({ error: "Not found" });
  if (reqRow.senderId !== req.user!.id) return res.status(403).json({ error: "Forbidden" });
  await db
    .update(requestsTable)
    .set({ status: "CANCELLED", updatedAt: new Date() })
    .where(eq(requestsTable.id, reqRow.id));
  const full = await loadRequest(reqRow.id);
  res.json(serializeRequest(full.request, full.parcel, full.trip, full.sender, full.traveller));
});

export default router;
