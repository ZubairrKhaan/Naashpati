import HeroBadge from "../models/HeroBadge.js";

// @desc    Get hero certificate badge images
// @route   GET /api/hero-badges
// @access  Public
export const getHeroBadges = async (req, res) => {
  try {
    let doc = await HeroBadge.findOne();
    if (!doc) {
      doc = await HeroBadge.create({ images: [] });
    }
    res.json({ success: true, data: doc.images });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Update hero certificate badge images
// @route   PUT /api/hero-badges
// @access  Private/Admin
export const updateHeroBadges = async (req, res) => {
  try {
    const images = Array.isArray(req.body.images)
      ? req.body.images
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter(Boolean)
          .slice(0, 20)
      : [];

    let doc = await HeroBadge.findOne();
    if (!doc) {
      doc = await HeroBadge.create({ images });
    } else {
      doc.images = images;
      await doc.save();
    }

    res.json({ success: true, data: doc.images });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};
