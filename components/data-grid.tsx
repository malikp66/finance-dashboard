"use client";

import { useSearchParams } from "next/navigation";
import { FaPiggyBank, FaCoins } from "react-icons/fa";
import { FaArrowTrendUp, FaArrowTrendDown, FaWallet } from "react-icons/fa6";

import { useGetSummary } from "@/features/summary/api/use-get-summary";
import { formatDateRange } from "@/lib/utils";

import { DataCard, DataCardLoading } from "./data-card";

export const DataGrid = () => {
  const { data, isLoading } = useGetSummary();
  const searchParams = useSearchParams();
  const to = searchParams.get("to") || undefined;
  const from = searchParams.get("from") || undefined;
  const categoryId = searchParams.get("categoryId") || "all";

  const hasInvestment = data?.hasInvestmentCategory;
  const gridCols = categoryId !== "all"
    ? hasInvestment
      ? "lg:grid-cols-5"
      : "lg:grid-cols-4"
    : hasInvestment
    ? "lg:grid-cols-4"
    : "lg:grid-cols-3";

  const dateRangeLabel = formatDateRange({ to, from });

  if (isLoading)
    return (
      <div className={`mb-8 grid grid-cols-1 gap-8 pb-2 ${gridCols}`}>
        <DataCardLoading />
        {categoryId !== "all" && <DataCardLoading />}
        <DataCardLoading />
        <DataCardLoading />
      </div>
    );

  return (
    <div className={`mb-8 grid grid-cols-1 gap-8 pb-2 ${gridCols}`}>
      <DataCard
        title="Balance"
        value={data?.remainingAmount}
        percentageChange={data?.remainingChange}
        icon={FaPiggyBank}
        variant="default"
        dateRange={dateRangeLabel}
      />

      {hasInvestment && (
        <DataCard
          title="Total Investment"
          value={data?.investmentAmount}
          percentageChange={data?.investmentChange}
          icon={FaCoins}
          variant="success"
          dateRange={dateRangeLabel}
        />
      )}

      {categoryId !== "all" && (
        <DataCard
          title="Category Balance"
          value={data?.categoryBalance}
          icon={FaWallet}
          variant="warning"
          dateRange={dateRangeLabel}
        />
      )}

      <DataCard
        title="Total Income"
        value={data?.incomeAmount}
        percentageChange={data?.incomeChange}
        icon={FaArrowTrendUp}
        variant="success"
        dateRange={dateRangeLabel}
      />

      <DataCard
        title="Total Expenses"
        value={data?.expensesAmount}
        percentageChange={data?.expensesChange}
        icon={FaArrowTrendDown}
        variant="danger"
        dateRange={dateRangeLabel}
      />
    </div>
  );
};
