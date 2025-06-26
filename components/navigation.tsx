"use client";

import { Building2, Menu } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useMedia } from "react-use";
import { useOrganization, useOrganizationList } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Select } from "@/components/select";

import { NavButton } from "./nav-button";

const routes = [
  {
    href: "/",
    label: "Laporan",
  },
  {
    href: "/transactions",
    label: "Transaksi",
  },
  {
    href: "/accounts",
    label: "Akun",
  },
  {
    href: "/categories",
    label: "Kategori",
  },
];

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  const { organization } = useOrganization();
  const { userMemberships, setActive } = useOrganizationList();
  const organizations = userMemberships?.data ?? [];
  const orgOptions = organizations.map((m) => ({
    label: m.organization.name,
    value: m.organization.id,
  }));
  const showOrgSelect = orgOptions.length > 1;

  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useMedia("(max-width: 1024px)", false);

  const onClick = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="border-none bg-white/10 font-normal text-white outline-none transition hover:bg-white/20 hover:text-white focus:bg-white/30 focus-visible:ring-transparent focus-visible:ring-offset-0"
          >
            <Menu className="size-4" />
          </Button>
        </SheetTrigger>

        <SheetContent side="left" className="px-2">
          {showOrgSelect && (
            <div className="mb-4 flex items-center gap-x-2">
              <Building2 className="size-4 text-muted-foreground" />
              <Select
                placeholder="Pilih organisasi"
                options={orgOptions}
                value={organization?.id}
                onChange={(id) => id && setActive({ organization: id })}
              />
            </div>
          )}
          <nav className="flex flex-col gap-y-2 pt-2">
            {routes.map((route) => (
              <Button
                key={route.href}
                variant={route.href === pathname ? "secondary" : "ghost"}
                onClick={() => onClick(route.href)}
                className="w-full justify-start"
              >
                {route.label}
              </Button>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <nav className="hidden items-center gap-x-2 overflow-x-auto lg:flex">
      {showOrgSelect && (
        <div className="flex items-center gap-x-2">
          <Building2 className="size-4 text-white" />
          <Select
            placeholder="Pilih organisasi"
            options={orgOptions}
            value={organization?.id}
            onChange={(id) => id && setActive({ organization: id })}
          />
        </div>
      )}
      {routes.map((route) => (
        <NavButton
          key={route.href}
          label={route.label}
          href={route.href}
          isActive={route.href === pathname}
        />
      ))}
    </nav>
  );
};
