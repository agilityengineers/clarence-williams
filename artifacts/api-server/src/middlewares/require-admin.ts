import type { RequestHandler } from "express";
import { getSession } from "../lib/cw/auth";

export const requireAdmin: RequestHandler = async (req, res, next) => {
  const session = await getSession(req);
  if (!session) {
    res.status(401).json({ error: "Not authorized." });
    return;
  }
  next();
};
