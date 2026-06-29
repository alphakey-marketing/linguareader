import { Router, type IRouter } from "express";
import healthRouter from "./health";
import lessonsRouter from "./lessons";
import vocabRouter from "./vocab";
import dictionaryRouter from "./dictionary";
import collectionsRouter from "./collections";
import srsRouter from "./srs";
import statsRouter from "./stats";
import importRouter from "./import";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(lessonsRouter);
router.use(vocabRouter);
router.use(dictionaryRouter);
router.use(collectionsRouter);
router.use(srsRouter);
router.use(statsRouter);
router.use(importRouter);
router.use(aiRouter);

export default router;
