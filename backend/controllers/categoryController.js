import Category from "../models/Category.js";
import Product from "../models/Product.js";

const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// @desc    Get active categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ name: 1 })
      .select("name value description image");

    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const description = req.body.description?.trim() || "";
    const image = req.body.image?.trim() || "";

    if (!name || name.length < 2) {
      return res.status(400).json({
        success: false,
        error: "Category name must be at least 2 characters",
      });
    }

    const category = await Category.create({ name, description, image });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Category already exists",
      });
    }

    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res
        .status(404)
        .json({ success: false, error: "Category not found" });
    }

    const productCount = await Product.countDocuments({
      category: category.value,
      isActive: true,
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete a category that is used by active products",
      });
    }

    await category.deleteOne();

    res.json({ success: true, message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res
        .status(404)
        .json({ success: false, error: "Category not found" });
    }

    const name = req.body.name?.trim();
    const description = req.body.description?.trim() || "";
    const image = req.body.image?.trim() || "";

    if (!name || name.length < 2) {
      return res.status(400).json({
        success: false,
        error: "Category name must be at least 2 characters",
      });
    }

    const nextValue = slugify(name);
    const oldValue = category.value;

    const existing = await Category.findOne({
      _id: { $ne: category._id },
      $or: [{ name }, { value: nextValue }],
    }).lean();

    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Category already exists",
      });
    }

    category.name = name;
    category.description = description;
    category.image = image;
    category.value = nextValue;
    await category.save();

    if (oldValue !== nextValue) {
      await Product.updateMany(
        { category: oldValue },
        { $set: { category: nextValue } },
      );
    }

    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};
