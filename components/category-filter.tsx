"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import qs from "query-string";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetCategories } from "@/features/categories/api/use-get-categories";
import { useGetSummary } from "@/features/summary/api/use-get-summary";

type CategoryFilterProps = {
  className?: string;
};

export const CategoryFilter = ({ className }: CategoryFilterProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { isLoading: isLoadingSummary } = useGetSummary();

  const categoryId = searchParams.get("categoryId") || "all";
  const accountId = searchParams.get("accountId") || "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const onChange = (newValue: string) => {
    const query: Record<string, string> = {
      accountId,
      from,
      to,
      categoryId: newValue,
    };

    if (newValue === "all") delete query.categoryId;
    if (!accountId) delete query.accountId;
    if (!from) delete query.from;
    if (!to) delete query.to;

    const url = qs.stringifyUrl(
      {
        url: pathname,
        query,
      },
      { skipNull: true, skipEmptyString: true }
    );

    router.push(url);
  };

  const { data: categories, isLoading: isLoadingCategories } = useGetCategories();

  return (
    <Select
      value={categoryId}
      onValueChange={onChange}
      disabled={isLoadingCategories || isLoadingSummary}
    >
      <SelectTrigger
        className={
          className ||
          "h-9 w-full rounded-md border-none bg-white/10 px-3 font-normal text-white outline-none transition hover:bg-white/30 hover:text-white focus:bg-white/30 focus:ring-transparent focus:ring-offset-0 lg:w-auto"
        }
      >
        <SelectValue placeholder="Select category" />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="all">All categories</SelectItem>
        {categories?.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
