import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  createProduct,
  createCategory,
  fetchCategories,
  selectCategories,
  selectProductsStatus,
  selectProductsError,
} from "../../store/slices/productSlice";
import {
  selectAuthUser,
  selectIsAuthenticated,
} from "../../store/slices/authSlice";
import RichTextEditor from "../../components/RichTextEditor";

const ATTRIBUTE_FIELDS = [
  { key: "color", label: "Color" },
  { key: "material", label: "Material" },
  { key: "size", label: "Size" },
  { key: "lensType", label: "Lens Type" },
  { key: "uvProtection", label: "UV Protection" },
  { key: "frameMaterial", label: "Frame Material" },
  { key: "author", label: "Author" },
  { key: "pages", label: "Pages", type: "number" },
  { key: "language", label: "Language" },
  { key: "bottleCapacity", label: "Bottle Capacity" },
  { key: "dimensions", label: "Dimensions" },
];

const DEFAULT_CATEGORIES = [
  { name: "Male Collection", description: "" },
  { name: "Female Collection", description: "" },
];

const CreateProduct = ({ onClose, onSuccess, initialCategory = "" }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectAuthUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectProductsStatus);
  const error = useSelector(selectProductsError);
  const categories = useSelector(selectCategories);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    shortDescription: "",
    subcategory: "",
    brand: "",
    tags: "",
    briefDescriptionPoints: [""],
    faqContent: "",
    qualityPromiseContent: "",
    price: "",
    salePrice: "",
    originalPrice: "",
    costPrice: "",
    category: "",
    collection: "male",
    sku: "",
    barcode: "",
    stock: "0",
    image: null,
    thumbnail: "",
    videoUrl: "",
    status: "published",
    featured: false,
    trending: false,
    bestseller: false,
    newArrival: false,
    attributes: {
      color: "",
      material: "",
      size: "",
      lensType: "",
      uvProtection: "",
      frameMaterial: "",
      author: "",
      pages: "",
      language: "",
      bottleCapacity: "",
      dimensions: "",
    },
    shipping: {
      weight: "",
      length: "",
      width: "",
      height: "",
      freeShipping: false,
    },
    seo: {
      metaTitle: "",
      metaDescription: "",
      seoKeywords: "",
    },
    isActive: true,
    showOnHomeBanner: false,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const defaultCategoriesEnsured = useRef(false);

  useEffect(() => {
    dispatch(fetchCategories());

    console.log(
      "CreateProduct useEffect - isAuthenticated:",
      isAuthenticated,
      "user:",
      user,
    );
    if (!isAuthenticated || user?.role !== "admin") {
      console.log("User not authenticated or not admin, closing modal");
      onClose();
      toast.error("Access denied. Admin privileges required.");
    }
  }, [dispatch, isAuthenticated, user, onClose]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      return;
    }

    if (defaultCategoriesEnsured.current) {
      return;
    }

    const existingValues = new Set(
      categories.map((category) => String(category.value || "").toLowerCase()),
    );

    const missingDefaults = DEFAULT_CATEGORIES.filter((category) => {
      const value = category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      return !existingValues.has(value);
    });

    if (missingDefaults.length === 0) {
      defaultCategoriesEnsured.current = true;
      return;
    }

    defaultCategoriesEnsured.current = true;
    missingDefaults.forEach((category) => {
      dispatch(createCategory(category)).catch(() => {});
    });
  }, [categories, dispatch, isAuthenticated, user]);

  const availableCategories = categories.filter(
    (category) =>
      category.value !== "male-collection" &&
      category.value !== "female-collection",
  );

  useEffect(() => {
    if (initialCategory) {
      setFormData((prev) =>
        prev.category === initialCategory
          ? prev
          : { ...prev, category: initialCategory },
      );
      return;
    }

    if (availableCategories.length > 0 && !formData.category) {
      setFormData((prev) => ({ ...prev, category: availableCategories[0].value }));
    }
  }, [initialCategory, availableCategories, formData.category]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: type === "checkbox" ? checked : value };
      // If category changed and it's a known male/female category, default collection
      if (name === "category") {
        if (value === "male-collection") {
          next.collection = "male";
        } else if (value === "female-collection") {
          next.collection = "female";
        }
      }
      return next;
    });
  };

  const handleAttributeChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [key]: value,
      },
    }));
  };

  const handleShippingChange = (key, value, isCheckbox = false) => {
    setFormData((prev) => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        [key]: isCheckbox ? Boolean(value) : value,
      },
    }));
  };

  const handleSeoChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      seo: {
        ...prev.seo,
        [key]: value,
      },
    }));
  };

  const handleBriefPointChange = (index, value) => {
    setFormData((prev) => {
      const updatedPoints = [...prev.briefDescriptionPoints];
      updatedPoints[index] = value;
      return { ...prev, briefDescriptionPoints: updatedPoints };
    });
  };

  const addBriefPoint = () => {
    setFormData((prev) => ({
      ...prev,
      briefDescriptionPoints: [...prev.briefDescriptionPoints, ""],
    }));
  };

  const removeBriefPoint = (index) => {
    setFormData((prev) => {
      if (prev.briefDescriptionPoints.length <= 1) {
        return prev;
      }
      return {
        ...prev,
        briefDescriptionPoints: prev.briefDescriptionPoints.filter(
          (_, i) => i !== index,
        ),
      };
    });
  };

  const handleFaqContentChange = (value) => {
    setFormData((prev) => ({ ...prev, faqContent: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: file,
      }));
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file) => {
    const formDataUpload = new FormData();
    formDataUpload.append("image", file);

    // Token is stored JSON-stringified, so parse it before use
    const rawToken = localStorage.getItem("accessToken");
    const token = rawToken ? JSON.parse(rawToken) : null;

    const response = await fetch(
      `${import.meta.env.VITE_API_URL || "/api"}/upload`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataUpload,
      },
    );

    if (!response.ok) throw new Error("Failed to upload image");

    const result = await response.json();
    return result.data; // { url: "/uploads/filename", public_id: "filename" }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const {
      name,
      slug,
      shortDescription,
      subcategory,
      brand,
      tags,
      briefDescriptionPoints,
      faqContent,
      qualityPromiseContent,
      price,
      salePrice,
      originalPrice,
      costPrice,
      category,
      sku,
      barcode,
      stock,
      image,
      thumbnail,
      videoUrl,
      status,
      newArrival,
      trending,
      attributes,
      shipping,
      seo,
      isActive,
      showOnHomeBanner,
    } = formData;

    // Frontend validation matching backend requirements
    if (!name || name.trim().length < 2 || name.length > 100) {
      toast.error("Product name must be between 2 and 100 characters.");
      return;
    }

    if (
      !shortDescription ||
      shortDescription.trim().length < 10 ||
      shortDescription.length > 300
    ) {
      toast.error("Short description must be between 10 and 300 characters.");
      return;
    }

    const normalizedBriefPoints = (briefDescriptionPoints || [])
      .map((point) => point.trim())
      .filter(Boolean);

    if ((faqContent || "").trim().length > 10000) {
      toast.error("FAQ content must be 10000 characters or fewer.");
      return;
    }

    if ((qualityPromiseContent || "").trim().length > 3000) {
      toast.error("Quality promise content must be 3000 characters or fewer.");
      return;
    }

    if (normalizedBriefPoints.length === 0) {
      toast.error("Please add at least one brief description point.");
      return;
    }

    if (normalizedBriefPoints.some((point) => point.length > 300)) {
      toast.error(
        "Each brief description point must be 300 characters or fewer.",
      );
      return;
    }

    const priceNum = parseFloat(price);
    if (!price || isNaN(priceNum) || priceNum < 0) {
      toast.error("Price must be a positive number.");
      return;
    }

    const salePriceNum = salePrice === "" ? priceNum : parseFloat(salePrice);
    if (Number.isNaN(salePriceNum) || salePriceNum < 0) {
      toast.error("Sale price must be a positive number.");
      return;
    }

    const originalPriceNum =
      originalPrice === "" ? priceNum : parseFloat(originalPrice);
    if (Number.isNaN(originalPriceNum) || originalPriceNum < 0) {
      toast.error("Original price must be a positive number.");
      return;
    }

    const costPriceNum = parseFloat(costPrice);
    if (!costPrice || isNaN(costPriceNum) || costPriceNum < 0) {
      toast.error("Cost price must be a positive number.");
      return;
    }

    if (!category) {
      toast.error("Please select a valid category.");
      return;
    }

    if (!formData.collection) {
      toast.error("Please select a gender category for the product.");
      return;
    }

    const normalizedSku = (sku || "").trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,64}$/.test(normalizedSku)) {
      toast.error(
        "SKU must be 3-64 characters and use letters, numbers, hyphen, or underscore.",
      );
      return;
    }

    const stockNum = parseInt(stock);
    if (stock === "" || isNaN(stockNum) || stockNum < 0) {
      toast.error("Stock must be a non-negative integer.");
      return;
    }

    console.log("Validation passed, proceeding with product creation");

    try {
      const productData = {
        name: name.trim(),
        slug: (slug || "").trim().toLowerCase(),
        shortDescription: (shortDescription || "").trim(),
        subcategory: (subcategory || "").trim(),
        brand: (brand || "").trim(),
        tags: String(tags || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        briefDescription: normalizedBriefPoints.join("\n"),
        briefDescriptionPoints: normalizedBriefPoints,
        faqContent: (faqContent || "").trim(),
        qualityPromiseContent: (qualityPromiseContent || "").trim(),
        price: Number(salePriceNum),
        salePrice: Number(salePriceNum),
        originalPrice: Number(originalPriceNum),
        costPrice: Number(costPrice),
        category,
        collection: formData.collection,
        sku: normalizedSku,
        barcode: (barcode || "").trim(),
        stock: Number(stock),
        thumbnail: (thumbnail || "").trim(),
        videoUrl: (videoUrl || "").trim(),
        status,
        newArrival,
        trending,
        attributes: {
          ...attributes,
          pages:
            attributes.pages === "" || attributes.pages == null
              ? null
              : Number(attributes.pages),
        },
        shipping: {
          weight: Number(shipping.weight || 0),
          length: Number(shipping.length || 0),
          width: Number(shipping.width || 0),
          height: Number(shipping.height || 0),
          freeShipping: Boolean(shipping.freeShipping),
        },
        seo: {
          metaTitle: (seo.metaTitle || "").trim(),
          metaDescription: (seo.metaDescription || "").trim(),
        },
        seoKeywords: String(seo.seoKeywords || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        isActive,
        showOnHomeBanner,
        image: (thumbnail || "").trim(),
        images: [],
      };

      if (image) {
        setUploading(true);
        toast.loading("Uploading image...", { id: "upload" });
        try {
          const imageData = await uploadImage(image);
          productData.image = imageData.url; // e.g. "/uploads/abc.jpg"
          if (!productData.thumbnail) {
            productData.thumbnail = imageData.url;
          }
          productData.images = [imageData];
          toast.success("Image uploaded", { id: "upload" });
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);
          toast.error("Image upload failed, product saved without image", {
            id: "upload",
          });
        } finally {
          setUploading(false);
        }
      }

      await dispatch(createProduct(productData)).unwrap();
      toast.success("Product created successfully.");
      onSuccess();
    } catch (err) {
      console.error("Product creation failed:", err);
      setUploading(false);
      toast.error(err || "Failed to create product.");
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Product Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="Example: Lavender Oil"
              required
            />
          </div>

          <div>
            <label
              htmlFor="slug"
              className="block text-sm font-medium text-gray-700"
            >
              Slug (Optional)
            </label>
            <input
              id="slug"
              name="slug"
              type="text"
              value={formData.slug}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="auto-generated-from-name"
            />
          </div>

          <div>
            <label
              htmlFor="shortDescription"
              className="block text-sm font-medium text-gray-700"
            >
              Short Description
            </label>
            <input
              id="shortDescription"
              name="shortDescription"
              type="text"
              maxLength={300}
              value={formData.shortDescription}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="Short summary for cards and search"
            />
          </div>

          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700"
            >
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              required
            >
              {availableCategories.map((option) => (
                <option key={option._id || option.value} value={option.value}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="collection"
              className="block text-sm font-medium text-gray-700"
            >
              Gender Category
            </label>
            <select
              id="collection"
              name="collection"
              value={formData.collection}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              required
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="subcategory"
              className="block text-sm font-medium text-gray-700"
            >
              Subcategory
            </label>
            <input
              id="subcategory"
              name="subcategory"
              type="text"
              value={formData.subcategory}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="Example: Herbal Supplements"
            />
          </div>

          <div>
            <label
              htmlFor="brand"
              className="block text-sm font-medium text-gray-700"
            >
              Brand
            </label>
            <input
              id="brand"
              name="brand"
              type="text"
              value={formData.brand}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="Example: Naashpati Naturals"
            />
          </div>

          <div>
            <label
              htmlFor="tags"
              className="block text-sm font-medium text-gray-700"
            >
              Tags (comma separated)
            </label>
            <input
              id="tags"
              name="tags"
              type="text"
              value={formData.tags}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="immunity, ayurvedic, daily use"
            />
          </div>

          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-gray-700"
            >
              Price
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label
              htmlFor="salePrice"
              className="block text-sm font-medium text-gray-700"
            >
              Sale Price
            </label>
            <input
              id="salePrice"
              name="salePrice"
              type="number"
              min="0"
              step="0.01"
              value={formData.salePrice}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="0.00"
            />
          </div>

          <div>
            <label
              htmlFor="originalPrice"
              className="block text-sm font-medium text-gray-700"
            >
              Original Price
            </label>
            <input
              id="originalPrice"
              name="originalPrice"
              type="number"
              min="0"
              step="0.01"
              value={formData.originalPrice}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="0.00"
            />
          </div>

          <div>
            <label
              htmlFor="costPrice"
              className="block text-sm font-medium text-gray-700"
            >
              Cost Price
            </label>
            <input
              id="costPrice"
              name="costPrice"
              type="number"
              min="0"
              step="0.01"
              value={formData.costPrice}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label
              htmlFor="stock"
              className="block text-sm font-medium text-gray-700"
            >
              Stock Quantity
            </label>
            <input
              id="stock"
              name="stock"
              type="number"
              min="0"
              value={formData.stock}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label
              htmlFor="barcode"
              className="block text-sm font-medium text-gray-700"
            >
              Barcode
            </label>
            <input
              id="barcode"
              name="barcode"
              type="text"
              value={formData.barcode}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="e.g. 8901234567890"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="sku"
              className="block text-sm font-medium text-gray-700"
            >
              SKU
            </label>
            <input
              id="sku"
              name="sku"
              type="text"
              value={formData.sku}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="e.g. DH-ASH-60"
              minLength={3}
              maxLength={64}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="thumbnail"
              className="block text-sm font-medium text-gray-700"
            >
              Thumbnail URL (Optional)
            </label>
            <input
              id="thumbnail"
              name="thumbnail"
              type="text"
              value={formData.thumbnail}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="/uploads/thumbnail.jpg or https://..."
            />
          </div>
          <div>
            <label
              htmlFor="videoUrl"
              className="block text-sm font-medium text-gray-700"
            >
              Product Video URL
            </label>
            <input
              id="videoUrl"
              name="videoUrl"
              type="text"
              value={formData.videoUrl}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="https://..."
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="image"
            className="block text-sm font-medium text-gray-700"
          >
            Product Image
          </label>
          <input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
          <p className="mt-2 text-sm text-gray-500">
            Upload a product image (max 5MB, JPG, PNG, GIF).
          </p>
          {imagePreview && (
            <div className="mt-4">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-lg border"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Brief Description Points (Product Detail Page)
          </label>
          <div className="mt-2 space-y-2">
            {formData.briefDescriptionPoints.map((point, index) => (
              <div key={`brief-point-${index}`} className="flex gap-2">
                <input
                  type="text"
                  value={point}
                  onChange={(e) =>
                    handleBriefPointChange(index, e.target.value)
                  }
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  placeholder={`Point ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeBriefPoint(index)}
                  disabled={formData.briefDescriptionPoints.length <= 1}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addBriefPoint}
            className="mt-2 rounded-md border border-green-600 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50"
          >
            + Add Point
          </button>
          <p className="mt-1 text-xs text-gray-500">
            Add as many points as needed. Each point can be up to 300
            characters.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            FAQs Content (Rich Text)
          </label>
          <RichTextEditor
            value={formData.faqContent}
            onChange={handleFaqContentChange}
            placeholder="Write FAQ content with formatting (bold, italic, lists, links, etc.)"
          />
          <p className="mt-1 text-xs text-gray-500">
            This content will appear inside the FAQs tab.
          </p>
        </div>

        <div>
          <label
            htmlFor="qualityPromiseContent"
            className="block text-sm font-medium text-gray-700"
          >
            Our Quality Promise Paragraph
          </label>
          <textarea
            id="qualityPromiseContent"
            name="qualityPromiseContent"
            rows="4"
            value={formData.qualityPromiseContent}
            onChange={handleChange}
            maxLength={3000}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            placeholder="Add quality promise content shown in the Our Quality Promise tab."
          />
          <p className="mt-1 text-xs text-gray-500">
            This will appear as a paragraph in Our Quality Promise tab (max 3000
            characters).
          </p>
        </div>

        <div className="flex items-center gap-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="ml-2 text-sm text-gray-700">Active product</span>
          </label>

          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="newArrival"
              checked={formData.newArrival}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="ml-2 text-sm text-gray-700">New Arrival</span>
          </label>

          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="trending"
              checked={formData.trending}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="ml-2 text-sm text-gray-700">Trending</span>
          </label>

          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="showOnHomeBanner"
              checked={formData.showOnHomeBanner}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Show in Home banner products
            </span>
          </label>
        </div>

        <div className="space-y-4 rounded-md border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800">
            Dynamic Attributes
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {ATTRIBUTE_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700">
                  {field.label}
                </label>
                <input
                  type={field.type || "text"}
                  min={field.type === "number" ? "0" : undefined}
                  value={formData.attributes[field.key] ?? ""}
                  onChange={(e) =>
                    handleAttributeChange(field.key, e.target.value)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-md border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800">Shipping</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {["weight", "length", "width", "height"].map((key) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 capitalize">
                  {key}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.shipping[key]}
                  onChange={(e) => handleShippingChange(key, e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                />
              </div>
            ))}
          </div>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={formData.shipping.freeShipping}
              onChange={(e) =>
                handleShippingChange("freeShipping", e.target.checked, true)
              }
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="ml-2 text-sm text-gray-700">Free Shipping</span>
          </label>
        </div>

        <div className="space-y-4 rounded-md border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800">SEO</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Meta Title
            </label>
            <input
              type="text"
              maxLength={160}
              value={formData.seo.metaTitle}
              onChange={(e) => handleSeoChange("metaTitle", e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Meta Description
            </label>
            <textarea
              rows={3}
              maxLength={320}
              value={formData.seo.metaDescription}
              onChange={(e) =>
                handleSeoChange("metaDescription", e.target.value)
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              SEO Keywords (comma separated)
            </label>
            <input
              type="text"
              value={formData.seo.seoKeywords}
              onChange={(e) => handleSeoChange("seoKeywords", e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="organic, immunity, herbal supplements"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || uploading}
            className="inline-flex items-center px-6 py-2 rounded-md bg-[#68a300] text-white text-sm font-medium hover:bg-[#5f9600] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading
              ? "Uploading..."
              : isLoading
                ? "Saving..."
                : "Add Product"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProduct;
