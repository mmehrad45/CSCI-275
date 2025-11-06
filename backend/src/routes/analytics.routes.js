// backend/src/routes/analytics.routes.js
import { Router } from "express";
import { getSummary } from "../controllers/analytics.controller.js";

const router = Router();

// GET /analytics/summary   (auth is applied at mount in app.js)
router.get("/summary", getSummary);

export default router;
