import User from "../models/User.js";
import getCloudinary from "../config/cloudinary.js";

// @desc    Upload image to local /uploads folder
// @route   POST /api/upload
// @access  Private/Admin
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      console.error("No file uploaded. req.file:", req.file);
      return res
        .status(400)
        .json({ success: false, error: "No file uploaded" });
    }

    let result;
    try {
      result = await getCloudinary().uploader.upload(req.file.path, {
        folder: "naashpati",
        resource_type: "image",
      });
    } catch (cloudErr) {
      console.error("Cloudinary upload error:", cloudErr);
      return res.status(500).json({
        success: false,
        error: `Cloudinary upload failed: ${cloudErr.message || cloudErr}`,
      });
    }

    // Optionally, delete the local file after upload
    try {
      await import("fs").then((fs) => fs.unlinkSync(req.file.path));
    } catch (e) {
      console.warn("Failed to delete local file after Cloudinary upload", e);
    }

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        public_id: result.public_id,
      },
    });
  } catch (error) {
    console.error("Image upload failed:", error);
    res.status(500).json({
      success: false,
      error: `Image upload failed: ${error.message || error}`,
    });
  }
};

// @desc    Upload video to local /uploads folder
// @route   POST /api/upload/video
// @access  Private/Admin
export const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "No file uploaded" });
    }

    const videoUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      data: {
        url: videoUrl,
        public_id: req.file.filename,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Video upload failed" });
  }
};

// @desc    Upload and save user avatar
// @route   POST /api/upload/avatar
// @access  Private
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "No file uploaded" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: imageUrl },
      {
        new: true,
      },
    );

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({
      success: true,
      data: {
        user,
        url: imageUrl,
        public_id: req.file.filename,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Avatar upload failed" });
  }
};

// @desc    Delete image from /uploads folder
// @route   DELETE /api/upload/:filename
// @access  Private/Admin
export const deleteImage = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join("uploads", filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.json({ success: true, message: "Image deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Image deletion failed" });
  }
};
