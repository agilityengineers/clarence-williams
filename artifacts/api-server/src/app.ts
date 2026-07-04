import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// Same-origin API (served behind the workspace proxy). Only allow known
// first-party origins instead of reflecting arbitrary ones.
const allowedOrigins = new Set(
  [
    process.env.REPLIT_DEV_DOMAIN && `https://${process.env.REPLIT_DEV_DOMAIN}`,
    ...(process.env.REPLIT_DOMAINS ?? "")
      .split(",")
      .filter(Boolean)
      .map((d) => `https://${d.trim()}`),
  ].filter((v): v is string => Boolean(v)),
);
app.use(
  cors({
    origin(origin, callback) {
      // Non-browser or same-origin requests have no Origin header.
      if (!origin || allowedOrigins.has(origin)) callback(null, true);
      else callback(null, false);
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
