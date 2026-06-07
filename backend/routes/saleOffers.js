import express from "express";
import {
  getSaleOffers,
  getAllSaleOffers,
  getSaleOffer,
  createSaleOffer,
  deleteSaleOffer,
} from "../controllers/saleOfferController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getSaleOffers);
router.get("/all", protect, authorize("admin"), getAllSaleOffers);
router.get("/:id", getSaleOffer);
router.post("/", protect, authorize("admin"), createSaleOffer);
router.delete("/:id", protect, authorize("admin"), deleteSaleOffer);

export default router;
