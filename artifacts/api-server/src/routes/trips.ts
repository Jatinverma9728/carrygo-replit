import { Router, type IRouter } from "express";
import { db, tripsTable, usersTable } from "@workspace/db";
import { and, desc, eq, ilike } from "drizzle-orm";
import { zodSchemas } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { makeId } from "../lib/ids";
import { serializeTrip } from "../lib/serialize";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/trips", async (req, res) => {
  const fromCity = typeof req.query.fromCity === "string" ? req.query.fromCity : undefined;
  const toCity = typeof req.query.toCity === "string" ? req.query.toCity : undefined;
  const mine = req.query.mine === "true";

  const conditions = [eq(tripsTable.status, "ACTIVE")];
  if (fromCity) conditions.push(ilike(tripsTable.fromCity, fromCity));
  if (toCity) conditions.push(ilike(tripsTable.toCity, toCity));
  if (mine) conditions.length = 0, conditions.push(eq(tripsTable.travellerId, req.user!.id));

  const rows = await db
    .select({ trip: tripsTable, traveller: usersTable })
    .from(tripsTable)
    .innerJoin(usersTable, eq(tripsTable.travellerId, usersTable.id))
    .where(and(...conditions))
    .orderBy(desc(tripsTable.createdAt))
    .limit(200);

  res.json(rows.map((r) => serializeTrip(r.trip, r.traveller)));
});

router.post("/trips", async (req, res) => {
  const body = zodSchemas.CreateTripBody.parse(req.body);
  const inserted = (
    await db
      .insert(tripsTable)
      .values({
        id: makeId("trip"),
        travellerId: req.user!.id,
        fromCity: body.fromCity,
        toCity: body.toCity,
        date: body.date,
        vehicle: body.vehicle,
        capacityKg: body.capacityKg,
        notes: body.notes ?? null,
      })
      .returning()
  )[0];
  res.json(serializeTrip(inserted, req.user!));
});

router.get("/trips/:id", async (req, res) => {
  const rows = await db
    .select({ trip: tripsTable, traveller: usersTable })
    .from(tripsTable)
    .innerJoin(usersTable, eq(tripsTable.travellerId, usersTable.id))
    .where(eq(tripsTable.id, req.params.id))
    .limit(1);
  if (rows.length === 0) return res.status(404).json({ error: "Not found" });
  res.json(serializeTrip(rows[0].trip, rows[0].traveller));
});

router.post("/trips/:id/cancel", async (req, res) => {
  const trip = (await db.select().from(tripsTable).where(eq(tripsTable.id, req.params.id)).limit(1))[0];
  if (!trip) return res.status(404).json({ error: "Not found" });
  if (trip.travellerId !== req.user!.id) return res.status(403).json({ error: "Forbidden" });
  const updated = (
    await db.update(tripsTable).set({ status: "CANCELLED" }).where(eq(tripsTable.id, trip.id)).returning()
  )[0];
  res.json(serializeTrip(updated, req.user!));
});

export default router;
