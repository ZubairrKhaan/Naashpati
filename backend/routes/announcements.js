import express from "express";
import {
  getActiveAnnouncements,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcementController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getActiveAnnouncements);
router.get("/all", protect, authorize("admin"), getAllAnnouncements);
router.post("/", protect, authorize("admin"), createAnnouncement);
router.put("/:id", protect, authorize("admin"), updateAnnouncement);
router.delete("/:id", protect, authorize("admin"), deleteAnnouncement);

export default router;
