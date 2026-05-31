import express from "express";
import {
  getHeroSlides,
  getAllHeroSlides,
  createHeroSlide,
  deleteHeroSlide,
} from "../controllers/heroSlideController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getHeroSlides);
router.get("/all", protect, authorize("admin"), getAllHeroSlides);
router.post("/", protect, authorize("admin"), createHeroSlide);
router.delete("/:id", protect, authorize("admin"), deleteHeroSlide);

export default router;
