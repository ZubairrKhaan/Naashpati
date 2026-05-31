import { validationResult } from "express-validator";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const normalizeAddressEntry = (entry = {}) => ({
  _id: entry?._id,
  label: String(entry?.label || "").trim(),
  street: String(entry?.street || "").trim(),
  city: String(entry?.city || "").trim(),
  state: String(entry?.state || "").trim(),
  zipCode: String(entry?.zipCode || "").trim(),
  country: String(entry?.country || "").trim(),
  isDefault: Boolean(entry?.isDefault),
});

const hasAddressContent = (entry = {}) =>
  Boolean(
    entry.street ||
    entry.city ||
    entry.state ||
    entry.zipCode ||
    entry.country ||
    entry.label,
  );

const syncAddressBook = (user, addressBook) => {
  if (!Array.isArray(addressBook)) {
    return;
  }

  const normalizedEntries = addressBook
    .map(normalizeAddressEntry)
    .filter(hasAddressContent);

  let hasDefault = normalizedEntries.some((entry) => entry.isDefault);
  user.addressBook = normalizedEntries.map((entry, index) => ({
    ...entry,
    isDefault: hasDefault ? entry.isDefault : index === 0,
  }));

  const defaultEntry = user.addressBook.find((entry) => entry.isDefault);
  if (defaultEntry) {
    user.shippingAddress = {
      street: defaultEntry.street,
      city: defaultEntry.city,
      state: defaultEntry.state,
      zipCode: defaultEntry.zipCode,
      country: defaultEntry.country,
    };
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .select("-password")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments();

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Get user's orders
    const Order = (await import("../models/Order.js")).default;
    const orders = await Order.find({ user: req.params.id })
      .populate("orderItems.product", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    // Calculate statistics
    const totalOrders = await Order.countDocuments({ user: req.params.id });
    const totalSpent = orders.reduce(
      (sum, order) => sum + (order.total || 0),
      0,
    );

    // Get user's reviews (if Product model has reviews)
    let reviews = [];
    try {
      const Product = (await import("../models/Product.js")).default;
      const productsWithReviews = await Product.find({
        "reviews.user": req.params.id,
      }).select("reviews");
      reviews = productsWithReviews.flatMap((product) =>
        product.reviews.filter(
          (review) => review.user.toString() === req.params.id,
        ),
      );
    } catch (error) {
      // Reviews might not be implemented yet, that's okay
      reviews = [];
    }

    const userData = {
      ...user.toObject(),
      orders: orders.map((order) => ({
        _id: order._id,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
        items: order.orderItems?.length || 0,
      })),
      totalSpent,
      reviews: reviews.length,
    };

    res.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: errors.array(),
    });
  }

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const {
      firstName,
      lastName,
      name,
      email,
      role,
      avatar,
      phone,
      shippingAddress,
      addressBook,
    } = req.body;

    if (typeof firstName === "string" && firstName.trim()) {
      user.firstName = firstName.trim();
    }
    if (typeof lastName === "string" && lastName.trim()) {
      user.lastName = lastName.trim();
    }
    if (typeof name === "string" && name.trim()) {
      const parts = name.trim().split(/\s+/);
      user.firstName = parts[0] || user.firstName;
      user.lastName = parts.slice(1).join(" ") || user.lastName;
    }
    user.email = email || user.email;
    user.role = role || user.role;
    user.phone = typeof phone === "string" ? phone.trim() : user.phone;
    if (typeof avatar === "string") {
      user.avatar = avatar;
    }
    if (shippingAddress) {
      user.shippingAddress = { ...user.shippingAddress, ...shippingAddress };
    }
    syncAddressBook(user, addressBook);

    await user.save();

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: "User removed",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: errors.array(),
    });
  }

  try {
    const user = await User.findById(req.user._id);

    const {
      firstName,
      lastName,
      name,
      email,
      avatar,
      phone,
      shippingAddress,
      addressBook,
    } = req.body;

    if (typeof firstName === "string" && firstName.trim()) {
      user.firstName = firstName.trim();
    }
    if (typeof lastName === "string" && lastName.trim()) {
      user.lastName = lastName.trim();
    }
    if (typeof name === "string" && name.trim()) {
      const parts = name.trim().split(/\s+/);
      user.firstName = parts[0] || user.firstName;
      user.lastName = parts.slice(1).join(" ") || user.lastName;
    }
    user.email = email || user.email;
    user.phone = typeof phone === "string" ? phone.trim() : user.phone;
    if (typeof avatar === "string") {
      user.avatar = avatar;
    }
    if (shippingAddress) {
      user.shippingAddress = { ...user.shippingAddress, ...shippingAddress };
    }
    syncAddressBook(user, addressBook);

    await user.save();

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Change password
// @route   PUT /api/users/changepassword
// @access  Private
export const changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: errors.array(),
    });
  }

  try {
    const user = await User.findById(req.user._id).select("+password");

    const { currentPassword, newPassword } = req.body;

    // Check current password
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({
        success: false,
        error: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Toggle two-factor authentication
// @route   PUT /api/users/two-factor
// @access  Private
export const updateTwoFactor = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: errors.array(),
    });
  }

  try {
    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const { enabled, currentPassword } = req.body;

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({
        success: false,
        error: "Current password is incorrect",
      });
    }

    user.twoFactorEnabled = Boolean(enabled);
    user.twoFactorCodeHash = undefined;
    user.twoFactorCodeExpire = undefined;

    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      data: {
        twoFactorEnabled: user.twoFactorEnabled,
      },
      message: user.twoFactorEnabled
        ? "Two-factor authentication enabled"
        : "Two-factor authentication disabled",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Delete own account
// @route   DELETE /api/users/me
// @access  Private
export const deleteOwnAccount = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: errors.array(),
    });
  }

  try {
    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const { currentPassword } = req.body;

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({
        success: false,
        error: "Current password is incorrect",
      });
    }

    const avatarPath = user.avatar;

    if (typeof avatarPath === "string" && avatarPath.startsWith("/uploads/")) {
      const localAvatarPath = path.join(__dirname, "..", avatarPath);
      if (fs.existsSync(localAvatarPath)) {
        fs.unlinkSync(localAvatarPath);
      }
    }

    await user.deleteOne();
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/api/auth",
    });

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};
