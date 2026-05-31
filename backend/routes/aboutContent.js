import express from "express";
import {
  getAboutContent,
  updateAboutContent,
  clearAboutContent,
} from "../controllers/aboutContentController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getAboutContent);
router.put("/", protect, authorize("admin"), updateAboutContent);
router.delete("/", protect, authorize("admin"), clearAboutContent);

export default router;
