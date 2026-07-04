import { useEffect } from "react";
import { useQuery, type QueryKey } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ApiError, apiGet } from "@/lib/api";

export type SessionData = {
  session: { email: string } | null;
  hasAdmin: boolean;
};

export function useSession() {
  return useQuery({
    queryKey: ["admin", "session"],
    queryFn: () => apiGet<SessionData>("/auth/session"),
  });
}

/** True when an error is an admin 401 (session expired / missing). */
export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

/**
 * useQuery wrapper that redirects to the admin login screen whenever the
 * request fails with a 401 (session expired). Replaces the middleware
 * redirect the Next app relied on.
 */
export function useAdminQuery<T>(key: QueryKey, fn: () => Promise<T>, enabled = true) {
  const [, navigate] = useLocation();
  const query = useQuery<T>({ queryKey: key, queryFn: fn, retry: false, enabled });
  useEffect(() => {
    if (isUnauthorized(query.error)) navigate("/login");
  }, [query.error, navigate]);
  return query;
}
