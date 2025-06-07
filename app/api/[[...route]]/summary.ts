import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { differenceInDays, parse, subDays } from "date-fns";
import { and, desc, eq, gte, lt, lte, sql, sum } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "@/db/drizzle";
import { accounts, categories, transactions } from "@/db/schema";
import { calculatePercentageChange, fillMissingDays } from "@/lib/utils";

const app = new Hono().get(
  "/",
  clerkMiddleware(),
  zValidator(
    "query",
    z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      accountId: z.string().optional(),
      categoryId: z.string().optional(),
      companyMode: z.string().optional(),
    })
  ),
  async (ctx) => {
    const auth = getAuth(ctx);
    const { from, to, accountId, categoryId, companyMode } = ctx.req.valid("query");
    const isCompanyMode = companyMode === "true";

    if (!auth?.userId) {
      return ctx.json({ error: "Unauthorized." }, 401);
    }

    const defaultTo = new Date();
    const defaultFrom = subDays(defaultTo, 30);

    const startDate = from
      ? parse(from, "yyyy-MM-dd", new Date())
      : defaultFrom;
    const endDate = to ? parse(to, "yyyy-MM-dd", new Date()) : defaultTo;

    const periodLength = differenceInDays(endDate, startDate) + 1;
    const lastPeriodStart = subDays(startDate, periodLength);
    const lastPeriodEnd = subDays(endDate, periodLength);

    const investmentCategory = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(eq(categories.userId, auth.userId), eq(categories.name, "Investasi"))
      )
      .limit(1);
    const investmentCategoryId = investmentCategory[0]?.id;

    async function fetchFinancialData(
      userId: string,
      startDate: Date,
      endDate: Date
    ) {
      const categoryCondition = isCompanyMode && !categoryId
        ? investmentCategoryId
          ? eq(transactions.categoryId, investmentCategoryId)
          : undefined
        : categoryId
        ? eq(transactions.categoryId, categoryId)
        : undefined;

      return await db
        .select({
          income:
            sql`SUM(CASE WHEN ${transactions.amount} >= 0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(
              Number
            ),
          expenses:
            sql`SUM(CASE WHEN ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END)`.mapWith(
              Number
            ),
          remaining: sum(transactions.amount).mapWith(Number),
          categoryBalance: sql`SUM(${transactions.amount})`.mapWith(Number),
        })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id))
        .where(
          and(
            accountId ? eq(transactions.accountId, accountId) : undefined,
            categoryCondition,
            eq(accounts.userId, userId),
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
          )
        );
    }

    async function fetchInvestmentAmount(
      userId: string,
      startDate: Date,
      endDate: Date
    ) {
      if (!investmentCategoryId) return [{ investment: 0 }];

      return await db
        .select({
          investment:
            sql`SUM(CASE WHEN ${transactions.amount} >= 0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(
              Number
            ),
        })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id))
        .where(
          and(
            accountId ? eq(transactions.accountId, accountId) : undefined,
            eq(transactions.categoryId, investmentCategoryId),
            eq(accounts.userId, userId),
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
          )
        );
    }

    const [currentPeriod] = await fetchFinancialData(
      auth.userId,
      startDate,
      endDate
    );
    const [lastPeriod] = await fetchFinancialData(
      auth.userId,
      lastPeriodStart,
      lastPeriodEnd
    );

    const [currentInvestment] = await fetchInvestmentAmount(
      auth.userId,
      startDate,
      endDate
    );
    const [lastInvestment] = await fetchInvestmentAmount(
      auth.userId,
      lastPeriodStart,
      lastPeriodEnd
    );

    const incomeChange = calculatePercentageChange(
      currentPeriod.income,
      lastPeriod.income
    );

    const expensesChange = calculatePercentageChange(
      currentPeriod.expenses,
      lastPeriod.expenses
    );

    const investmentChange = calculatePercentageChange(
      currentInvestment.investment,
      lastInvestment.investment
    );

    const currentRemaining = investmentCategoryId
      ? currentInvestment.investment - currentPeriod.expenses
      : currentPeriod.remaining;
    const lastRemaining = investmentCategoryId
      ? lastInvestment.investment - lastPeriod.expenses
      : lastPeriod.remaining;

    const remainingChange = calculatePercentageChange(
      currentRemaining,
      lastRemaining
    );

    const category = await db
      .select({
        name: categories.name,
        value: sql`SUM(ABS(${transactions.amount}))`.mapWith(Number),
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          accountId ? eq(transactions.accountId, accountId) : undefined,
          categoryId ? eq(transactions.categoryId, categoryId) : undefined,
          eq(accounts.userId, auth.userId),
          lt(transactions.amount, 0),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      )
      .groupBy(categories.name)
      .orderBy(desc(sql`SUM(ABS(${transactions.amount}))`));

    const topCategories = category.slice(0, 3);
    const otherCategories = category.slice(3);
    const otherSum = otherCategories.reduce(
      (sum, current) => sum + current.value,
      0
    );

    const finalCategories = topCategories;

    if (otherCategories.length > 0)
      finalCategories.push({ name: "Other", value: otherSum });

    const activeDays = await db
      .select({
        date: transactions.date,
        income:
          sql`SUM(CASE WHEN ${transactions.amount} >= 0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(
            Number
          ),
        expenses:
          sql`SUM(CASE WHEN ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END)`.mapWith(
            Number
          ),
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(
        and(
          accountId ? eq(transactions.accountId, accountId) : undefined,
          isCompanyMode && !categoryId
            ? investmentCategoryId
              ? eq(transactions.categoryId, investmentCategoryId)
              : undefined
            : categoryId
            ? eq(transactions.categoryId, categoryId)
            : undefined,
          eq(accounts.userId, auth.userId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      )
      .groupBy(transactions.date)
      .orderBy(transactions.date);

    const days = fillMissingDays(activeDays, startDate, endDate);

    return ctx.json({
      data: {
        remainingAmount: currentRemaining,
        categoryBalance: currentPeriod.categoryBalance,
        remainingChange,
        incomeAmount: currentPeriod.income,
        incomeChange,
        investmentAmount: currentInvestment.investment,
        investmentChange,
        expensesAmount: currentPeriod.expenses,
        expensesChange,
        categories: finalCategories,
        days,
        hasInvestmentCategory: Boolean(investmentCategoryId),
      },
    });
  }
);

export default app;
