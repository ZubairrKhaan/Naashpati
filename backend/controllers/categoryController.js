import Category from "../models/Category.js";
import Product from "../models/Product.js";

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
