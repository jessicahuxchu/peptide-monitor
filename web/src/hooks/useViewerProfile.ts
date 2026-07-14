"use client";

import { useCallback, useEffect, useState } from "react";
import type { PlatformRole } from "@/lib/auth/roles";

export interface ViewerProfile {
  email: string | null;
  name: string | null;
  roles: PlatformRole[];
  isAdmin: boolean;
  active: boolean;
}

export function useViewerProfile() {
  const [profile, setProfile] = useState<ViewerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/me");
      if (!res.ok) {
        setProfile(null);
        return;
      }
      const data = (await res.json()) as ViewerProfile;
      setProfile(data);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { profile, loading, reload, isAdmin: Boolean(profile?.isAdmin) };
}
