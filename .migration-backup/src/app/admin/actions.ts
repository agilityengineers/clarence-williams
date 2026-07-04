"use server";

import { redirect } from "next/navigation";
import {
  createAdminUser,
  createSession,
  destroySession,
  hasAdminUser,
  verifyCredentials,
} from "@/lib/auth";

/** Error state carries the submitted email so the form can repopulate it (React resets fields after an action). */
export type AuthFormState = { error: string; email: string } | null;

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required.", email };
  const ok = await verifyCredentials(email, password);
  if (!ok) return { error: "Invalid email or password.", email };
  await createSession(email.trim().toLowerCase());
  redirect("/admin");
}

export async function setupAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (await hasAdminUser()) return { error: "The admin account already exists.", email };
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address.", email };
  }
  if (password.length < 10) {
    return { error: "Password must be at least 10 characters.", email };
  }
  if (password !== confirm) return { error: "Passwords do not match.", email };
  await createAdminUser(email, password);
  await createSession(email.toLowerCase());
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}
