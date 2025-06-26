"use client";

import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/hono";
import { useOrganization } from "@clerk/nextjs";

export const useGetAccounts = () => {
  const { organization } = useOrganization();
  const orgId = organization?.id;

  const query = useQuery({
    queryKey: ["accounts", orgId],
    queryFn: async () => {
      const response = await client.api.accounts.$get();

      if (!response.ok) throw new Error("Gagal mengambil akun.");

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
