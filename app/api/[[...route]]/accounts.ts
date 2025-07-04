import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";
import { and, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "@/db/drizzle";
import { accounts, insertAccountSchema } from "@/db/schema";

const app = new Hono()
  .get("/", clerkMiddleware(), async (ctx) => {
    const auth = getAuth(ctx);
    const orgId = auth?.orgId;

    if (!auth?.userId) {
      return ctx.json({ error: "Unauthorized." }, 401);
    }

    const data = await db
      .select({
        id: accounts.id,
        name: accounts.name,
        role: accounts.role,
      })
      .from(accounts)
      .where(orgId ? eq(accounts.orgId, orgId) : eq(accounts.userId, auth.userId));

    return ctx.json({ data });
  })
  .get(
    "/:id",
    zValidator(
      "param",
      z.object({
        id: z.string().optional(),
      })
    ),
    clerkMiddleware(),
    async (ctx) => {
      const auth = getAuth(ctx);
      const { id } = ctx.req.valid("param");
      const orgId = auth?.orgId;

      if (!id) {
        return ctx.json({ error: "Missing id." }, 400);
      }

      if (!auth?.userId) {
        return ctx.json({ error: "Unauthorized." }, 401);
      }

      const [data] = await db
        .select({
          id: accounts.id,
          name: accounts.name,
          role: accounts.role,
        })
        .from(accounts)
        .where(
          and(
            eq(accounts.id, id),
            orgId ? eq(accounts.orgId, orgId) : eq(accounts.userId, auth.userId)
          )
        );

      if (!data) {
        return ctx.json({ error: "Not found." }, 404);
      }

      return ctx.json({ data });
    }
  )
  .post(
    "/",
    clerkMiddleware(),
    zValidator(
      "json",
      insertAccountSchema.pick({
        name: true,
        role: true,
      })
    ),
    async (ctx) => {
      const auth = getAuth(ctx);
      const orgId = auth?.orgId;
      const values = ctx.req.valid("json");
      const userRole =
        (auth?.sessionClaims as any)?.public_metadata?.role ??
        (auth?.sessionClaims as any)?.publicMetadata?.role;

      if (!auth?.userId) {
        return ctx.json({ error: "Unauthorized." }, 401);
      }

      const [data] = await db
        .insert(accounts)
        .values({
          id: createId(),
          userId: auth.userId,
          orgId,
          ...values,
        })
        .returning();

      return ctx.json({ data });
    }
  )
  .post(
    "/bulk-delete",
    clerkMiddleware(),
    zValidator(
      "json",
      z.object({
        ids: z.array(z.string()),
      })
    ),
    async (ctx) => {
      const auth = getAuth(ctx);
      const orgId = auth?.orgId;
      const values = ctx.req.valid("json");

      if (!auth?.userId) {
        return ctx.json({ error: "Unauthorized." }, 401);
      }

      const data = await db
        .delete(accounts)
        .where(
          and(
            orgId ? eq(accounts.orgId, orgId) : eq(accounts.userId, auth.userId),
            inArray(accounts.id, values.ids)
          )
        )
        .returning({
          id: accounts.id,
        });

      return ctx.json({ data });
    }
  )
  .patch(
    "/:id",
    clerkMiddleware(),
    zValidator(
      "param",
      z.object({
        id: z.string().optional(),
      })
    ),
    zValidator(
      "json",
      insertAccountSchema.pick({
        name: true,
        role: true,
      })
    ),
    async (ctx) => {
      const auth = getAuth(ctx);
      const { id } = ctx.req.valid("param");
      const orgId = auth?.orgId;
      const values = ctx.req.valid("json");

      if (!id) {
        return ctx.json({ error: "Missing id." }, 400);
      }

      if (!auth?.userId) {
        return ctx.json({ error: "Unauthorized." }, 401);
      }

      const [data] = await db
        .update(accounts)
        .set(values)
        .where(
          and(
            orgId ? eq(accounts.orgId, orgId) : eq(accounts.userId, auth.userId),
            eq(accounts.id, id)
          )
        )
        .returning();

      if (!data) {
        return ctx.json({ error: "Not found." }, 404);
      }

      return ctx.json({ data });
    }
  )
  .delete(
    "/:id",
    clerkMiddleware(),
    zValidator(
      "param",
      z.object({
        id: z.string().optional(),
      })
    ),
    async (ctx) => {
      const auth = getAuth(ctx);
      const { id } = ctx.req.valid("param");
      const orgId = auth?.orgId;

      if (!id) {
        return ctx.json({ error: "Missing id." }, 400);
      }

      if (!auth?.userId) {
        return ctx.json({ error: "Unauthorized." }, 401);
      }

      const [data] = await db
        .delete(accounts)
        .where(
          and(
            orgId ? eq(accounts.orgId, orgId) : eq(accounts.userId, auth.userId),
            eq(accounts.id, id)
          )
        )
        .returning({
          id: accounts.id,
        });

      if (!data) {
        return ctx.json({ error: "Not found." }, 404);
      }

      return ctx.json({ data });
    }
  );

export default app;
