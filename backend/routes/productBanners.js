import express from "express";
import {
  getProductBanners,
  getAllProductBanners,
  createProductBanner,
  deleteProductBanner,
} from "../controllers/productBannerController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getProductBanners);
router.get("/all", protect, authorize("admin"), getAllProductBanners);
router.post("/", protect, authorize("admin"), createProductBanner);
router.delete("/:id", protect, authorize("admin"), deleteProductBanner);

export default router;
