import { Router, type IRouter } from "express";
import {
  createAdminUser,
  createSession,
  destroySession,
  getSession,
  hasAdminUser,
  verifyCredentials,
} from "../lib/cw/auth";

const router: IRouter = Router();

router.get("/auth/session", async (req, res): Promise<void> => {
  const [session, hasAdmin] = await Promise.all([getSession(req), hasAdminUser()]);
  res.json({ session, hasAdmin });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const email = String(req.body?.email ?? "");
  const password = String(req.body?.password ?? "");
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required.", email });
    return;
  }
  const ok = await verifyCredentials(email, password);
  if (!ok) {
    res.status(401).json({ error: "Invalid email or password.", email });
    return;
  }
  await createSession(res, email.trim().toLowerCase());
  res.json({ ok: true });
});

router.post("/auth/setup", async (req, res): Promise<void> => {
  const email = String(req.body?.email ?? "").trim();
  if (await hasAdminUser()) {
    res.status(409).json({ error: "The admin account already exists.", email });
    return;
  }
  const password = String(req.body?.password ?? "");
  const confirm = String(req.body?.confirm ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Enter a valid email address.", email });
    return;
  }
  if (password.length < 10) {
    res.status(400).json({ error: "Password must be at least 10 characters.", email });
    return;
  }
  if (password !== confirm) {
    res.status(400).json({ error: "Passwords do not match.", email });
    return;
  }
  try {
    await createAdminUser(email, password);
  } catch {
    // Lost the race against a concurrent setup request.
    res.status(409).json({ error: "The admin account already exists.", email });
    return;
  }
  await createSession(res, email.toLowerCase());
  res.json({ ok: true });
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  destroySession(res);
  res.json({ ok: true });
});

export default router;
