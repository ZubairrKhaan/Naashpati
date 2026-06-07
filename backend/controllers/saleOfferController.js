import mongoose from "mongoose";
import SaleOffer from "../models/SaleOffer.js";
import Product from "../models/Product.js";

const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildUniqueSlug = async (name, currentId = null) => {
  const base = slugify(name) || "sale";
  let slug = base;
  let suffix = 1;

  while (
    await SaleOffer.exists({
      slug,
      ...(currentId ? { _id: { $ne: currentId } } : {}),
    })
  ) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }

  return slug;
};

const normalizeProductIds = (value) => {
  const ids = Array.isArray(value) ? value : [];
  return [...new Set(ids.map((id) => String(id || "").trim()).filter(Boolean))];
};

const validateExistingProducts = async (productIds) => {
  if (productIds.length === 0) {
    throw new Error("Please select at least one product for this sale");
  }

  const invalidId = productIds.find(
    (id) => !mongoose.Types.ObjectId.isValid(id),
  );
  if (invalidId) {
    throw new Error("One or more selected products are invalid");
  }

  const count = await Product.countDocuments({ _id: { $in: productIds } });
  if (count !== productIds.length) {
    throw new Error("Sales can only include existing products");
  }
};

export const getSaleOffers = async (req, res) => {
  try {
    const offers = await SaleOffer.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .select("name slug banner displayOrder products createdAt");

    res.json({ success: true, data: offers });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const getAllSaleOffers = async (req, res) => {
  try {
    const offers = await SaleOffer.find()
      .sort({ displayOrder: 1, createdAt: -1 })
      .populate("products", "name image thumbnail price salePrice stock isActive");

    res.json({ success: true, data: offers });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const getSaleOffer = async (req, res) => {
  try {
    const identifier = String(req.params.id || "").trim();
    const query = mongoose.Types.ObjectId.isValid(identifier)
      ? { $or: [{ _id: identifier }, { slug: identifier }] }
      : { slug: identifier };

    const offer = await SaleOffer.findOne({ ...query, isActive: true }).populate(
      {
        path: "products",
        match: { isActive: true, status: "published" },
      },
    );

    if (!offer) {
      return res
        .status(404)
        .json({ success: false, error: "Sale offer not found" });
    }

    res.json({ success: true, data: offer });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const createSaleOffer = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const banner = String(req.body.banner || "").trim();
    const displayOrder = Number(req.body.displayOrder || 0);
    const products = normalizeProductIds(req.body.products);

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({
        success: false,
        error: "Sale name must be between 2 and 100 characters",
      });
    }

    if (!banner) {
      return res
        .status(400)
        .json({ success: false, error: "Sale banner is required" });
    }

    await validateExistingProducts(products);

    const offer = await SaleOffer.create({
      name,
      slug: await buildUniqueSlug(name),
      banner,
      products,
      displayOrder,
      isActive: req.body.isActive === undefined ? true : Boolean(req.body.isActive),
    });

    const populated = await offer.populate(
      "products",
      "name image thumbnail price salePrice stock isActive",
    );

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message || "Failed to create sale offer",
    });
  }
};

export const deleteSaleOffer = async (req, res) => {
  try {
    const offer = await SaleOffer.findById(req.params.id);

    if (!offer) {
      return res
        .status(404)
        .json({ success: false, error: "Sale offer not found" });
    }

    await offer.deleteOne();

    res.json({ success: true, message: "Sale offer deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};
