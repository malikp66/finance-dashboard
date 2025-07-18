import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useOrganization } from "@clerk/nextjs";

import { client } from "@/lib/hono";
import { convertAmountFromMilliunits } from "@/lib/utils";

export const useGetSummary = () => {
  const { organization } = useOrganization();
  const orgId = organization?.id;
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const accountId = searchParams.get("accountId") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const companyMode = searchParams.get("companyMode") || "";

  const query = useQuery({
    queryKey: ["summary", orgId, { from, to, accountId, categoryId, companyMode }],
    queryFn: async () => {
      const response = await client.api.summary.$get({
        query: {
          from,
          to,
          accountId,
          categoryId,
          companyMode,
        },
      });

      if (!response.ok) throw new Error("Gagal mengambil ringkasan.");

      const { data } = await response.json();

      return {
        ...data,
        incomeAmount: convertAmountFromMilliunits(data.incomeAmount),
        expensesAmount: convertAmountFromMilliunits(data.expensesAmount),
        remainingAmount: convertAmountFromMilliunits(data.remainingAmount),
        investmentAmount: convertAmountFromMilliunits(
          data.investmentAmount ?? 0
        ),
        investmentChange: data.investmentChange,
        categoryBalance: convertAmountFromMilliunits(data.categoryBalance),
        hasInvestmentCategory: data.hasInvestmentCategory,
        hasInvestmentAccount: data.hasInvestmentAccount,
        salesAmount: convertAmountFromMilliunits(data.salesAmount ?? 0),
        salesChange: data.salesChange,
        hasSalesCategory: data.hasSalesCategory,
        accountRole: data.accountRole,
        categories: data.categories.map((category) => ({
          ...category,
          value: convertAmountFromMilliunits(category.value),
        })),
        days: data.days.map((day) => ({
          ...day,
          income: convertAmountFromMilliunits(day.income),
          expenses: convertAmountFromMilliunits(day.expenses),
        })),
      };
    },
  });

  return query;
};
