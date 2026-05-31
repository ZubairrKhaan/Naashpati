import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  createProduct,
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

const CreateProduct = ({ onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectAuthUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectProductsStatus);
  const error = useSelector(selectProductsError);
  const categories = useSelector(selectCategories);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    briefDescriptionPoints: [""],
    directions: [""],
    servingSize: "",
    instructionsContent: "",
    faqContent: "",
    qualityPromiseContent: "",
    ingredients: [{ name: "", amount: "" }],
    helpsTo: "",
    price: "",
    costPrice: "",
    category: "",
    sku: "",
    stock: "0",
    image: null,
    isActive: true,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const descriptionWordCount = formData.description
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

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
    if (categories.length > 0 && !formData.category) {
      setFormData((prev) => ({ ...prev, category: categories[0].value }));
    }
  }, [categories, formData.category]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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

  const handleDirectionChange = (index, value) => {
    setFormData((prev) => {
      const updated = [...prev.directions];
      updated[index] = value;
      return { ...prev, directions: updated };
    });
  };

  const addDirection = () => {
    setFormData((prev) => ({
      ...prev,
      directions: [...prev.directions, ""],
    }));
  };

  const removeDirection = (index) => {
    setFormData((prev) => {
      if (prev.directions.length <= 1) return prev;
      return {
        ...prev,
        directions: prev.directions.filter((_, i) => i !== index),
      };
    });
  };

  const handleIngredientChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.ingredients];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, ingredients: updated };
    });
  };

  const addIngredient = () => {
    setFormData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: "", amount: "" }],
    }));
  };

  const removeIngredient = (index) => {
    setFormData((prev) => {
      if (prev.ingredients.length <= 1) return prev;
      return {
        ...prev,
        ingredients: prev.ingredients.filter((_, i) => i !== index),
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
      description,
      briefDescriptionPoints,
      directions,
      servingSize,
      instructionsContent,
      faqContent,
      qualityPromiseContent,
      ingredients,
      helpsTo,
      price,
      costPrice,
      category,
      sku,
      stock,
      image,
      isActive,
    } = formData;

    // Frontend validation matching backend requirements
    if (!name || name.trim().length < 2 || name.length > 100) {
      toast.error("Product name must be between 2 and 100 characters.");
      return;
    }

    if (
      !description ||
      description.trim().length < 10 ||
      description.length > 1000
    ) {
      toast.error("Description must be between 10 and 1000 characters.");
      return;
    }

    const previewWordCount = description
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    if (previewWordCount > 50) {
      toast.error("Product preview description must be 50 words or fewer.");
      return;
    }

    const normalizedBriefPoints = (briefDescriptionPoints || [])
      .map((point) => point.trim())
      .filter(Boolean);

    const normalizedIngredients = (ingredients || [])
      .map((item) => ({
        name: String(item?.name || "").trim(),
        amount: String(item?.amount || "").trim(),
      }))
      .filter((item) => item.name || item.amount);

    if (
      normalizedIngredients.some(
        (item) =>
          !item.name || item.name.length > 150 || item.amount.length > 100,
      )
    ) {
      toast.error(
        "Each ingredient row needs a name (max 150 chars) and optional amount (max 100 chars).",
      );
      return;
    }

    if ((instructionsContent || "").trim().length > 2000) {
      toast.error("Instructions content must be 2000 characters or fewer.");
      return;
    }

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

    if ((helpsTo || "").trim().length > 600) {
      toast.error("Helps to content cannot be more than 600 characters.");
      return;
    }

    const priceNum = parseFloat(price);
    if (!price || isNaN(priceNum) || priceNum < 0) {
      toast.error("Price must be a positive number.");
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
        description: description.trim(),
        briefDescription: normalizedBriefPoints.join("\n"),
        briefDescriptionPoints: normalizedBriefPoints,
        directions: (directions || []).map((s) => s.trim()).filter(Boolean),
        servingSize: (servingSize || "").trim(),
        instructionsContent: (instructionsContent || "").trim(),
        faqContent: (faqContent || "").trim(),
        qualityPromiseContent: (qualityPromiseContent || "").trim(),
        ingredients: normalizedIngredients,
        helpsTo: helpsTo.trim(),
        price: Number(price),
        costPrice: Number(costPrice),
        category,
        sku: normalizedSku,
        stock: Number(stock),
        isActive,
        image: "",
        images: [],
      };

      if (image) {
        setUploading(true);
        toast.loading("Uploading image...", { id: "upload" });
        try {
          const imageData = await uploadImage(image);
          productData.image = imageData.url; // e.g. "/uploads/abc.jpg"
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
              {categories.map((option) => (
                <option key={option._id || option.value} value={option.value}>
                  {option.name}
                </option>
              ))}
            </select>
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
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description (Products Preview)
          </label>
          <textarea
            id="description"
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            placeholder="Write a short preview for product listing (max 50 words)."
            required
          />
          <p
            className={`mt-1 text-xs ${
              descriptionWordCount > 50 ? "text-red-600" : "text-gray-500"
            }`}
          >
            This appears in product listing cards. Max 50 words.
            {` (${descriptionWordCount}/50)`}
          </p>
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
            Directions (How to Use)
          </label>
          <div className="mt-2 space-y-2">
            {formData.directions.map((step, index) => (
              <div key={`dir-${index}`} className="flex gap-2">
                <input
                  type="text"
                  value={step}
                  onChange={(e) => handleDirectionChange(index, e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  placeholder={`Step ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeDirection(index)}
                  disabled={formData.directions.length <= 1}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addDirection}
            className="mt-2 rounded-md border border-green-600 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50"
          >
            + Add Step
          </button>
          <p className="mt-1 text-xs text-gray-500">
            Add usage instructions step by step. Each step up to 300 characters.
          </p>
        </div>

        <div>
          <label
            htmlFor="servingSize"
            className="block text-sm font-medium text-gray-700"
          >
            Serving Size (Ingredients Section)
          </label>
          <input
            id="servingSize"
            name="servingSize"
            type="text"
            value={formData.servingSize}
            onChange={handleChange}
            maxLength={200}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            placeholder="Example: One (1) Capsule"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Ingredients Content
          </label>
          <div className="mt-2 space-y-2">
            {formData.ingredients.map((item, index) => (
              <div
                key={`ingredient-${index}`}
                className="grid grid-cols-1 gap-2 sm:grid-cols-12"
              >
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) =>
                    handleIngredientChange(index, "name", e.target.value)
                  }
                  className="sm:col-span-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  placeholder={`Ingredient ${index + 1}`}
                />
                <input
                  type="text"
                  value={item.amount}
                  onChange={(e) =>
                    handleIngredientChange(index, "amount", e.target.value)
                  }
                  className="sm:col-span-4 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  placeholder="Amount (e.g. 250 mg)"
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  disabled={formData.ingredients.length <= 1}
                  className="sm:col-span-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addIngredient}
            className="mt-2 rounded-md border border-green-600 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50"
          >
            + Add Ingredient
          </button>
          <p className="mt-1 text-xs text-gray-500">
            Add each ingredient with optional amount. If amount is filled, name
            is required.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Instructions Paragraph (Ingredients Tab)
          </label>
          <textarea
            id="instructionsContent"
            name="instructionsContent"
            rows="4"
            value={formData.instructionsContent}
            onChange={handleChange}
            maxLength={2000}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            placeholder="Add the instructions text shown in the Instructions tab."
          />
          <p className="mt-1 text-xs text-gray-500">
            This will appear as a paragraph in the Instructions tab (max 2000
            characters).
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

        <div>
          <label
            htmlFor="helpsTo"
            className="block text-sm font-medium text-gray-700"
          >
            Helps To
          </label>
          <textarea
            id="helpsTo"
            name="helpsTo"
            rows="3"
            value={formData.helpsTo}
            onChange={handleChange}
            maxLength={600}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            placeholder={
              "Enter one point per line, for example:\n- Helps improve immunity\n- Supports digestion\n- Maintains daily energy"
            }
          />
          <p className="mt-1 text-xs text-gray-500">
            Add benefits as points, one per line (max 600 characters total).
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

