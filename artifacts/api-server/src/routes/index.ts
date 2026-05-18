import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import roadmapRouter from "./roadmap";
import waitlistRouter from "./waitlist";
import featuresRouter from "./features";
import ryzerRouter from "./ryzer";
import challengesRouter from "./challenges";
import calisthenicsUserRouter from "./calisthenics-user";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(roadmapRouter);
router.use(waitlistRouter);
router.use(featuresRouter);
router.use(ryzerRouter);
router.use(challengesRouter);
router.use(calisthenicsUserRouter);

export default router;
