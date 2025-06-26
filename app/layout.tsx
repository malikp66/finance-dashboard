import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import type { PropsWithChildren } from "react";

import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config";
import { QueryProviders } from "@/providers/query-provider";
import { SheetProvider } from "@/providers/sheet-provider";
import { OrganizationQueryListener } from "@/providers/organization-query-listener";

import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#3d82f6",
};

export const metadata: Metadata = siteConfig;

const RootLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="font-sans">
          <QueryProviders>
            <OrganizationQueryListener />
            <SheetProvider />
            <Toaster richColors theme="light" />

            {children}
          </QueryProviders>
        </body>
      </html>
    </ClerkProvider>
  );
};

export default RootLayout;
