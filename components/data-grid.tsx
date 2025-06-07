"use client";

import { useSearchParams } from "next/navigation";
import { FaPiggyBank } from "react-icons/fa";
import { FaArrowTrendUp, FaArrowTrendDown } from "react-icons/fa6";

import { useGetSummary } from "@/features/summary/api/use-get-summary";
import { formatDateRange } from "@/lib/utils";

import { DataCard, DataCardLoading } from "./data-card";
import { CategoryFilter } from "./category-filter";

export const DataGrid = () => {
  const { data, isLoading } = useGetSummary();
  const searchParams = useSearchParams();
  const to = searchParams.get("to") || undefined;
  const from = searchParams.get("from") || undefined;

  const dateRangeLabel = formatDateRange({ to, from });

  if (isLoading)
    return (
      <div className="mb-8 grid grid-cols-1 gap-8 pb-2 lg:grid-cols-3">
        <DataCardLoading />
        <DataCardLoading />
        <DataCardLoading />
      </div>
    );

  return (
    <div className="mb-8 grid grid-cols-1 gap-8 pb-2 lg:grid-cols-3">
      <DataCard
        title="Remaining"
        value={data?.remainingAmount}
        percentageChange={data?.remainingChange}
        icon={FaPiggyBank}
        variant="default"
        dateRange={dateRangeLabel}
      />

      <DataCard
        title="Income"
        value={data?.incomeAmount}
        percentageChange={data?.incomeChange}
        icon={FaArrowTrendUp}
        variant="success"
        dateRange={dateRangeLabel}
        action={
          <CategoryFilter className="h-7 rounded-md border-none bg-white/10 px-2 text-xs font-normal text-white outline-none transition hover:bg-white/30 hover:text-white focus:bg-white/30 focus:ring-transparent focus:ring-offset-0" />
        }
      />

      <DataCard
        title="Expenses"
        value={data?.expensesAmount}
        percentageChange={data?.expensesChange}
        icon={FaArrowTrendDown}
        variant="danger"
        dateRange={dateRangeLabel}
        action={
          <CategoryFilter className="h-7 rounded-md border-none bg-white/10 px-2 text-xs font-normal text-white outline-none transition hover:bg-white/30 hover:text-white focus:bg-white/30 focus:ring-transparent focus:ring-offset-0" />
        }
      />
    </div>
  );
};
