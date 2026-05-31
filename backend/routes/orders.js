import express from "express";
import { body } from "express-validator";
import {
  createOrder,
  getOrderById,
  getMyOrders,
  getOrders,
  updateOrderToDelivered,
  updateOrderStatus,
  createPaymentIntent,
  confirmPayment,
} from "../controllers/orderController.js";
import { protect, authorize, optionalProtect } from "../middleware/auth.js";

const router = express.Router();

// Validation rules
const createOrderValidation = [
  body("orderItems")
    .isArray({ min: 1 })
    .withMessage("Order must have at least one item"),
  body("orderItems.*.product").isMongoId().withMessage("Invalid product ID"),
  body("orderItems.*.name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required"),
  body("orderItems.*.image")
    .trim()
    .notEmpty()
    .withMessage("Product image is required"),
  body("orderItems.*.price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("orderItems.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),
  body("shippingAddress.street")
    .trim()
    .notEmpty()
    .withMessage("Street address is required"),
  body("shippingAddress.firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required"),
  body("shippingAddress.lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required"),
  body("shippingAddress.email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required"),
  body("shippingAddress.phone")
    .trim()
    .notEmpty()
    .withMessage("Phone is required"),
  body("shippingAddress.city")
    .trim()
    .notEmpty()
    .withMessage("City is required"),
  body("shippingAddress.state")
    .trim()
    .notEmpty()
    .withMessage("State is required"),
  body("shippingAddress.zipCode")
    .trim()
    .notEmpty()
    .withMessage("Zip code is required"),
  body("shippingAddress.country")
    .trim()
    .notEmpty()
    .withMessage("Country is required"),
  body("paymentMethod")
    .isIn(["stripe", "paypal", "demo"])
    .withMessage("Invalid payment method"),
  body("taxPrice")
    .isFloat({ min: 0 })
    .withMessage("Tax price must be a positive number"),
  body("shippingPrice")
    .isFloat({ min: 0 })
    .withMessage("Shipping price must be a positive number"),
  body("totalPrice")
    .isFloat({ min: 0 })
    .withMessage("Total price must be a positive number"),
];

const updateStatusValidation = [
  body("status")
    .isIn([
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ])
    .withMessage("Invalid status"),
];

// Routes
router.post("/", optionalProtect, createOrderValidation, createOrder);
router.get("/myorders", protect, getMyOrders);
router.get("/:id", protect, getOrderById);
router.get("/", protect, authorize("admin"), getOrders);
router.put("/:id/deliver", protect, authorize("admin"), updateOrderToDelivered);
router.put(
  "/:id/status",
  protect,
  authorize("admin"),
  updateStatusValidation,
  updateOrderStatus,
);

// Payment routes
router.post("/create-payment-intent", protect, createPaymentIntent);
router.post("/confirm-payment", protect, confirmPayment);

export default router;
