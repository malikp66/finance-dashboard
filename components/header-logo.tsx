"use client";

import Link from "next/link";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";

export const HeaderLogo = () => {
  const { data } = useGetAccounts();
  const orgName = data?.[0]?.orgId ?? "MYZ Finance";

  return (
    <Link href="/">
      <div className="hidden items-center lg:flex">
        <p className="ml-2.5 text-2xl font-semibold text-white">{orgName}</p>
      </div>
    </Link>
  );
};
