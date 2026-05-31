import Announcement from "../models/Announcement.js";

// @desc    Get all active announcements (public)
// @route   GET /api/announcements
// @access  Public
export const getActiveAnnouncements = async (req, res) => {
  try {
    const now = new Date();
    const announcements = await Announcement.find({
      isActive: true,
      startDate: { $lte: now },
      $or: [{ endDate: null }, { endDate: { $gte: now } }],
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Get all announcements (admin)
// @route   GET /api/announcements/all
// @access  Admin
export const getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Admin
export const createAnnouncement = async (req, res) => {
  try {
    const { title, message, type, isActive, startDate, endDate } = req.body;

    const announcement = await Announcement.create({
      title,
      message,
      type,
      isActive,
      startDate: startDate || Date.now(),
      endDate: endDate || null,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Admin
export const updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    if (!announcement) {
      return res
        .status(404)
        .json({ success: false, error: "Announcement not found" });
    }

    res.json({ success: true, data: announcement });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Admin
export const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);

    if (!announcement) {
      return res
        .status(404)
        .json({ success: false, error: "Announcement not found" });
    }

    res.json({ success: true, message: "Announcement deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};
