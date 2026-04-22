import { Router, type IRouter } from "express";
import { db, deliveriesTable, parcelsTable, tripsTable, usersTable, ratingsTable } from "@workspace/db";
import { aliasedTable, and, desc, eq, or, sql } from "drizzle-orm";
import { zodSchemas } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { serializeDelivery } from "../lib/serialize";
import { notify } from "../lib/notify";
import { makeId } from "../lib/ids";

const router: IRouter = Router();
router.use(requireAuth);

const sender = aliasedTable(usersTable, "d_sender");
const traveller = aliasedTable(usersTable, "d_traveller");

async function loadDelivery(id: string) {
  const rows = await db
    .select({ delivery: deliveriesTable, parcel: parcelsTable, trip: tripsTable, sender, traveller })
    .from(deliveriesTable)
    .innerJoin(parcelsTable, eq(parcelsTable.id, deliveriesTable.parcelId))
    .innerJoin(tripsTable, eq(tripsTable.id, deliveriesTable.tripId))
    .innerJoin(sender, eq(sender.id, deliveriesTable.senderId))
    .innerJoin(traveller, eq(traveller.id, deliveriesTable.travellerId))
    .where(eq(deliveriesTable.id, id))
    .limit(1);
  return rows[0];
}

router.get("/deliveries", async (req, res) => {
  const me = req.user!.id;
  const rows = await db
    .select({ delivery: deliveriesTable, parcel: parcelsTable, trip: tripsTable, sender, traveller })
    .from(deliveriesTable)
    .innerJoin(parcelsTable, eq(parcelsTable.id, deliveriesTable.parcelId))
    .innerJoin(tripsTable, eq(tripsTable.id, deliveriesTable.tripId))
    .innerJoin(sender, eq(sender.id, deliveriesTable.senderId))
    .innerJoin(traveller, eq(traveller.id, deliveriesTable.travellerId))
    .where(or(eq(deliveriesTable.senderId, me), eq(deliveriesTable.travellerId, me)))
    .orderBy(desc(deliveriesTable.createdAt));
  res.json(rows.map((r) => serializeDelivery(r.delivery, r.parcel, r.trip, r.sender, r.traveller, me)));
});

router.get("/deliveries/:id", async (req, res) => {
  const r = await loadDelivery(req.params.id);
  if (!r) return res.status(404).json({ error: "Not found" });
  const me = req.user!.id;
  if (r.delivery.senderId !== me && r.delivery.travellerId !== me) return res.status(403).json({ error: "Forbidden" });
  res.json(serializeDelivery(r.delivery, r.parcel, r.trip, r.sender, r.traveller, me));
});

router.post("/deliveries/:id/pickup", async (req, res) => {
  const r = await loadDelivery(req.params.id);
  if (!r) return res.status(404).json({ error: "Not found" });
  if (r.delivery.travellerId !== req.user!.id) return res.status(403).json({ error: "Only traveller may confirm pickup" });
  if (r.delivery.stage !== "AWAITING_PICKUP") return res.status(400).json({ error: "Not awaiting pickup" });
  await db
    .update(deliveriesTable)
    .set({ stage: "IN_TRANSIT", pickupConfirmedAt: new Date() })
    .where(eq(deliveriesTable.id, r.delivery.id));
  await notify({
    userId: r.delivery.senderId,
    type: "PICKUP_CONFIRMED",
    title: "Parcel picked up",
    body: `${req.user!.name} confirmed pickup. Track delivery in real time.`,
    data: { deliveryId: r.delivery.id },
  });
  const fresh = await loadDelivery(r.delivery.id);
  res.json(serializeDelivery(fresh.delivery, fresh.parcel, fresh.trip, fresh.sender, fresh.traveller, req.user!.id));
});

router.post("/deliveries/:id/handoff", async (req, res) => {
  const body = zodSchemas.ConfirmHandoffBody.parse(req.body);
  const r = await loadDelivery(req.params.id);
  if (!r) return res.status(404).json({ error: "Not found" });
  if (r.delivery.travellerId !== req.user!.id) return res.status(403).json({ error: "Only traveller may complete handoff" });
  if (r.delivery.stage !== "IN_TRANSIT") return res.status(400).json({ error: "Not in transit" });
  if (body.otp !== r.delivery.otp) return res.status(400).json({ error: "Wrong OTP. Ask the receiver for the correct code." });

  await db
    .update(deliveriesTable)
    .set({ stage: "DELIVERED", deliveryConfirmedAt: new Date(), escrowReleased: true })
    .where(eq(deliveriesTable.id, r.delivery.id));
  await db.update(parcelsTable).set({ status: "DELIVERED" }).where(eq(parcelsTable.id, r.parcel.id));
  await db.update(tripsTable).set({ status: "COMPLETED" }).where(eq(tripsTable.id, r.trip.id));

  await notify({
    userId: r.delivery.senderId,
    type: "DELIVERED",
    title: "Parcel delivered",
    body: `${req.user!.name} delivered your parcel. Escrow released.`,
    data: { deliveryId: r.delivery.id },
  });
  await notify({
    userId: r.delivery.travellerId,
    type: "PAYOUT",
    title: "Payment released",
    body: `₹${r.delivery.pricePaid} has been released to your wallet.`,
    data: { deliveryId: r.delivery.id },
  });

  const fresh = await loadDelivery(r.delivery.id);
  res.json(serializeDelivery(fresh.delivery, fresh.parcel, fresh.trip, fresh.sender, fresh.traveller, req.user!.id));
});

router.post("/deliveries/:id/fail", async (req, res) => {
  const body = zodSchemas.FailDeliveryBody.parse(req.body);
  const r = await loadDelivery(req.params.id);
  if (!r) return res.status(404).json({ error: "Not found" });
  if (r.delivery.travellerId !== req.user!.id && r.delivery.senderId !== req.user!.id)
    return res.status(403).json({ error: "Forbidden" });
  if (r.delivery.stage === "DELIVERED") return res.status(400).json({ error: "Already delivered" });
  await db
    .update(deliveriesTable)
    .set({ stage: "FAILED", failedReason: body.reason })
    .where(eq(deliveriesTable.id, r.delivery.id));
  await db.update(parcelsTable).set({ status: "FAILED" }).where(eq(parcelsTable.id, r.parcel.id));
  const otherUser = req.user!.id === r.delivery.senderId ? r.delivery.travellerId : r.delivery.senderId;
  await notify({
    userId: otherUser,
    type: "FAILED",
    title: "Delivery failed",
    body: `Reason: ${body.reason}`,
    data: { deliveryId: r.delivery.id },
  });
  const fresh = await loadDelivery(r.delivery.id);
  res.json(serializeDelivery(fresh.delivery, fresh.parcel, fresh.trip, fresh.sender, fresh.traveller, req.user!.id));
});

router.post("/deliveries/:id/rate", async (req, res) => {
  const body = zodSchemas.RateDeliveryBody.parse(req.body);
  const r = await loadDelivery(req.params.id);
  if (!r) return res.status(404).json({ error: "Not found" });
  const me = req.user!.id;
  const isSender = r.delivery.senderId === me;
  const isTraveller = r.delivery.travellerId === me;
  if (!isSender && !isTraveller) return res.status(403).json({ error: "Forbidden" });
  if (r.delivery.stage !== "DELIVERED") return res.status(400).json({ error: "Can only rate completed deliveries" });
  if (isSender && r.delivery.senderRated) return res.status(400).json({ error: "Already rated" });
  if (isTraveller && r.delivery.travellerRated) return res.status(400).json({ error: "Already rated" });

  const rateeId = isSender ? r.delivery.travellerId : r.delivery.senderId;

  await db.insert(ratingsTable).values({
    id: makeId("rate"),
    deliveryId: r.delivery.id,
    raterId: me,
    rateeId,
    stars: body.stars,
    comment: body.comment ?? null,
  });
  await db
    .update(deliveriesTable)
    .set(isSender ? { senderRated: true } : { travellerRated: true })
    .where(eq(deliveriesTable.id, r.delivery.id));
  // recompute rating average
  const agg = await db
    .select({ avg: sql<number>`avg(${ratingsTable.stars})`, c: sql<number>`count(*)` })
    .from(ratingsTable)
    .where(eq(ratingsTable.rateeId, rateeId));
  const newAvg = Number(agg[0]?.avg ?? 5);
  const newCount = Number(agg[0]?.c ?? 0);
  await db.update(usersTable).set({ rating: newAvg, ratingsCount: newCount }).where(eq(usersTable.id, rateeId));

  await notify({
    userId: rateeId,
    type: "RATED",
    title: "You got a rating",
    body: `${req.user!.name} rated you ${body.stars} stars.`,
    data: { deliveryId: r.delivery.id },
  });

  const fresh = await loadDelivery(r.delivery.id);
  res.json(serializeDelivery(fresh.delivery, fresh.parcel, fresh.trip, fresh.sender, fresh.traveller, me));
});

export default router;
