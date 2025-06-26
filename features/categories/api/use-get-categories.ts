"use client";

import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/hono";
import { useOrganization } from "@clerk/nextjs";

export const useGetCategories = () => {
  const { organization } = useOrganization();
  const orgId = organization?.id;

  const query = useQuery({
    queryKey: ["categories", orgId],
    queryFn: async () => {
      const response = await client.api.categories.$get();

      if (!response.ok) throw new Error("Gagal mengambil kategori.");

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
