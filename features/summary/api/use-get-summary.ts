import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import { client } from "@/lib/hono";
import { convertAmountFromMilliunits } from "@/lib/utils";

export const useGetSummary = () => {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const accountId = searchParams.get("accountId") || "";
  const categoryId = searchParams.get("categoryId") || "";

  const query = useQuery({
    queryKey: ["summary", { from, to, accountId, categoryId }],
    queryFn: async () => {
      const response = await client.api.summary.$get({
        query: {
          from,
          to,
          accountId,
          categoryId,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch summary.");

      const { data } = await response.json();

      return {
        ...data,
        incomeAmount: convertAmountFromMilliunits(data.incomeAmount),
        expensesAmount: convertAmountFromMilliunits(data.expensesAmount),
        remainingAmount: convertAmountFromMilliunits(data.remainingAmount),
        categoryBalance: convertAmountFromMilliunits(data.categoryBalance),
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
