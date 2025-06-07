"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import qs from "query-string";

import { Switch } from "@/components/ui/switch";

export const CompanyModeSwitch = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const companyMode = searchParams.get("companyMode") === "true";

  const onChange = (checked: boolean) => {
    const query = {
      accountId: searchParams.get("accountId") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined,
      companyMode: checked ? "true" : undefined,
    } as Record<string, string | undefined>;

    const url = qs.stringifyUrl(
      { url: pathname, query },
      { skipNull: true, skipEmptyString: true }
    );

    router.push(url);
  };

  return (
    <label htmlFor="company-mode" className="flex items-center gap-x-1 text-white">
      <Switch id="company-mode" checked={companyMode} onCheckedChange={onChange} />
      <span className="text-sm">Company Mode</span>
    </label>
  );
};
