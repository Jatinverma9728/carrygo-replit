import { db, notificationsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { makeId } from "./ids";
import { logger } from "./logger";

type NotifyArgs = {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

export async function notify(args: NotifyArgs) {
  await db.insert(notificationsTable).values({
    id: makeId("ntf"),
    userId: args.userId,
    type: args.type,
    title: args.title,
    body: args.body,
    data: args.data ? JSON.stringify(args.data) : null,
  });

  // Best-effort Expo push delivery if a token is registered.
  try {
    const rows = await db
      .select({ pushToken: usersTable.pushToken })
      .from(usersTable)
      .where(eq(usersTable.id, args.userId))
      .limit(1);
    const token = rows[0]?.pushToken;
    if (!token || !token.startsWith("ExponentPushToken")) return;
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        to: token,
        title: args.title,
        body: args.body,
        data: args.data ?? {},
        sound: "default",
      }),
    }).catch(() => {});
  } catch (e) {
    logger.warn({ e }, "Push notification failed");
  }
}
