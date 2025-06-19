import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const app = new Hono()
  .get("/", clerkMiddleware(), async (ctx) => {
    const auth = getAuth(ctx);

    if (!auth?.userId) {
      return ctx.json({ error: "Unauthorized." }, 401);
    }

    const clerkClient = ctx.get("clerk");
    const user = await clerkClient.users.getUser(auth.userId);

    return ctx.json({ data: { role: user.publicMetadata?.role } });
  })
  .patch(
    "/",
    clerkMiddleware(),
    zValidator(
      "json",
      z.object({
        role: z.string(),
      })
    ),
    async (ctx) => {
      const auth = getAuth(ctx);
      const { role } = ctx.req.valid("json");

      if (!auth?.userId) {
        return ctx.json({ error: "Unauthorized." }, 401);
      }

      const clerkClient = ctx.get("clerk");
      await clerkClient.users.updateUser(auth.userId, {
        publicMetadata: { role },
      });

      return ctx.json({ data: { role } });
    }
  );

export default app;
