import express from "express";
import { body } from "express-validator";
import {
  createBatch,
  getBatchesByProduct,
} from "../controllers/batchController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

const createBatchValidation = [
  body("productId").isMongoId().withMessage("Invalid product id"),
  body("batchNumber")
    .trim()
    .isLength({ min: 1, max: 64 })
    .withMessage("Batch number must be between 1 and 64 characters"),
  body("quantity")
    .isFloat({ min: 0.01 })
    .withMessage("Quantity must be greater than zero"),
  body("costPrice")
    .isFloat({ min: 0 })
    .withMessage("Cost price must be a non-negative number"),
  body("purchaseDate")
    .optional()
    .isISO8601()
    .withMessage("Purchase date must be a valid date"),
  body("expiryDate")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("Expiry date must be a valid date"),
];

router.get(
  "/product/:productId",
  protect,
  authorize("admin"),
  getBatchesByProduct,
);
router.post(
  "/",
  protect,
  authorize("admin"),
  createBatchValidation,
  createBatch,
);

export default router;
