"use client";

import { useEffect, useRef } from "react";
import { useOrganization } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";

export const OrganizationQueryListener = () => {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();

  // track previous organization id to detect changes
  const prevOrgIdRef = useRef<string | null>(null);

  useEffect(() => {
    const currentOrgId = organization?.id ?? null;
    if (prevOrgIdRef.current !== null && prevOrgIdRef.current !== currentOrgId) {
      // invalidate all queries so data is refetched for the new organization
      queryClient.invalidateQueries();
    }
    prevOrgIdRef.current = currentOrgId;
  }, [organization?.id, queryClient]);

  return null;
};
