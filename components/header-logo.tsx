"use client";

import Link from "next/link";
import { useOrganization } from "@clerk/nextjs";

export const HeaderLogo = () => {
  const { organization } = useOrganization();
  const orgName = organization?.name ?? "";

  return (
    <Link href="/">
      <div className="hidden items-center lg:flex">
        <p className="ml-2.5 text-2xl capitalize font-semibold text-white">{orgName} Finance</p>
      </div>
    </Link>
  );
};
