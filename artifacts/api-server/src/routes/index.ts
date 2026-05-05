import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import roadmapRouter from "./roadmap";
import waitlistRouter from "./waitlist";
import featuresRouter from "./features";
import sportsRouter from "./sports";
import multipliersRouter from "./multipliers";
import calcRouter from "./calc";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(roadmapRouter);
router.use(waitlistRouter);
router.use(featuresRouter);
router.use(sportsRouter);
router.use(multipliersRouter);
router.use(calcRouter);

export default router;
