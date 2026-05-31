import express from "express";
import { body } from "express-validator";
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  deleteOwnAccount,
  updateProfile,
  changePassword,
  updateTwoFactor,
} from "../controllers/userController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Validation rules
const updateUserValidation = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage("First name must be between 2 and 30 characters"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage("Last name must be between 2 and 30 characters"),
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("role")
    .optional()
    .isIn(["user", "admin"])
    .withMessage("Role must be either user or admin"),
  body("avatar")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Avatar must be a valid string path"),
  body("phone")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Phone must be a valid string"),
  body("addressBook")
    .optional()
    .isArray()
    .withMessage("Address book must be an array"),
];

const updateProfileValidation = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage("First name must be between 2 and 30 characters"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage("Last name must be between 2 and 30 characters"),
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("avatar")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Avatar must be a valid string path"),
  body("phone")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Phone must be a valid string"),
  body("addressBook")
    .optional()
    .isArray()
    .withMessage("Address book must be an array"),
];

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long"),
];

const updateTwoFactorValidation = [
  body("enabled").isBoolean().withMessage("enabled must be a boolean value"),
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required to change two-factor settings"),
];

const deleteOwnAccountValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required to delete your account"),
];

// Routes
router.get("/", protect, authorize("admin"), getUsers);
router.put("/me/profile", protect, updateProfileValidation, updateProfile);
router.put("/profile", protect, updateProfileValidation, updateProfile);
router.put(
  "/changepassword",
  protect,
  changePasswordValidation,
  changePassword,
);
router.put("/two-factor", protect, updateTwoFactorValidation, updateTwoFactor);
router.delete("/me", protect, deleteOwnAccountValidation, deleteOwnAccount);
router.get("/:id([0-9a-fA-F]{24})", protect, authorize("admin"), getUser);
router.put(
  "/:id([0-9a-fA-F]{24})",
  protect,
  authorize("admin"),
  updateUserValidation,
  updateUser,
);
router.delete("/:id([0-9a-fA-F]{24})", protect, authorize("admin"), deleteUser);

export default router;
