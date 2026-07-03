/**
 * Next.js server-boot hook: apply migrations and seed initial content
 * before the first request. Keeps Replit deploys zero-command.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureBootstrapped } = await import("./db/bootstrap");
    await ensureBootstrapped();
  }
}
