import { Router, type IRouter } from "express";
import {
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

router.post("/auth/logout", async (_req, res): Promise<void> => {
  destroySession(res);
  res.json({ ok: true });
});

export default router;
