import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";
import { parse } from "date-fns";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { Hono, type MiddlewareHandler } from "hono";
import { z } from "zod";

import { db } from "@/db/drizzle";
import {
  accounts,
  categories,
  insertTransactionSchema,
  transactions,
} from "@/db/schema";

const clerkMw = clerkMiddleware();

const publicTokenAuth: MiddlewareHandler = async (c, next) => {
  const token = c.req.header("x-api-token");
  if (token && token === process.env.API_PUBLIC_TOKEN) {
    c.set("isPublic", true);
    await next();
  } else {
    await clerkMw(c, next);
  }
};

const app = new Hono()
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
        accountId: z.string().optional(),
        categoryId: z.string().optional(),
      })
    ),
    publicTokenAuth,
    async (ctx) => {
      const auth = getAuth(ctx);
      const isPublic = ctx.get("isPublic" as never) as boolean | undefined;
      const { from, to, accountId, categoryId } = ctx.req.valid("query");
      const orgId = auth?.orgId;

      if (!isPublic && !auth?.userId) {
        return ctx.json({ error: "Unauthorized." }, 401);
      }

      const startDate = from
        ? parse(from, "yyyy-MM-dd", new Date())
        : undefined;
      const endDate = to ? parse(to, "yyyy-MM-dd", new Date()) : undefined;

      const userOrgCondition = isPublic
        ? undefined
        : orgId
        ? eq(accounts.orgId, orgId)
        : eq(accounts.userId, auth!.userId as string);

      const accountCondition = accountId
        ? eq(transactions.accountId, accountId)
        : userOrgCondition;

      const data = await db
        .select({
          id: transactions.id,
          date: transactions.date,
          category: categories.name,
          categoryId: transactions.categoryId,
          payee: transactions.payee,
          amount: transactions.amount,
          notes: transactions.notes,
          account: accounts.name,
          accountId: transactions.accountId,
        })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id))
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(
          and(
            accountCondition,
            categoryId ? eq(transactions.categoryId, categoryId) : undefined,
            userOrgCondition,
            startDate ? gte(transactions.date, startDate) : undefined,
            endDate ? lte(transactions.date, endDate) : undefined
          )
        )
        .orderBy(desc(transactions.date));

      return ctx.json({ data });
    }
  )
  .get(
    "/:id",
    zValidator(
      "param",
      z.object({
        id: z.string().optional(),
      })
    ),
    publicTokenAuth,
    async (ctx) => {
      const auth = getAuth(ctx);
      const isPublic = ctx.get("isPublic" as never) as boolean | undefined;
      const { id } = ctx.req.valid("param");
      const orgId = auth?.orgId;

      if (!id) {
        return ctx.json({ error: "Missing id." }, 400);
      }

      if (!isPublic && !auth?.userId) {
        return ctx.json({ error: "Unauthorized." }, 401);
      }

      const [data] = await db
        .select({
          id: transactions.id,
          date: transactions.date,
          categoryId: transactions.categoryId,
          payee: transactions.payee,
          amount: transactions.amount,
          notes: transactions.notes,
          accountId: transactions.accountId,
        })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id))
        .where(
          and(
            eq(transactions.id, id),
            isPublic
              ? undefined
              : orgId
              ? eq(accounts.orgId, orgId)
              : eq(accounts.userId, auth!.userId as string)
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
      insertTransactionSchema.omit({
        id: true,
      })
    ),
    async (ctx) => {
      const auth = getAuth(ctx);
      const values = ctx.req.valid("json");
      const orgId = auth?.orgId;

      if (!auth?.userId) {
        return ctx.json({ error: "Unauthorized." }, 401);
      }

      const [data] = await db
        .insert(transactions)
        .values({
          id: createId(),
          ...values,
        })
        .returning();

      return ctx.json({ data });
    }
  )
  .post(
    "/bulk-create",
    clerkMiddleware(),
    zValidator("json", z.array(insertTransactionSchema.omit({ id: true }))),
    async (ctx) => {
      const auth = getAuth(ctx);
      const values = ctx.req.valid("json");
      const orgId = auth?.orgId;

      if (!auth?.userId) {
        return ctx.json({ error: "Unauthorized." }, 401);
      }

      const data = await db
        .insert(transactions)
        .values(
          values.map((value) => ({
            id: createId(),
            ...value,
          }))
        )
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
      const values = ctx.req.valid("json");
      const orgId = auth?.orgId;

      if (!auth?.userId) {
        return ctx.json({ error: "Unauthorized." }, 401);
      }

      const userOrgCondition =
        orgId ? eq(accounts.orgId, orgId) : eq(accounts.userId, auth.userId);

      const transactionsToDelete = db.$with("transactions_to_delete").as(
        db
          .select({ id: transactions.id })
          .from(transactions)
          .innerJoin(accounts, eq(transactions.accountId, accounts.id))
          .where(
            and(
              inArray(transactions.id, values.ids),
              userOrgCondition
            )
          )
      );

      const data = await db
        .with(transactionsToDelete)
        .delete(transactions)
        .where(
          inArray(
            transactions.id,
            sql`(select id from ${transactionsToDelete})`
          )
        )
        .returning({
          id: transactions.id,
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
      insertTransactionSchema.omit({
        id: true,
      })
    ),
    async (ctx) => {
      const auth = getAuth(ctx);
      const { id } = ctx.req.valid("param");
      const values = ctx.req.valid("json");
      const orgId = auth?.orgId;

      if (!id) {
        return ctx.json({ error: "Missing id." }, 400);
      }

      if (!auth?.userId) {
        return ctx.json({ error: "Unauthorized." }, 401);
      }

      const userOrgCondition =
        orgId ? eq(accounts.orgId, orgId) : eq(accounts.userId, auth.userId);

      const transactionsToUpdate = db.$with("transactions_to_update").as(
        db
          .select({ id: transactions.id })
          .from(transactions)
          .innerJoin(accounts, eq(transactions.accountId, accounts.id))
          .where(and(eq(transactions.id, id), userOrgCondition))
      );

      const [data] = await db
        .with(transactionsToUpdate)
        .update(transactions)
        .set(values)
        .where(
          inArray(
            transactions.id,
            sql`(select id from ${transactionsToUpdate})`
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

      const userOrgCondition =
        orgId ? eq(accounts.orgId, orgId) : eq(accounts.userId, auth.userId);

      const transactionsToDelete = db.$with("transactions_to_delete").as(
        db
          .select({ id: transactions.id })
          .from(transactions)
          .innerJoin(accounts, eq(transactions.accountId, accounts.id))
          .where(and(eq(transactions.id, id), userOrgCondition))
      );

      const [data] = await db
        .with(transactionsToDelete)
        .delete(transactions)
        .where(
          inArray(
            transactions.id,
            sql`(select id from ${transactionsToDelete})`
          )
        )
        .returning({
          id: transactions.id,
        });

      if (!data) {
        return ctx.json({ error: "Not found." }, 404);
      }

      return ctx.json({ data });
    }
  );

export default app;
