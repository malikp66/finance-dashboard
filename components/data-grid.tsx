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
  const categoryName = searchParams.get("categoryName") || "all";
  const hasInvestment = data?.hasInvestmentCategory;

  let cardCount = 0;
  if (categoryName === "all") cardCount++; // Balance
  if (hasInvestment && categoryName === "all") cardCount++; // Total Investment
  if (categoryName !== "all") cardCount++; // Category Balance
  if (categoryName === "Pribadi") cardCount++; // Total Income
  if (categoryName !== "Investasi") cardCount++; // Total Expenses


  // Atur grid cols sesuai jumlah card
  // Responsive: 1 untuk mobile, 2 untuk md, ... cardCount untuk lg
  const gridCols = `grid-cols-1 md:grid-cols-2 lg:grid-cols-${cardCount}`;

  const dateRangeLabel = formatDateRange({ to, from });

  if (isLoading)
    return (
      <div className={`mb-8 grid ${gridCols} gap-8 pb-2`}>
        {[...Array(cardCount)].map((_, i) => (
          <DataCardLoading key={i} />
        ))}
      </div>
    );

  return (
    <div className={`mb-8 grid ${gridCols} gap-8 pb-2`}>
      {categoryName === "all" && (
        <DataCard
          title="Saldo"
          value={data?.remainingAmount}
          percentageChange={data?.remainingChange}
          icon={FaPiggyBank}
          variant="default"
          dateRange={dateRangeLabel}
        />
      )}
      {hasInvestment && categoryName === "all" && (
        <DataCard
          title="Total Investasi"
          value={data?.investmentAmount}
          percentageChange={data?.investmentChange}
          icon={FaCoins}
          variant="success"
          dateRange={dateRangeLabel}
        />
      )}
      {categoryName !== "all" && (
        <DataCard
          title="Saldo Kategori"
          value={data?.categoryBalance}
          icon={FaWallet}
          variant="warning"
          dateRange={dateRangeLabel}
        />
      )}
      {categoryName === "Pribadi" && (
        <DataCard
          title="Total Pemasukan"
          value={data?.incomeAmount}
          percentageChange={data?.incomeChange}
          icon={FaArrowTrendUp}
          variant="success"
          dateRange={dateRangeLabel}
        />
      )}
      {categoryName !== "Investasi" && (
        <DataCard
          title="Total Pengeluaran"
          value={data?.expensesAmount}
          percentageChange={data?.expensesChange}
          icon={FaArrowTrendDown}
          variant="danger"
          dateRange={dateRangeLabel}
        />
      )}
    </div>
  );
};
