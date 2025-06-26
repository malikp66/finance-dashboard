import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import { client } from "@/lib/hono";
import { convertAmountFromMilliunits } from "@/lib/utils";

export const useGetTransactions = () => {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const accountId = searchParams.get("accountId") || "";
  const categoryId = searchParams.get("categoryId") || "";

  const query = useQuery({
    queryKey: ["transactions", { from, to, accountId, categoryId }],
    queryFn: async () => {
      const response = await client.api.transactions.$get({
        query: {
          from,
          to,
          accountId,
          categoryId,
        },
      });

      if (!response.ok) throw new Error("Gagal mengambil transaksi.");

      const { data } = await response.json();

      return data.map((transaction) => ({
        ...transaction,
        amount: convertAmountFromMilliunits(transaction.amount),
      }));
    },
  });

  return query;
};
