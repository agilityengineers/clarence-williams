import { Router, type IRouter } from "express";
import { rateLimit } from "express-rate-limit";
import {
  createSession,
  destroySession,
  getAdminUser,
  getSession,
  hasAdminUser,
  setAdminPassword,
  verifyCredentials,
} from "../lib/cw/auth";
import {
  TOKEN_TTL_MINUTES,
  createResetToken,
  consumeResetToken,
} from "../lib/cw/password-reset";
import { getNotificationSettings } from "../lib/cw/notifications";
import { sendEmail } from "../lib/cw/notify";
import { getBaseUrl } from "../lib/cw/base-url";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/** Minimum length enforced when setting a new password via the reset flow. */
const MIN_PASSWORD_LENGTH = 8;

/**
 * Throttle reset *requests* per IP so the endpoint can't be used to blast the
 * admin inbox or as an oracle. The limit is by IP, not email, so it never
 * reveals whether an address matches the admin account. In-memory store, same
 * caveats as the public lead limiter (per-instance on autoscale).
 */
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again in a few minutes." },
});

/** Modest throttle on reset completion. Tokens are 256-bit (brute force is
 * infeasible); this is just a backstop against automated abuse. */
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again in a few minutes." },
});

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

/**
 * Request a password reset. Responds identically whether or not the submitted
 * email matches the admin account, so the endpoint never reveals which address
 * is the admin. A reset link is only ever sent to the configured admin email —
 * the value the requester types is used solely to match, never as a recipient.
 */
router.post("/auth/forgot-password", forgotPasswordLimiter, async (req, res): Promise<void> => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  try {
    if (email) {
      const admin = await getAdminUser();
      if (admin && admin.email === email) {
        await sendPasswordResetEmail(admin.email);
      }
    }
  } catch (err) {
    // Swallow errors so timing/behaviour can't be used to probe for the admin.
    logger.error({ err }, "[auth] password reset request failed");
  }
  res.json({ ok: true });
});

/**
 * Complete a password reset: validate the single-use token, set the new
 * password hash (which revokes all existing sessions via the fingerprint
 * change), and clear this browser's cookie. Errors are deliberately generic.
 */
router.post("/auth/reset-password", resetPasswordLimiter, async (req, res): Promise<void> => {
  const token = String(req.body?.token ?? "");
  const password = String(req.body?.password ?? "");
  if (!token) {
    res.status(400).json({ error: "This reset link is invalid or has expired." });
    return;
  }
  // Validate the password BEFORE consuming the token, so a rejected password
  // doesn't burn the single-use link.
  if (password.length < MIN_PASSWORD_LENGTH) {
    res
      .status(400)
      .json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
    return;
  }
  const email = await consumeResetToken(token);
  if (!email) {
    res.status(400).json({ error: "This reset link is invalid or has expired." });
    return;
  }
  // The token's email must still match the current admin account.
  const admin = await getAdminUser();
  if (!admin || admin.email !== email) {
    res.status(400).json({ error: "This reset link is invalid or has expired." });
    return;
  }
  await setAdminPassword(email, password);
  destroySession(res);
  res.json({ ok: true });
});

/** Issue a token and email the reset link to the admin via SendGrid. */
async function sendPasswordResetEmail(adminEmail: string): Promise<void> {
  const { token } = await createResetToken(adminEmail);
  const link = `${getBaseUrl()}/admin/reset-password?token=${token}`;
  const settings = await getNotificationSettings();
  const subject = "Reset your Clarence Williams admin password";
  const html = [
    "<h2>Password reset requested</h2>",
    "<p>A password reset was requested for the Clarence Williams admin account.</p>",
    `<p><a href="${link}">Set a new password</a></p>`,
    `<p>Or paste this link into your browser:<br>${link}</p>`,
    `<p>This link expires in ${TOKEN_TTL_MINUTES} minutes and can be used once. If you didn't request this, you can ignore this email — your password will not change.</p>`,
  ].join("\n");
  const text = [
    "Password reset requested",
    "",
    "A password reset was requested for the Clarence Williams admin account.",
    "",
    `Set a new password: ${link}`,
    "",
    `This link expires in ${TOKEN_TTL_MINUTES} minutes and can be used once. If you didn't request this, you can ignore this email — your password will not change.`,
  ].join("\n");
  const result = await sendEmail({ to: adminEmail, from: settings.from, subject, html, text });
  if (!result.ok && !result.skipped) {
    logger.error({ error: result.error }, "[auth] password reset email not sent");
  }
}

export default router;
