import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import AboutContent from "../models/AboutContent.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_HEALTH_PRIORITY_ITEMS = [
  {
    title: "SUPERIOR MANUFACTURING",
    description:
      "Nutrifactor establishes high-quality manufacturing standards for nutraceutical products, maintaining control over the entire production process with stringent adherence to cGMPs. Our commitment extends to thorough documentation to ensure the traceability of every step.",
  },
  {
    title: "RESEARCH & DEVELOPMENT",
    description:
      "Our research pilot plant stays up-to-date with the latest findings about the natural ingredients and nutraceuticals, which are further supported by our laboratory studies. We rely on scientific research to ensure the authenticity and accuracy of our health-related claims.",
  },
  {
    title: "CURRENT HEALTH CONCERNS",
    description:
      "We focus on the health issues of our consumers by placing their needs at the core of our formulations. Upon identifying current health concerns, we promptly conduct research to develop top-quality natural healthcare products that meet the identified health needs.",
  },
];

const deleteUploadedFileIfExists = (fileUrl) => {
  if (!fileUrl || !fileUrl.startsWith("/uploads/")) {
    return;
  }

  const filename = path.basename(fileUrl);
  const filePath = path.join(__dirname, "..", "uploads", filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// @desc    Get About page content
// @route   GET /api/about-content
// @access  Public
export const getAboutContent = async (req, res) => {
  try {
    const content = await AboutContent.findOne().sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: {
        videoUrl: content?.videoUrl || "",
        facilityHeading:
          content?.facilityHeading ||
          "Pakistan's Largest Nutraceutical Manufacturing Facility",
        facilityDescription:
          content?.facilityDescription ||
          "With over a decade of experience, Naashpati specializes in manufacturing nutraceutical and natural healthcare products. Backed by modern laboratories, strict quality protocols, and scalable production systems, we continue to set standards in safety, consistency, and product innovation.",
        facilityImages: content?.facilityImages || [],
        scienceHeading: content?.scienceHeading || "We Are Backed By Science",
        scienceDescription:
          content?.scienceDescription ||
          "Naashpati delivers high-quality, safe products crafted under expert supervision and aligned with global standards. Committed to GMP, HACCP, ISO systems, and compliance-driven quality controls, we ensure excellence at every stage.",
        scienceBadgeImages: content?.scienceBadgeImages || [],
        scienceImage: content?.scienceImage || "",
        whyNutrifactorHeading:
          content?.whyNutrifactorHeading || "WHY NUTRIFACTOR!",
        whyNutrifactorDescription:
          content?.whyNutrifactorDescription ||
          "Nutrifactor stands out from other nutraceutical brands due to our values of transparency and traceability in delivering high-quality natural healthcare products. Our commitment to excellence encompasses sustainable sourcing, integrity across all levels, and rigorous testing methods exceeding usual standard practices. We strive to bridge the gap between consumers and nutraceuticals science by being transparent in our labels. All the health benefits listed on our products are strictly in accordance with the scientific research.",
        whyNutrifactorImage: content?.whyNutrifactorImage || "",
        missionHeading:
          content?.missionHeading ||
          "Bridging Ancient Wisdom with Modern Wellness",
        missionDescription:
          content?.missionDescription ||
          "For centuries, herbal traditions have guided communities toward balance and vitality. At Naashpati, we honour that heritage by making it accessible, transparent, and trustworthy for the modern world. From the highland farms of Morocco to the tropical forests of Sri Lanka, we trace every ingredient back to its origin and share that journey with you because you deserve to know exactly what you're putting in your body.",
        missionImage: content?.missionImage || "",
        healthPriorityHeading:
          content?.healthPriorityHeading || "YOUR HEALTH, OUR PRIORITY",
        healthPriorityItems:
          content?.healthPriorityItems?.length >= 1
            ? content.healthPriorityItems
            : DEFAULT_HEALTH_PRIORITY_ITEMS,
        healthPriorityImages: content?.healthPriorityImages || [],
        teamMembers: content?.teamMembers || [],
        updatedAt: content?.updatedAt || null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Update About page video
// @route   PUT /api/about-content
// @access  Private/Admin
export const updateAboutContent = async (req, res) => {
  try {
    const hasVideoUrl = Object.prototype.hasOwnProperty.call(
      req.body,
      "videoUrl",
    );
    const hasFacilityHeading = Object.prototype.hasOwnProperty.call(
      req.body,
      "facilityHeading",
    );
    const hasFacilityDescription = Object.prototype.hasOwnProperty.call(
      req.body,
      "facilityDescription",
    );
    const hasFacilityImages = Object.prototype.hasOwnProperty.call(
      req.body,
      "facilityImages",
    );
    const hasScienceHeading = Object.prototype.hasOwnProperty.call(
      req.body,
      "scienceHeading",
    );
    const hasScienceDescription = Object.prototype.hasOwnProperty.call(
      req.body,
      "scienceDescription",
    );
    const hasScienceBadgeImages = Object.prototype.hasOwnProperty.call(
      req.body,
      "scienceBadgeImages",
    );
    const hasScienceImage = Object.prototype.hasOwnProperty.call(
      req.body,
      "scienceImage",
    );
    const hasWhyNutrifactorHeading = Object.prototype.hasOwnProperty.call(
      req.body,
      "whyNutrifactorHeading",
    );
    const hasWhyNutrifactorDescription = Object.prototype.hasOwnProperty.call(
      req.body,
      "whyNutrifactorDescription",
    );
    const hasWhyNutrifactorImage = Object.prototype.hasOwnProperty.call(
      req.body,
      "whyNutrifactorImage",
    );
    const hasMissionHeading = Object.prototype.hasOwnProperty.call(
      req.body,
      "missionHeading",
    );
    const hasMissionDescription = Object.prototype.hasOwnProperty.call(
      req.body,
      "missionDescription",
    );
    const hasMissionImage = Object.prototype.hasOwnProperty.call(
      req.body,
      "missionImage",
    );
    const hasHealthPriorityHeading = Object.prototype.hasOwnProperty.call(
      req.body,
      "healthPriorityHeading",
    );
    const hasHealthPriorityItems = Object.prototype.hasOwnProperty.call(
      req.body,
      "healthPriorityItems",
    );
    const hasHealthPriorityImages = Object.prototype.hasOwnProperty.call(
      req.body,
      "healthPriorityImages",
    );
    const hasTeamMembers = Object.prototype.hasOwnProperty.call(
      req.body,
      "teamMembers",
    );

    if (
      !hasVideoUrl &&
      !hasFacilityHeading &&
      !hasFacilityDescription &&
      !hasFacilityImages &&
      !hasScienceHeading &&
      !hasScienceDescription &&
      !hasScienceBadgeImages &&
      !hasScienceImage &&
      !hasWhyNutrifactorHeading &&
      !hasWhyNutrifactorDescription &&
      !hasWhyNutrifactorImage &&
      !hasMissionHeading &&
      !hasMissionDescription &&
      !hasMissionImage &&
      !hasHealthPriorityHeading &&
      !hasHealthPriorityItems &&
      !hasHealthPriorityImages &&
      !hasTeamMembers
    ) {
      return res.status(400).json({
        success: false,
        error: "No updatable fields provided",
      });
    }

    let content = await AboutContent.findOne().sort({ updatedAt: -1 });

    if (!content) {
      content = new AboutContent();
    }

    if (hasVideoUrl) {
      const nextVideoUrl = req.body.videoUrl?.trim() || "";
      if (content.videoUrl && content.videoUrl !== nextVideoUrl) {
        deleteUploadedFileIfExists(content.videoUrl);
      }
      content.videoUrl = nextVideoUrl;
    }

    if (hasFacilityHeading) {
      content.facilityHeading = req.body.facilityHeading?.trim() || "";
    }

    if (hasFacilityDescription) {
      content.facilityDescription = req.body.facilityDescription?.trim() || "";
    }

    if (hasFacilityImages) {
      const nextImagesRaw = Array.isArray(req.body.facilityImages)
        ? req.body.facilityImages
        : [];
      const nextImages = nextImagesRaw
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
        .slice(0, 3);

      const previousImages = Array.isArray(content.facilityImages)
        ? content.facilityImages
        : [];

      previousImages
        .filter((oldImage) => oldImage && !nextImages.includes(oldImage))
        .forEach((oldImage) => deleteUploadedFileIfExists(oldImage));

      content.facilityImages = nextImages;
    }

    if (hasScienceHeading) {
      content.scienceHeading = req.body.scienceHeading?.trim() || "";
    }

    if (hasScienceDescription) {
      content.scienceDescription = req.body.scienceDescription?.trim() || "";
    }

    if (hasScienceBadgeImages) {
      const rawBadgeImages = Array.isArray(req.body.scienceBadgeImages)
        ? req.body.scienceBadgeImages
        : [];
      const nextBadgeImages = rawBadgeImages
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
        .slice(0, 8);

      if (nextBadgeImages.length < 1) {
        return res.status(400).json({
          success: false,
          error: "Please upload at least one certification badge image",
        });
      }

      const previousBadgeImages = Array.isArray(content.scienceBadgeImages)
        ? content.scienceBadgeImages
        : [];

      previousBadgeImages
        .filter((oldImage) => oldImage && !nextBadgeImages.includes(oldImage))
        .forEach((oldImage) => deleteUploadedFileIfExists(oldImage));

      content.scienceBadgeImages = nextBadgeImages;
    }

    if (hasScienceImage) {
      const nextScienceImage = req.body.scienceImage?.trim() || "";

      if (!nextScienceImage) {
        return res.status(400).json({
          success: false,
          error: "Please upload one science section image",
        });
      }

      if (content.scienceImage && content.scienceImage !== nextScienceImage) {
        deleteUploadedFileIfExists(content.scienceImage);
      }

      content.scienceImage = nextScienceImage;
    }

    if (hasWhyNutrifactorHeading) {
      content.whyNutrifactorHeading =
        req.body.whyNutrifactorHeading?.trim() || "";
    }

    if (hasWhyNutrifactorDescription) {
      content.whyNutrifactorDescription =
        req.body.whyNutrifactorDescription?.trim() || "";
    }

    if (hasWhyNutrifactorImage) {
      const nextWhyImage = req.body.whyNutrifactorImage?.trim() || "";

      if (!nextWhyImage) {
        return res.status(400).json({
          success: false,
          error: "Please upload one image for Why Nutrifactor section",
        });
      }

      if (
        content.whyNutrifactorImage &&
        content.whyNutrifactorImage !== nextWhyImage
      ) {
        deleteUploadedFileIfExists(content.whyNutrifactorImage);
      }

      content.whyNutrifactorImage = nextWhyImage;
    }

    if (hasMissionHeading) {
      content.missionHeading = req.body.missionHeading?.trim() || "";
    }

    if (hasMissionDescription) {
      content.missionDescription = req.body.missionDescription?.trim() || "";
    }

    if (hasMissionImage) {
      const nextMissionImage = req.body.missionImage?.trim() || "";

      if (!nextMissionImage) {
        return res.status(400).json({
          success: false,
          error: "Please upload one image for Mission section",
        });
      }

      if (content.missionImage && content.missionImage !== nextMissionImage) {
        deleteUploadedFileIfExists(content.missionImage);
      }

      content.missionImage = nextMissionImage;
    }

    if (hasHealthPriorityHeading) {
      content.healthPriorityHeading =
        req.body.healthPriorityHeading?.trim() || "";
    }

    if (hasHealthPriorityItems) {
      const rawItems = Array.isArray(req.body.healthPriorityItems)
        ? req.body.healthPriorityItems
        : [];

      content.healthPriorityItems = rawItems
        .map((item) => ({
          title:
            item && typeof item.title === "string" ? item.title.trim() : "",
          description:
            item && typeof item.description === "string"
              ? item.description.trim()
              : "",
        }))
        .filter((item) => item.title || item.description)
        .slice(0, 3);
    }

    if (hasHealthPriorityImages) {
      const rawImages = Array.isArray(req.body.healthPriorityImages)
        ? req.body.healthPriorityImages
        : [];
      const nextImages = rawImages
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
        .slice(0, 4);

      const previousImages = Array.isArray(content.healthPriorityImages)
        ? content.healthPriorityImages
        : [];

      previousImages
        .filter((oldImage) => oldImage && !nextImages.includes(oldImage))
        .forEach((oldImage) => deleteUploadedFileIfExists(oldImage));

      content.healthPriorityImages = nextImages;
    }

    if (hasTeamMembers) {
      const rawMembers = Array.isArray(req.body.teamMembers)
        ? req.body.teamMembers
        : [];

      const previousMemberImages = Array.isArray(content.teamMembers)
        ? content.teamMembers
            .map((member) =>
              member && typeof member.image === "string"
                ? member.image.trim()
                : "",
            )
            .filter(Boolean)
        : [];

      const normalizedMembers = rawMembers
        .map((member) => ({
          name:
            member && typeof member.name === "string" ? member.name.trim() : "",
          role:
            member && typeof member.role === "string" ? member.role.trim() : "",
          bio:
            member && typeof member.bio === "string" ? member.bio.trim() : "",
          image:
            member && typeof member.image === "string"
              ? member.image.trim()
              : "",
        }))
        .filter(
          (member) => member.name || member.role || member.bio || member.image,
        )
        .slice(0, 12);

      const nextMemberImages = normalizedMembers
        .map((member) => member.image)
        .filter(Boolean);

      previousMemberImages
        .filter((oldImage) => !nextMemberImages.includes(oldImage))
        .forEach((oldImage) => deleteUploadedFileIfExists(oldImage));

      content.teamMembers = normalizedMembers;
    }

    content.updatedBy = req.user?._id || null;
    await content.save();

    res.json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Remove About page video
// @route   DELETE /api/about-content
// @access  Private/Admin
export const clearAboutContent = async (req, res) => {
  try {
    const content = await AboutContent.findOne().sort({ updatedAt: -1 });

    if (!content || !content.videoUrl) {
      return res.json({ success: true, message: "No video to remove" });
    }

    deleteUploadedFileIfExists(content.videoUrl);
    content.videoUrl = "";
    content.updatedBy = req.user?._id || null;
    await content.save();

    res.json({ success: true, message: "About video removed" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};
