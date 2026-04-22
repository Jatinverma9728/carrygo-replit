import { Router, type IRouter } from "express";
import { db, parcelsTable, tripsTable, usersTable } from "@workspace/db";
import { and, desc, eq, gte, ilike, lte } from "drizzle-orm";
import { zodSchemas } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { makeId } from "../lib/ids";
import { serializeParcel, serializeTrip } from "../lib/serialize";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/parcels", async (req, res) => {
  const mine = req.query.mine === "true";
  const conditions = mine
    ? [eq(parcelsTable.senderId, req.user!.id)]
    : [eq(parcelsTable.status, "OPEN")];
  const rows = await db
    .select({ parcel: parcelsTable, sender: usersTable })
    .from(parcelsTable)
    .innerJoin(usersTable, eq(parcelsTable.senderId, usersTable.id))
    .where(and(...conditions))
    .orderBy(desc(parcelsTable.createdAt))
    .limit(200);
  res.json(rows.map((r) => serializeParcel(r.parcel, r.sender)));
});

router.post("/parcels", async (req, res) => {
  const body = zodSchemas.CreateParcelBody.parse(req.body);
  const inserted = (
    await db
      .insert(parcelsTable)
      .values({
        id: makeId("parcel"),
        senderId: req.user!.id,
        fromCity: body.fromCity,
        toCity: body.toCity,
        date: body.date,
        category: body.category,
        description: body.description,
        weightKg: body.weightKg,
        priceOffer: body.priceOffer,
        receiverName: body.receiverName,
        receiverPhone: body.receiverPhone,
        imageUri: body.imageUri ?? null,
      })
      .returning()
  )[0];
  res.json(serializeParcel(inserted, req.user!));
});

router.get("/parcels/:id", async (req, res) => {
  const rows = await db
    .select({ parcel: parcelsTable, sender: usersTable })
    .from(parcelsTable)
    .innerJoin(usersTable, eq(parcelsTable.senderId, usersTable.id))
    .where(eq(parcelsTable.id, req.params.id))
    .limit(1);
  if (rows.length === 0) return res.status(404).json({ error: "Not found" });
  res.json(serializeParcel(rows[0].parcel, rows[0].sender));
});

router.post("/parcels/:id/cancel", async (req, res) => {
  const p = (await db.select().from(parcelsTable).where(eq(parcelsTable.id, req.params.id)).limit(1))[0];
  if (!p) return res.status(404).json({ error: "Not found" });
  if (p.senderId !== req.user!.id) return res.status(403).json({ error: "Forbidden" });
  const updated = (
    await db.update(parcelsTable).set({ status: "CANCELLED" }).where(eq(parcelsTable.id, p.id)).returning()
  )[0];
  res.json(serializeParcel(updated, req.user!));
});

router.get("/parcels/:id/matching-trips", async (req, res) => {
  const p = (await db.select().from(parcelsTable).where(eq(parcelsTable.id, req.params.id)).limit(1))[0];
  if (!p) return res.status(404).json({ error: "Not found" });
  const ms = 2 * 24 * 60 * 60 * 1000;
  const lower = new Date(p.date.getTime() - ms);
  const upper = new Date(p.date.getTime() + ms);
  const rows = await db
    .select({ trip: tripsTable, traveller: usersTable })
    .from(tripsTable)
    .innerJoin(usersTable, eq(tripsTable.travellerId, usersTable.id))
    .where(
      and(
        eq(tripsTable.status, "ACTIVE"),
        ilike(tripsTable.fromCity, p.fromCity),
        ilike(tripsTable.toCity, p.toCity),
        gte(tripsTable.date, lower),
        lte(tripsTable.date, upper),
      ),
    )
    .orderBy(tripsTable.date);
  res.json(rows.map((r) => serializeTrip(r.trip, r.traveller)));
});

export default router;
