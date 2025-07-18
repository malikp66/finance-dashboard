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
  const hasInvestmentCategory = data?.hasInvestmentCategory;
  const hasInvestmentAccount = data?.hasInvestmentAccount;
  const hasSalesCategory = data?.hasSalesCategory;
  const accountRole = data?.accountRole;

  let cardCount = 0;
  if (accountRole === "Sales") {
    cardCount = hasSalesCategory ? 1 : 0;
  } else {
    if (categoryName === "all") cardCount++; // Balance
    if (hasInvestmentCategory && categoryName === "all") cardCount++; // Total Investment
    if (hasSalesCategory && categoryName === "all" && accountRole !== "Investment") cardCount++; // Total Sales
    if (categoryName !== "all") cardCount++; // Category Balance
    if (categoryName === "Pribadi") cardCount++; // Total Income
    if (categoryName !== "Investasi") cardCount++; // Total Expenses
  }


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
      {categoryName === "all" && accountRole !== "Sales" && (
        <DataCard
          title={hasInvestmentAccount ? "Sisa Saldo Investasi" : "Saldo"}
          value={data?.remainingAmount}
          percentageChange={data?.remainingChange}
          icon={FaPiggyBank}
          variant="default"
          dateRange={dateRangeLabel}
        />
      )}
      {hasInvestmentCategory && categoryName === "all" && accountRole !== "Sales" && (
        <DataCard
          title="Total Investasi"
          value={data?.investmentAmount}
          percentageChange={data?.investmentChange}
          icon={FaCoins}
          variant="success"
          dateRange={dateRangeLabel}
        />
      )}
      {hasSalesCategory && categoryName === "all" && accountRole !== "Investment" && (
        <DataCard
          title="Total Penjualan"
          value={data?.salesAmount}
          percentageChange={data?.salesChange}
          icon={FaArrowTrendUp}
          variant="success"
          dateRange={dateRangeLabel}
        />
      )}
      {categoryName !== "all" && accountRole !== "Sales" && (
        <DataCard
          title="Saldo Kategori"
          value={data?.categoryBalance}
          icon={FaWallet}
          variant="warning"
          dateRange={dateRangeLabel}
        />
      )}
      {categoryName === "Pribadi" && accountRole !== "Sales" && (
        <DataCard
          title="Total Pemasukan"
          value={data?.incomeAmount}
          percentageChange={data?.incomeChange}
          icon={FaArrowTrendUp}
          variant="success"
          dateRange={dateRangeLabel}
        />
      )}
      {categoryName !== "Investasi" && accountRole !== "Sales" && (
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
