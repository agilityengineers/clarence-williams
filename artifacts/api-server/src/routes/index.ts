import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./cw-auth";
import publicRouter from "./cw-public";
import mediaRouter from "./cw-media";
import adminRouter from "./cw-admin";
import v1Router from "./cw-v1";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(publicRouter);
router.use(mediaRouter);
router.use(adminRouter);
router.use(v1Router);

export default router;
