import HeroBadge from "../models/HeroBadge.js";

const normalizeGenderImages = (genderImages = {}) => ({
  female:
    typeof genderImages.female === "string" ? genderImages.female.trim() : "",
  male: typeof genderImages.male === "string" ? genderImages.male.trim() : "",
});

const toHeroBadgePayload = (doc) => ({
  images: Array.isArray(doc.images) ? doc.images : [],
  genderImages: normalizeGenderImages(doc.genderImages),
});

// @desc    Get hero certificate badge images
// @route   GET /api/hero-badges
// @access  Public
export const getHeroBadges = async (req, res) => {
  try {
    let doc = await HeroBadge.findOne();
    if (!doc) {
      doc = await HeroBadge.create({ images: [] });
    }
    res.json({ success: true, data: toHeroBadgePayload(doc) });
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

    res.json({ success: true, data: toHeroBadgePayload(doc) });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Update home shop-by-gender images
// @route   PUT /api/hero-badges/gender-images
// @access  Private/Admin
export const updateHeroGenderImages = async (req, res) => {
  try {
    const nextGenderImages = normalizeGenderImages(req.body.genderImages);

    let doc = await HeroBadge.findOne();
    if (!doc) {
      doc = await HeroBadge.create({
        images: [],
        genderImages: nextGenderImages,
      });
    } else {
      doc.genderImages = {
        ...normalizeGenderImages(doc.genderImages),
        ...nextGenderImages,
      };
      await doc.save();
    }

    res.json({ success: true, data: toHeroBadgePayload(doc) });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};
