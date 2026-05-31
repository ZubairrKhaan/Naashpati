import HeroSlide from "../models/HeroSlide.js";

// @desc    Get active hero slides
// @route   GET /api/hero-slides
// @access  Public
export const getHeroSlides = async (req, res) => {
  try {
    const slides = await HeroSlide.find({ isActive: true }).sort({
      displayOrder: 1,
      createdAt: -1,
    });

    res.json({ success: true, data: slides });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Get all hero slides
// @route   GET /api/hero-slides/all
// @access  Private/Admin
export const getAllHeroSlides = async (req, res) => {
  try {
    const slides = await HeroSlide.find().sort({
      displayOrder: 1,
      createdAt: -1,
    });

    res.json({ success: true, data: slides });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Create hero slide
// @route   POST /api/hero-slides
// @access  Private/Admin
export const createHeroSlide = async (req, res) => {
  try {
    const image = req.body.image?.trim();
    const title = req.body.title?.trim() || "";
    const subtitle = req.body.subtitle?.trim() || "";
    const displayOrder = Number(req.body.displayOrder || 0);

    if (!image) {
      return res
        .status(400)
        .json({ success: false, error: "Hero image is required" });
    }

    const slide = await HeroSlide.create({
      image,
      title,
      subtitle,
      displayOrder,
    });

    res.status(201).json({ success: true, data: slide });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Delete hero slide
// @route   DELETE /api/hero-slides/:id
// @access  Private/Admin
export const deleteHeroSlide = async (req, res) => {
  try {
    const slide = await HeroSlide.findById(req.params.id);

    if (!slide) {
      return res
        .status(404)
        .json({ success: false, error: "Hero slide not found" });
    }

    await slide.deleteOne();

    res.json({ success: true, message: "Hero slide deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};
