import express from "express";
import { generateAI, analyzeResume } from "../controllers/aiController.js";

const router = express.Router();

router.post("/generate", generateAI);
router.post("/analyze-resume", analyzeResume);

export default router;
