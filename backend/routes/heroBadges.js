import express from "express";
import {
  getHeroBadges,
  updateHeroBadges,
  updateHeroGenderImages,
} from "../controllers/heroBadgeController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getHeroBadges);
router.put("/", protect, authorize("admin"), updateHeroBadges);
router.put(
  "/gender-images",
  protect,
  authorize("admin"),
  updateHeroGenderImages,
);

export default router;
