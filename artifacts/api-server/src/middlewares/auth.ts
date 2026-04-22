import type { Request, Response, NextFunction, RequestHandler } from "express";
import { db, sessionsTable, usersTable, type UserRow } from "@workspace/db";
import { eq } from "drizzle-orm";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserRow;
    }
  }
}

export const requireAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing token" });
    return;
  }
  const token = auth.slice("Bearer ".length).trim();
  const rows = await db
    .select({ user: usersTable })
    .from(sessionsTable)
    .innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
    .where(eq(sessionsTable.token, token))
    .limit(1);
  if (rows.length === 0) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  req.user = rows[0].user;
  next();
};
