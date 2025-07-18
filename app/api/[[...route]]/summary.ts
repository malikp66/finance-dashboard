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
    const { from, to, accountId, categoryId, companyMode } =
      ctx.req.valid("query");
    const isCompanyMode = companyMode === "true";
    const orgId = auth?.orgId;

    if (!auth?.userId) {
      return ctx.json({ error: "Unauthorized." }, 401);
    }

    const defaultTo = new Date();
    const defaultFrom = new Date(0);

    const startDate = from
      ? parse(from, "yyyy-MM-dd", new Date())
      : defaultFrom;
    const endDate = to ? parse(to, "yyyy-MM-dd", new Date()) : defaultTo;

    const userOrgCondition =
      orgId ? eq(accounts.orgId, orgId) : eq(accounts.userId, auth.userId);

    const accountCondition = accountId
      ? eq(transactions.accountId, accountId)
      : userOrgCondition;

    const selectedAccount = accountId
      ? await db
          .select({ role: accounts.role })
          .from(accounts)
          .where(eq(accounts.id, accountId))
          .limit(1)
      : [];
    const selectedAccountRole = selectedAccount[0]?.role ?? null;

    const periodLength = differenceInDays(endDate, startDate) + 1;
    const lastPeriodStart = subDays(startDate, periodLength);
    const lastPeriodEnd = subDays(endDate, periodLength);

    const investmentAccount = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(
        and(
          orgId ? eq(accounts.orgId, orgId) : eq(accounts.userId, auth.userId),
          eq(accounts.role, "Investment")
        )
      )
      .limit(1);
    const investmentAccountId = investmentAccount[0]?.id;

    const salesAccount = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(
        and(
          orgId ? eq(accounts.orgId, orgId) : eq(accounts.userId, auth.userId),
          eq(accounts.role, "Sales")
        )
      )
      .limit(1);
    const salesAccountId = salesAccount[0]?.id;

    const investmentCategory = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          orgId ? eq(categories.orgId, orgId) : eq(categories.userId, auth.userId),
          eq(categories.name, "Investasi")
        )
      )
      .limit(1);
    const investmentCategoryId = investmentCategory[0]?.id;

    const salesCategory = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          orgId ? eq(categories.orgId, orgId) : eq(categories.userId, auth.userId),
          eq(categories.name, "Penjualan")
        )
      )
      .limit(1);
    const salesCategoryId = salesCategory[0]?.id;

    async function fetchFinancialData(
      startDate: Date,
      endDate: Date
    ) {
      const categoryCondition =
        isCompanyMode && !categoryId
          ? investmentAccountId
            ? eq(transactions.accountId, investmentAccountId)
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
            accountCondition,
            categoryCondition,
            userOrgCondition,
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
          )
        );
    }

    async function fetchInvestmentAmount(
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
            eq(transactions.categoryId, investmentCategoryId),
            userOrgCondition,
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
          )
        );
    }

    async function fetchSalesAmount(startDate: Date, endDate: Date) {
      if (!salesCategoryId) return [{ sales: 0 }];

      return await db
        .select({
          sales:
            sql`SUM(CASE WHEN ${transactions.amount} >= 0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(
              Number
            ),
        })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id))
        .where(
          and(
            eq(transactions.categoryId, salesCategoryId),
            userOrgCondition,
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
          )
        );
    }

    const [currentPeriod] = await fetchFinancialData(
      startDate,
      endDate
    );
    const [lastPeriod] = await fetchFinancialData(
      lastPeriodStart,
      lastPeriodEnd
    );

    const [currentInvestment] = await fetchInvestmentAmount(
      startDate,
      endDate
    );
    const [lastInvestment] = await fetchInvestmentAmount(
      lastPeriodStart,
      lastPeriodEnd
    );

    const [currentSales] = await fetchSalesAmount(startDate, endDate);
    const [lastSales] = await fetchSalesAmount(lastPeriodStart, lastPeriodEnd);

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

    const salesChange = calculatePercentageChange(
      currentSales.sales,
      lastSales.sales
    );

    const currentRemaining = investmentAccountId
      ? currentInvestment.investment - currentPeriod.expenses
      : currentPeriod.remaining;
    const lastRemaining = investmentAccountId
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
          accountCondition,
          categoryId ? eq(transactions.categoryId, categoryId) : undefined,
          userOrgCondition,
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
          accountCondition,
          isCompanyMode && !categoryId
            ? investmentAccountId
              ? eq(transactions.accountId, investmentAccountId)
              : undefined
            : categoryId
              ? eq(transactions.categoryId, categoryId)
              : undefined,
          userOrgCondition,
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
        hasInvestmentAccount: Boolean(investmentAccountId),
        salesAmount: currentSales.sales,
        salesChange,
        hasSalesCategory: Boolean(salesCategoryId),
        accountRole: selectedAccountRole,
      },
    });
  }
);

export default app;
