import ProductBanner from "../models/ProductBanner.js";

// @desc    Get active product page banners
// @route   GET /api/product-banners
// @access  Public
export const getProductBanners = async (req, res) => {
  try {
    const banners = await ProductBanner.find({ isActive: true }).sort({
      displayOrder: 1,
      createdAt: -1,
    });

    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Get all product page banners
// @route   GET /api/product-banners/all
// @access  Private/Admin
export const getAllProductBanners = async (req, res) => {
  try {
    const banners = await ProductBanner.find().sort({
      displayOrder: 1,
      createdAt: -1,
    });

    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Create product page banner
// @route   POST /api/product-banners
// @access  Private/Admin
export const createProductBanner = async (req, res) => {
  try {
    const image = req.body.image?.trim();
    const displayOrder = Number(req.body.displayOrder || 0);

    if (!image) {
      return res
        .status(400)
        .json({ success: false, error: "Banner image is required" });
    }

    const banner = await ProductBanner.create({
      image,
      displayOrder,
    });

    res.status(201).json({ success: true, data: banner });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Delete product page banner
// @route   DELETE /api/product-banners/:id
// @access  Private/Admin
export const deleteProductBanner = async (req, res) => {
  try {
    const banner = await ProductBanner.findById(req.params.id);

    if (!banner) {
      return res
        .status(404)
        .json({ success: false, error: "Banner not found" });
    }

    await banner.deleteOne();

    res.json({ success: true, message: "Banner deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};
