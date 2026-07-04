/**
 * API + asset helpers. All requests go through the artifact base path so the
 * proxy routes them to the Express api-server (mounted at /api).
 */
const BASE = import.meta.env.BASE_URL; // always ends with "/"

export function apiUrl(path: string): string {
  return `${BASE}api${path}`;
}

/** Public asset URL (files under public/), respecting the base path. */
export function assetUrl(path: string): string {
  return `${BASE}${path.replace(/^\//, "")}`;
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    credentials: "same-origin",
    ...init,
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    const message =
      (body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : null) ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, message, body);
  }
  return body as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path);
}

export function apiSend<T>(
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  return request<T>(path, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export const apiPost = <T,>(path: string, body?: unknown) => apiSend<T>("POST", path, body);
export const apiPut = <T,>(path: string, body?: unknown) => apiSend<T>("PUT", path, body);
export const apiPatch = <T,>(path: string, body?: unknown) => apiSend<T>("PATCH", path, body);
export const apiDelete = <T,>(path: string, body?: unknown) => apiSend<T>("DELETE", path, body);

/** Multipart upload (media). */
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    credentials: "same-origin",
    body: formData,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : null) ?? `Upload failed (${res.status})`;
    throw new ApiError(res.status, message, body);
  }
  return body as T;
}
