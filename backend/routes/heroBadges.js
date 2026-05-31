import express from "express";
import { getHeroBadges, updateHeroBadges } from "../controllers/heroBadgeController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getHeroBadges);
router.put("/", protect, authorize("admin"), updateHeroBadges);

export default router;
