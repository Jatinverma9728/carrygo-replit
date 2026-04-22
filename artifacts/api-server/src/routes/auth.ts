import { Router, type IRouter } from "express";
import { db, usersTable, otpCodesTable, sessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { zodSchemas } from "@workspace/api-zod";
import { makeId, makeToken, avatarColor, makeOtp } from "../lib/ids";
import { requireAuth } from "../middlewares/auth";
import { serializeUser } from "../lib/serialize";

const router: IRouter = Router();

router.post("/auth/otp/request", async (req, res) => {
  const { phone } = zodSchemas.RequestOtpBody.parse(req.body);
  // Demo mode: always 1234. We still record it.
  const code = process.env.NODE_ENV === "production" ? makeOtp() : "1234";
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await db
    .insert(otpCodesTable)
    .values({ phone, code, expiresAt })
    .onConflictDoUpdate({ target: otpCodesTable.phone, set: { code, expiresAt } });
  res.json({ sent: true, demoCode: "1234" });
});

router.post("/auth/otp/verify", async (req, res) => {
  const { phone, code, name } = zodSchemas.VerifyOtpBody.parse(req.body);
  if (code !== "1234") {
    res.status(400).json({ error: "Invalid OTP. Use 1234 in demo mode." });
    return;
  }
  let user = (await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1))[0];
  if (!user) {
    const trimmed = name.trim() || "Guest";
    const inserted = await db
      .insert(usersTable)
      .values({
        id: makeId("user"),
        phone,
        name: trimmed,
        avatarColor: avatarColor(trimmed + phone),
      })
      .returning();
    user = inserted[0];
  }
  const token = makeToken();
  await db.insert(sessionsTable).values({ token, userId: user.id });
  res.json({ token, user: serializeUser(user) });
});

router.get("/auth/me", requireAuth, async (req, res) => {
  res.json(serializeUser(req.user!));
});

router.patch("/auth/me", requireAuth, async (req, res) => {
  const body = zodSchemas.UpdateMeBody.parse(req.body);
  const patch: Record<string, unknown> = {};
  if (body.name) patch.name = body.name;
  if (body.avatarColor) patch.avatarColor = body.avatarColor;
  if (Object.keys(patch).length > 0) {
    await db.update(usersTable).set(patch).where(eq(usersTable.id, req.user!.id));
  }
  const fresh = (await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1))[0];
  res.json(serializeUser(fresh));
});

router.post("/auth/signout", requireAuth, async (req, res) => {
  const auth = req.headers.authorization!;
  const token = auth.slice("Bearer ".length).trim();
  await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
  res.json({ ok: true });
});

router.post("/auth/push-token", requireAuth, async (req, res) => {
  const { token } = zodSchemas.RegisterPushTokenBody.parse(req.body);
  await db.update(usersTable).set({ pushToken: token }).where(eq(usersTable.id, req.user!.id));
  res.json({ ok: true });
});

export default router;
