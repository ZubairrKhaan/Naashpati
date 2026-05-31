// Helper to resolve image/media URLs (handles absolute and relative paths)
const resolveMediaUrl = (url) => {
  if (!url) return "/placeholder-product.jpg";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/uploads/")) return `${SERVER_URL}${url}`;
  return url;
};
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  //   fetchProductById,
  selectProduct,
  selectProductsStatus,
  selectProductsError,
  fetchProduct,
} from "../store/slices/productSlice";
import { addToCart } from "../store/slices/cartSlice";
import {
  trackProductView,
  trackAddToCart,
} from "../utils/trendingMetricsTracker";
import {
  selectAuthUser,
  selectIsAuthenticated,
} from "../store/slices/authSlice";
import Loader from "../components/Loader";
import toast from "react-hot-toast";
import DOMPurify from "dompurify";
import {
  FaStar,
  FaRegStar,
  FaShoppingCart,
  FaHeart,
  FaShare,
  FaChevronDown,
  FaChevronUp,
  FaUpload,
  FaReply,
  FaTrash,
} from "react-icons/fa";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const product = useSelector(selectProduct);
  const status = useSelector(selectProductsStatus);
  const error = useSelector(selectProductsError);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectAuthUser);
  const accessToken = useSelector((state) => state.auth.accessToken);
  const isAdmin = user?.role === "admin";

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    ingredients: true,
    faqs: false,
    reviews: false,
    quality: false,
  });
  const [ingredientsTab, setIngredientsTab] = useState("ingredients");
  const [reviewsTab, setReviewsTab] = useState("reviews");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewImageName, setReviewImageName] = useState("");
  const [reviewMediaFile, setReviewMediaFile] = useState(null);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    title: "",
    content: "",
    displayName: "",
    email: "",
  });
  const [questionForm, setQuestionForm] = useState({
    question: "",
    displayName: "",
    email: "",
  });
  const [adminAnswerDrafts, setAdminAnswerDrafts] = useState({});
  const [submittingAdminAnswerId, setSubmittingAdminAnswerId] = useState("");
  const [deletingAdminAnswerId, setDeletingAdminAnswerId] = useState("");
  const [deletingQuestionId, setDeletingQuestionId] = useState("");
  const API_URL = import.meta.env.VITE_API_URL || "/api";
  const SERVER_URL = API_URL.replace(/\/api\/?$/, "");

  const getWishlistItems = () => {
    try {
      const raw = localStorage.getItem("wishlistItems");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const saveWishlistItems = (items) => {
    localStorage.setItem("wishlistItems", JSON.stringify(items));
  };

  const getRecentlyViewedItems = () => {
    try {
      const raw = localStorage.getItem("recentlyViewedItems");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const saveRecentlyViewedItems = (items) => {
    localStorage.setItem("recentlyViewedItems", JSON.stringify(items));
  };

  const getPrimaryProductImage = (item) => {
    const rawImage =
      item?.image || item?.images?.[0]?.url || item?.images?.[0] || "";
    if (!rawImage) return "/placeholder-product.jpg";
    if (/^https?:\/\//i.test(rawImage)) return rawImage;
    if (rawImage.startsWith("/")) return `${SERVER_URL}${rawImage}`;
    return rawImage;
  };

  const directionsPoints =
    Array.isArray(product?.directions) && product.directions.length > 0
      ? product.directions
      : [];
  const briefDescriptionPoints = Array.isArray(product?.briefDescriptionPoints)
    ? product.briefDescriptionPoints
        .map((point) => String(point).trim())
        .filter(Boolean)
    : (product?.briefDescription || "")
        .split(/\r?\n/)
        .map((point) => point.trim())
        .filter(Boolean);

  const helpsToPoints = (product?.helpsTo || "")
    .split(/\r?\n/)
    .map((point) => point.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);

  const ingredientsRows = Array.isArray(product?.ingredients)
    ? product.ingredients
        .map((item) => ({
          name: String(item?.name || "").trim(),
          amount: String(item?.amount || "").trim(),
        }))
        .filter((item) => item.name || item.amount)
    : [];

  const servingSizeText = (product?.servingSize || "").trim();
  const instructionsParagraph = (product?.instructionsContent || "").trim();
  const sanitizedFaqContent = DOMPurify.sanitize(product?.faqContent || "");
  const qualityPromiseParagraph = (product?.qualityPromiseContent || "").trim();
  const reviewItems = Array.isArray(product?.reviews) ? product.reviews : [];
  const questionItems = Array.isArray(product?.questions)
    ? product.questions
    : [];
  const sortedReviews = [...reviewItems].sort(
    (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0),
  );
  const sortedQuestions = [...questionItems].sort(
    (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0),
  );
  const reviewCount = sortedReviews.length;
  const questionCount = sortedQuestions.length;
  const averageReviewRating = reviewCount
    ? sortedReviews.reduce((sum, item) => sum + Number(item?.rating || 0), 0) /
      reviewCount
    : 0;

  const formatReviewDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  const parseReviewContent = (value = "") => {
    const normalizedLines = String(value)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (normalizedLines.length > 1) {
      return {
        title: normalizedLines[0],
        body: normalizedLines.slice(1).join(" "),
      };
    }

    const singleLine = normalizedLines[0] || "";
    return {
      title: singleLine.split(/[.!?]/)[0]?.trim() || "Review",
      body: singleLine,
    };
  };

  const handleReviewFieldChange = (field, value) => {
    setReviewForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleReviewImageChange = (e) => {
    const file = e.target.files?.[0];
    setReviewMediaFile(file || null);
    setReviewImageName(file ? file.name : "");
  };

  const resetReviewForm = () => {
    setReviewForm({
      rating: 0,
      title: "",
      content: "",
      displayName: user?.name || "",
      email: user?.email || "",
    });
    setReviewImageName("");
    setReviewMediaFile(null);
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      question: "",
      displayName: user?.name || "",
      email: user?.email || "",
    });
  };

  const openReviewForm = () => {
    if (isAdmin) {
      toast.error("Admin accounts cannot submit reviews");
      return;
    }

    if (!isAuthenticated) {
      toast.error("Please login to write a review");
      navigate("/login");
      return;
    }

    setExpandedSections((prev) => ({ ...prev, reviews: true }));
    setReviewsTab("reviews");
    setShowReviewForm(true);
    setShowQuestionForm(false);
    setReviewForm((prev) => ({
      ...prev,
      displayName: prev.displayName || user?.name || "",
      email: prev.email || user?.email || "",
    }));
  };

  const openQuestionForm = () => {
    if (isAdmin) {
      toast.error("Admin accounts cannot submit questions");
      return;
    }

    if (!isAuthenticated) {
      toast.error("Please login to ask a question");
      navigate("/login");
      return;
    }

    setExpandedSections((prev) => ({ ...prev, reviews: true }));
    setReviewsTab("questions");
    setShowQuestionForm(true);
    setShowReviewForm(false);
    setQuestionForm((prev) => ({
      ...prev,
      displayName: prev.displayName || user?.name || "",
      email: prev.email || user?.email || "",
    }));
  };

  const handleQuestionFieldChange = (field, value) => {
    setQuestionForm((prev) => ({ ...prev, [field]: value }));
  };

  const getAuthToken = () => {
    if (accessToken) {
      return accessToken;
    }

    const rawToken = localStorage.getItem("accessToken");
    if (!rawToken) return null;

    try {
      return JSON.parse(rawToken);
    } catch {
      return rawToken;
    }
  };

  const getEntityId = (entity) => entity?._id || entity?.id || "";

  const handleAdminAnswerDraftChange = (questionId, value) => {
    setAdminAnswerDrafts((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleAdminAnswerQuestion = async (questionId) => {
    const answer = (adminAnswerDrafts[questionId] || "").trim();
    if (!answer) {
      toast.error("Please write an answer first.");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error("Admin session expired. Please login again.");
      navigate("/login");
      return;
    }

    try {
      setSubmittingAdminAnswerId(questionId);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "/api"}/products/${id}/questions/${questionId}/answer`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ answer }),
        },
      );

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || "Failed to save answer.");
      }

      toast.success("Answer saved successfully.");
      dispatch(fetchProduct(id));
    } catch (submitError) {
      toast.error(submitError.message || "Failed to save answer.");
    } finally {
      setSubmittingAdminAnswerId("");
    }
  };

  const handleAdminDeleteAnswer = async (questionId) => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Admin session expired. Please login again.");
      navigate("/login");
      return;
    }

    try {
      setDeletingAdminAnswerId(questionId);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "/api"}/products/${id}/questions/${questionId}/answer`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || "Failed to delete answer.");
      }

      setAdminAnswerDrafts((prev) => ({
        ...prev,
        [questionId]: "",
      }));
      toast.success("Reply deleted successfully.");
      dispatch(fetchProduct(id));
    } catch (submitError) {
      toast.error(submitError.message || "Failed to delete answer.");
    } finally {
      setDeletingAdminAnswerId("");
    }
  };

  const handleAdminDeleteQuestion = async (questionId) => {
    if (!window.confirm("Delete this user question?")) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error("Admin session expired. Please login again.");
      navigate("/login");
      return;
    }

    try {
      setDeletingQuestionId(questionId);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "/api"}/products/${id}/questions/${questionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || "Failed to delete question.");
      }

      toast.success("Question deleted successfully.");
      dispatch(fetchProduct(id));
    } catch (submitError) {
      toast.error(submitError.message || "Failed to delete question.");
    } finally {
      setDeletingQuestionId("");
    }
  };

  const uploadReviewMedia = async (file, token) => {
    const formData = new FormData();
    const isVideo = file.type.startsWith("video/");
    formData.append(isVideo ? "video" : "image", file);

    const endpoint = isVideo ? "/upload/video" : "/upload";
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || "/api"}${endpoint}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      },
    );

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result?.error || "Failed to upload review media.");
    }

    return {
      ...result.data,
      mediaType: isVideo ? "video" : "image",
    };
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error("Please login to submit a review");
      navigate("/login");
      return;
    }

    if (!reviewForm.rating) {
      toast.error("Please select a rating.");
      return;
    }

    if (!reviewForm.title.trim()) {
      toast.error("Please add a review title.");
      return;
    }

    if (!reviewForm.content.trim()) {
      toast.error("Please add your review content.");
      return;
    }

    const rawToken = localStorage.getItem("accessToken");
    const token = rawToken ? JSON.parse(rawToken) : null;

    if (!token) {
      toast.error("Please login to submit a review");
      navigate("/login");
      return;
    }

    setSubmittingReview(true);

    try {
      let uploadedMedia;
      if (reviewMediaFile) {
        uploadedMedia = await uploadReviewMedia(reviewMediaFile, token);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "/api"}/products/${id}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating: reviewForm.rating,
            title: reviewForm.title.trim(),
            comment: reviewForm.content.trim(),
            displayName: reviewForm.displayName.trim(),
            email: reviewForm.email.trim(),
            media: uploadedMedia,
          }),
        },
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.error || "Failed to submit review.");
      }

      toast.success("Review submitted successfully.");
      resetReviewForm();
      setShowReviewForm(false);
      dispatch(fetchProduct(id));
    } catch (submitError) {
      toast.error(submitError.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error("Please login to submit a question");
      navigate("/login");
      return;
    }

    if (!questionForm.question.trim()) {
      toast.error("Please add your question.");
      return;
    }

    const rawToken = localStorage.getItem("accessToken");
    const token = rawToken ? JSON.parse(rawToken) : null;

    if (!token) {
      toast.error("Please login to submit a question");
      navigate("/login");
      return;
    }

    setSubmittingQuestion(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "/api"}/products/${id}/questions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            question: questionForm.question.trim(),
            displayName: questionForm.displayName.trim(),
            email: questionForm.email.trim(),
          }),
        },
      );

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || "Failed to submit question.");
      }

      toast.success("Question submitted successfully.");
      resetQuestionForm();
      setShowQuestionForm(false);
      dispatch(fetchProduct(id));
    } catch (submitError) {
      toast.error(submitError.message || "Failed to submit question.");
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  useEffect(() => {
    if (id) {
      dispatch(fetchProduct(id));
      trackProductView(id);
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (product) {
      setSelectedImage(0);
    }
  }, [product]);

  useEffect(() => {
    if (!product?._id) return;

    const recentlyViewed = getRecentlyViewedItems().filter(
      (item) => String(item?._id) !== String(product._id),
    );

    const nextItems = [
      {
        _id: product._id,
        name: product.name,
        price: product.price,
        image: getPrimaryProductImage(product),
        category: product.category,
        viewedAt: new Date().toISOString(),
      },
      ...recentlyViewed,
    ].slice(0, 8);

    saveRecentlyViewedItems(nextItems);
  }, [product?._id]);

  useEffect(() => {
    if (!product?._id) {
      setIsWishlisted(false);
      return;
    }

    const wishlistItems = getWishlistItems();
    setIsWishlisted(
      wishlistItems.some((item) => String(item?._id) === String(product._id)),
    );
  }, [product?._id]);

  useEffect(() => {
    setReviewForm((prev) => ({
      ...prev,
      displayName: user?.name || prev.displayName,
      email: user?.email || prev.email,
    }));
    setQuestionForm((prev) => ({
      ...prev,
      displayName: user?.name || prev.displayName,
      email: user?.email || prev.email,
    }));
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return;

    setReviewsTab("questions");
    setAdminAnswerDrafts((prev) => {
      const next = { ...prev };
      sortedQuestions.forEach((question) => {
        const questionId = getEntityId(question);
        if (!questionId) return;

        if (!(questionId in next) || next[questionId] === "") {
          next[questionId] = question?.answer || "";
        }
      });
      return next;
    });
  }, [isAdmin, sortedQuestions]);

  const handleAddToCart = () => {
    if (isAdmin) {
      toast.error("Admin accounts cannot add products to cart");
      return;
    }

    dispatch(
      addToCart({
        product,
        quantity,
      }),
    );

    trackAddToCart(product._id);
    toast.success(`${product.name} added to cart!`);
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleToggleWishlist = () => {
    if (!product?._id) return;

    const wishlistItems = getWishlistItems();
    const existingIndex = wishlistItems.findIndex(
      (item) => String(item?._id) === String(product._id),
    );

    if (existingIndex !== -1) {
      wishlistItems.splice(existingIndex, 1);
      saveWishlistItems(wishlistItems);
      setIsWishlisted(false);
      toast.success("Removed from wishlist");
      return;
    }

    const wishlistProduct = {
      _id: product._id,
      name: product.name,
      price: product.price,
      image: getPrimaryProductImage(product),
      category: product.category,
    };

    saveWishlistItems([wishlistProduct, ...wishlistItems]);
    setIsWishlisted(true);
    toast.success("Added to wishlist");
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<FaStar key="half" className="text-yellow-400" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-gray-300" />);
    }

    return stars;
  };

  if (status === "loading") {
    return <Loader />;
  }

  if (status === "failed") {
    return (
      <div className="container mx-auto px-4 pt-14 pb-8">
        <div className="text-center text-red-600">
          <p>Error loading product: {error}</p>
          <button
            onClick={() => dispatch(fetchProduct(id))}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 pt-14 pb-8">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Product not found</p>
          <button
            onClick={() => navigate("/products")}
            className="mt-4 bg-[#68a300] text-white px-4 py-2 rounded hover:bg-[#5f9600]"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-14 pb-8">
      <div className="mx-auto w-full lg:w-[70%]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={
                  product.image
                    ? resolveMediaUrl(product.image)
                    : resolveMediaUrl(product.images?.[selectedImage]?.url)
                }
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Images */}
            {product.images && product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden ${
                      selectedImage === index
                        ? "border-green-500"
                        : "border-gray-200"
                    }`}
                  >
                    <img
                      src={image.url || image || "/placeholder-product.jpg"}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                {product.name}
              </h1>
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex">
                  {renderStars(product.averageRating || 0)}
                </div>
                <span className="text-gray-600">
                  ({product.reviews?.length || 0} reviews)
                </span>
              </div>

              <div className="text-2xl mb-4">${product.price?.toFixed(2)}</div>

              {product.helpsTo && (
                <div className="mb-6 rounded-lg border border-green-100 bg-green-50 px-4 py-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-green-800">
                    Helps To
                  </h2>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-green-900">
                    {helpsToPoints.map((point, index) => (
                      <li key={`${point}-${index}`}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center space-x-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  product.stock > 10
                    ? "bg-green-100 text-green-800"
                    : product.stock > 0
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {product.stock > 10
                  ? "In Stock"
                  : product.stock > 0
                    ? `Only ${product.stock} left`
                    : "Out of Stock"}
              </span>
            </div>

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="flex items-center space-x-4">
                <span className="font-medium">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 border-x border-gray-300">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.stock}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0 || isAdmin}
                className="flex-1 bg-[#68a300] text-white px-6 py-3 rounded-lg hover:bg-[#5f9600] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <FaShoppingCart />
                <span>Add to Cart</span>
              </button>

              <button
                onClick={handleToggleWishlist}
                className={`p-3 rounded-lg border ${
                  isWishlisted
                    ? "bg-red-50 border-red-200 text-red-600"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <FaHeart className={isWishlisted ? "fill-current" : ""} />
              </button>

              <button
                onClick={handleShare}
                className="p-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                <FaShare />
              </button>
            </div>

            {/* Product Details */}
            <div className="border-t pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Category:</span>
                  <p className="capitalize">{product.category}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">SKU:</span>
                  <p>{product.sku || "N/A"}</p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Product Details
                </h4>
                {briefDescriptionPoints.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
                    {briefDescriptionPoints.map((point, index) => (
                      <li key={`brief-point-${index}`}>{point}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-gray-600">
                    {product.description || "N/A"}
                  </p>
                )}
              </div>

              {directionsPoints.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                    Directions
                  </h4>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-600">
                    {directionsPoints.map((step, index) => (
                      <li key={`dir-${index}`}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="mt-6 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => toggleSection("ingredients")}
                  className="flex w-full items-center justify-between border-0 py-2 text-left focus:outline-none"
                >
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                    Ingredients
                  </h4>
                  {expandedSections.ingredients ? (
                    <FaChevronUp className="text-gray-500" />
                  ) : (
                    <FaChevronDown className="text-gray-500" />
                  )}
                </button>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${expandedSections.ingredients ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                >
                  <div className="overflow-hidden">
                    <div className="mt-3 border border-gray-200 bg-white">
                      <div className="grid grid-cols-2 bg-gray-50">
                        <button
                          type="button"
                          onClick={() => setIngredientsTab("ingredients")}
                          className={`group relative border-0 px-4 py-3 text-center text-sm font-semibold transition-colors focus:outline-none ${
                            ingredientsTab === "ingredients"
                              ? "text-gray-900"
                              : "text-gray-500 hover:text-gray-900"
                          }`}
                        >
                          Ingredients
                          <span
                            className={`absolute bottom-0 left-0 h-0.5 bg-gray-900 transition-all duration-300 ${
                              ingredientsTab === "ingredients"
                                ? "w-full"
                                : "w-0"
                            }`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIngredientsTab("instructions")}
                          className={`group relative border-0 px-4 py-3 text-center text-sm font-semibold transition-colors focus:outline-none ${
                            ingredientsTab === "instructions"
                              ? "text-gray-900"
                              : "text-gray-500 hover:text-gray-900"
                          }`}
                        >
                          Instructions
                          <span
                            className={`absolute bottom-0 left-0 h-0.5 bg-gray-900 transition-all duration-300 ${
                              ingredientsTab === "instructions"
                                ? "w-full"
                                : "w-0"
                            }`}
                          />
                        </button>
                      </div>

                      <div className="px-6 py-5 text-sm text-gray-700">
                        {ingredientsTab === "ingredients" ? (
                          <>
                            {servingSizeText ? (
                              <p className="mb-4 text-center font-medium">
                                Serving Size: {servingSizeText}
                              </p>
                            ) : null}
                            {ingredientsRows.length > 0 ? (
                              <div className="space-y-3">
                                {ingredientsRows.map((row, index) => (
                                  <div
                                    key={`ingredient-row-${index}`}
                                    className="flex items-center justify-between border-b border-gray-100 pb-3"
                                  >
                                    <span>{row.name || "-"}</span>
                                    <span className="font-medium">
                                      {row.amount || "-"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-center text-gray-500">
                                Ingredients not added yet.
                              </p>
                            )}
                          </>
                        ) : (
                          <div className="space-y-2">
                            {instructionsParagraph ? (
                              <p className="whitespace-pre-line leading-6 text-gray-700">
                                {instructionsParagraph}
                              </p>
                            ) : (
                              <p>No instructions added for this product yet.</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => toggleSection("faqs")}
                    className="flex w-full items-center justify-between border-0 py-4 text-left focus:outline-none"
                  >
                    <span className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                      FAQs
                    </span>
                    {expandedSections.faqs ? (
                      <FaChevronUp className="text-gray-500" />
                    ) : (
                      <FaChevronDown className="text-gray-500" />
                    )}
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${expandedSections.faqs ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                  >
                    <div className="overflow-hidden">
                      <div className="pb-4 text-sm text-gray-600">
                        {sanitizedFaqContent ? (
                          <div
                            className="prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2"
                            dangerouslySetInnerHTML={{
                              __html: sanitizedFaqContent,
                            }}
                          />
                        ) : (
                          <p>
                            Frequently asked questions will be available soon.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => toggleSection("reviews")}
                    className="flex w-full items-center justify-between border-0 py-4 text-left focus:outline-none"
                  >
                    <span className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                      Customer Reviews
                    </span>
                    {expandedSections.reviews ? (
                      <FaChevronUp className="text-gray-500" />
                    ) : (
                      <FaChevronDown className="text-gray-500" />
                    )}
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${expandedSections.reviews ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                  >
                    <div className="overflow-hidden">
                      <div className="pb-4 border-t border-gray-200 pt-6">
                        <div className="text-center">
                          <h4 className="text-4xl font-semibold text-gray-800">
                            Customer Reviews
                          </h4>
                          <div className="mt-2 flex items-center justify-center gap-2 text-gray-700">
                            <div className="flex">
                              {renderStars(averageReviewRating)}
                            </div>
                            <span>
                              {averageReviewRating.toFixed(2)} out of 5
                            </span>
                          </div>
                          <p className="mt-1 text-gray-600">
                            Based on {reviewCount} review
                            {reviewCount === 1 ? "" : "s"}
                          </p>

                          {!isAdmin ? (
                            <div className="mx-auto mt-6 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
                              <button
                                type="button"
                                onClick={openReviewForm}
                                className="bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-black"
                              >
                                Write a review
                              </button>
                              <button
                                type="button"
                                onClick={openQuestionForm}
                                className="border border-gray-400 bg-white px-6 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                              >
                                Ask a question
                              </button>
                            </div>
                          ) : (
                            <p className="mx-auto mt-6 max-w-2xl rounded border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800">
                              Admin moderation mode: open the Questions tab
                              below to answer customer questions.
                            </p>
                          )}
                        </div>

                        {showReviewForm && (
                          <form
                            className="mt-8 border-t border-gray-200 pt-6"
                            onSubmit={handleSubmitReview}
                          >
                            <h5 className="text-center text-3xl font-semibold text-gray-800">
                              Write a review
                            </h5>

                            <div className="mt-6">
                              <label className="block text-xs font-medium uppercase tracking-wide text-gray-600">
                                Rating
                              </label>
                              <div className="mt-3 flex items-center justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={`select-star-${star}`}
                                    type="button"
                                    onClick={() =>
                                      handleReviewFieldChange("rating", star)
                                    }
                                    className="text-2xl"
                                  >
                                    {star <= reviewForm.rating ? (
                                      <FaStar className="text-yellow-400" />
                                    ) : (
                                      <FaRegStar className="text-gray-400" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="mt-6">
                              <label
                                htmlFor="reviewTitle"
                                className="block text-center text-xs font-medium uppercase tracking-wide text-gray-600"
                              >
                                Review Title{" "}
                                <span className="text-gray-400">(100)</span>
                              </label>
                              <input
                                id="reviewTitle"
                                type="text"
                                maxLength={100}
                                value={reviewForm.title}
                                onChange={(e) =>
                                  handleReviewFieldChange(
                                    "title",
                                    e.target.value,
                                  )
                                }
                                className="mt-3 block w-full border border-gray-300 px-3 py-2 text-sm text-gray-700"
                                placeholder="Give your review a title"
                              />
                            </div>

                            <div className="mt-6">
                              <label
                                htmlFor="reviewContent"
                                className="block text-center text-xs font-medium uppercase tracking-wide text-gray-600"
                              >
                                Review Content
                              </label>
                              <textarea
                                id="reviewContent"
                                rows="5"
                                value={reviewForm.content}
                                onChange={(e) =>
                                  handleReviewFieldChange(
                                    "content",
                                    e.target.value,
                                  )
                                }
                                className="mt-3 block w-full border border-gray-300 px-3 py-2 text-sm text-gray-700"
                                placeholder="Start writing here..."
                              />
                            </div>

                            <div className="mt-6">
                              <label className="block text-xs font-medium uppercase tracking-wide text-gray-600">
                                Picture/Video (Optional)
                              </label>
                              <label className="mt-3 flex h-28 w-28 cursor-pointer items-center justify-center border border-gray-300 text-gray-500 hover:bg-gray-50">
                                <input
                                  type="file"
                                  accept="image/*,video/*"
                                  className="hidden"
                                  onChange={handleReviewImageChange}
                                />
                                <FaUpload className="text-3xl" />
                              </label>
                              {reviewImageName ? (
                                <p className="mt-2 text-xs text-gray-500">
                                  Selected: {reviewImageName}
                                </p>
                              ) : null}
                            </div>

                            <div className="mt-6">
                              <label
                                htmlFor="displayName"
                                className="block text-xs font-medium uppercase tracking-wide text-gray-600"
                              >
                                Display Name{" "}
                                <span className="normal-case text-gray-400">
                                  (displayed publicly)
                                </span>
                              </label>
                              <input
                                id="displayName"
                                type="text"
                                value={reviewForm.displayName}
                                onChange={(e) =>
                                  handleReviewFieldChange(
                                    "displayName",
                                    e.target.value,
                                  )
                                }
                                className="mt-3 block w-full border border-gray-300 px-3 py-2 text-sm text-gray-700"
                                placeholder="Display name"
                              />
                            </div>

                            <div className="mt-6">
                              <label
                                htmlFor="reviewEmail"
                                className="block text-xs font-medium uppercase tracking-wide text-gray-600"
                              >
                                Email Address
                              </label>
                              <input
                                id="reviewEmail"
                                type="email"
                                value={reviewForm.email}
                                onChange={(e) =>
                                  handleReviewFieldChange(
                                    "email",
                                    e.target.value,
                                  )
                                }
                                className="mt-3 block w-full border border-gray-300 px-3 py-2 text-sm text-gray-700"
                                placeholder="Your email address"
                              />
                            </div>

                            <p className="mt-6 text-center text-xs leading-5 text-gray-500">
                              How we use your data: We&apos;ll only contact you
                              about the review you left, and only if necessary.
                              By submitting your review, you agree to our terms,
                              privacy and content policies.
                            </p>

                            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                              <button
                                type="button"
                                onClick={() => {
                                  resetReviewForm();
                                  setShowReviewForm(false);
                                }}
                                className="border border-gray-800 px-6 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                              >
                                Cancel review
                              </button>
                              <button
                                type="submit"
                                disabled={submittingReview}
                                className="bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
                              >
                                {submittingReview
                                  ? "Submitting..."
                                  : "Submit Review"}
                              </button>
                            </div>
                          </form>
                        )}

                        {showQuestionForm && (
                          <form
                            className="mt-8 border-t border-gray-200 pt-6"
                            onSubmit={handleSubmitQuestion}
                          >
                            <h5 className="text-center text-3xl font-semibold text-gray-800">
                              Ask a question
                            </h5>

                            <div className="mt-6">
                              <label
                                htmlFor="questionDisplayName"
                                className="block text-xs font-medium uppercase tracking-wide text-gray-600"
                              >
                                Display Name
                              </label>
                              <input
                                id="questionDisplayName"
                                type="text"
                                value={questionForm.displayName}
                                onChange={(e) =>
                                  handleQuestionFieldChange(
                                    "displayName",
                                    e.target.value,
                                  )
                                }
                                className="mt-3 block w-full border border-gray-300 px-3 py-2 text-sm text-gray-700"
                                placeholder="Display name"
                              />
                            </div>

                            <div className="mt-6">
                              <label
                                htmlFor="questionEmail"
                                className="block text-xs font-medium uppercase tracking-wide text-gray-600"
                              >
                                Email Address
                              </label>
                              <input
                                id="questionEmail"
                                type="email"
                                value={questionForm.email}
                                onChange={(e) =>
                                  handleQuestionFieldChange(
                                    "email",
                                    e.target.value,
                                  )
                                }
                                className="mt-3 block w-full border border-gray-300 px-3 py-2 text-sm text-gray-700"
                                placeholder="Your email address"
                              />
                            </div>

                            <div className="mt-6">
                              <label
                                htmlFor="questionContent"
                                className="block text-center text-xs font-medium uppercase tracking-wide text-gray-600"
                              >
                                Your Question
                              </label>
                              <textarea
                                id="questionContent"
                                rows="5"
                                value={questionForm.question}
                                onChange={(e) =>
                                  handleQuestionFieldChange(
                                    "question",
                                    e.target.value,
                                  )
                                }
                                className="mt-3 block w-full border border-gray-300 px-3 py-2 text-sm text-gray-700"
                                placeholder="Start writing here..."
                              />
                            </div>

                            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                              <button
                                type="button"
                                onClick={() => {
                                  resetQuestionForm();
                                  setShowQuestionForm(false);
                                }}
                                className="border border-gray-800 px-6 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                              >
                                Cancel question
                              </button>
                              <button
                                type="submit"
                                disabled={submittingQuestion}
                                className="bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
                              >
                                {submittingQuestion
                                  ? "Submitting..."
                                  : "Submit Question"}
                              </button>
                            </div>
                          </form>
                        )}

                        <div className="mt-8 border-y border-gray-200 py-2">
                          <button
                            type="button"
                            onClick={() => setReviewsTab("reviews")}
                            className={`mr-3 px-4 py-2 text-sm ${
                              reviewsTab === "reviews"
                                ? "bg-gray-200 text-gray-900"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            Reviews ({reviewCount})
                          </button>
                          <button
                            type="button"
                            onClick={() => setReviewsTab("questions")}
                            className={`px-4 py-2 text-sm underline ${
                              reviewsTab === "questions"
                                ? "bg-gray-200 text-gray-900 no-underline"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            Questions ({questionCount})
                          </button>
                        </div>

                        {reviewsTab === "reviews" ? (
                          <div className="mt-6">
                            <p className="mb-4 text-sm text-gray-700">
                              Most Recent
                            </p>
                            <div className="space-y-6">
                              {sortedReviews.length > 0 ? (
                                sortedReviews.map((review, index) => {
                                  const rawComment = String(
                                    review?.comment || "",
                                  ).trim();
                                  const parsedReview = parseReviewContent(
                                    review?.title
                                      ? `${review.title}\n${rawComment}`
                                      : rawComment,
                                  );

                                  return (
                                    <div
                                      key={review?._id || `review-${index}`}
                                      className="border-t border-gray-200 pt-4"
                                    >
                                      <div className="mb-2 flex items-center justify-between">
                                        <div className="flex">
                                          {renderStars(review?.rating || 0)}
                                        </div>
                                        <span className="text-xs text-gray-500">
                                          {formatReviewDate(review?.createdAt)}
                                        </span>
                                      </div>

                                      <div className="mb-2 flex items-center gap-3 text-sm text-gray-700">
                                        <span>
                                          {review?.displayName ||
                                            review?.user?.name ||
                                            "Anonymous"}
                                        </span>
                                        <span className="bg-gray-800 px-2 py-0.5 text-xs font-semibold text-white">
                                          Verified
                                        </span>
                                      </div>

                                      <p className="font-semibold text-gray-800">
                                        {parsedReview.title}
                                      </p>
                                      <p className="mt-1 whitespace-pre-line text-gray-700">
                                        {parsedReview.body || rawComment}
                                      </p>
                                      {review?.media?.url ? (
                                        review?.media?.mediaType === "video" ? (
                                          <video
                                            className="mt-3 max-h-64 w-full rounded border border-gray-200"
                                            controls
                                            src={`${SERVER_URL}${review.media.url}`}
                                          />
                                        ) : (
                                          <img
                                            className="mt-3 max-h-64 rounded border border-gray-200"
                                            src={`${SERVER_URL}${review.media.url}`}
                                            alt={parsedReview.title}
                                          />
                                        )
                                      ) : null}
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-sm text-gray-600">
                                  No customer reviews yet.
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-6 space-y-6">
                            {sortedQuestions.length > 0 ? (
                              sortedQuestions.map((question, index) => {
                                const questionId = getEntityId(question);
                                return (
                                  <div
                                    key={questionId || `question-${index}`}
                                    className="border-t border-gray-200 pt-4"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-500">
                                        {formatReviewDate(question?.createdAt)}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">
                                      {question?.displayName ||
                                        question?.user?.name ||
                                        "Anonymous"}
                                    </p>
                                    <p className="mt-2 whitespace-pre-line text-gray-700">
                                      {question?.question}
                                    </p>
                                    {question?.isAnswered &&
                                    question?.answer ? (
                                      <div className="mt-3 rounded bg-gray-50 p-3">
                                        <p className="text-xs tracking-wide text-black">
                                          <span className="font-bold">
                                            &gt;&gt; Naashpati
                                          </span>{" "}
                                          replied:
                                        </p>
                                        <p className="mt-1 text-sm text-gray-700">
                                          {question.answer}
                                        </p>
                                      </div>
                                    ) : null}

                                    {isAdmin ? (
                                      <div className="mt-3 rounded border border-gray-200 bg-white p-3">
                                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                          Admin Reply
                                        </label>
                                        <textarea
                                          rows="3"
                                          value={
                                            adminAnswerDrafts[questionId] || ""
                                          }
                                          onChange={(e) =>
                                            handleAdminAnswerDraftChange(
                                              questionId,
                                              e.target.value,
                                            )
                                          }
                                          className="mt-2 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-700"
                                          placeholder="Write an answer for this question"
                                        />
                                        <div className="mt-3 flex justify-end">
                                          <div className="flex flex-wrap items-center justify-end gap-2">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleAdminDeleteQuestion(
                                                  questionId,
                                                )
                                              }
                                              disabled={
                                                deletingQuestionId ===
                                                questionId
                                              }
                                              className="inline-flex items-center gap-2 rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                                            >
                                              <FaTrash />
                                              {deletingQuestionId === questionId
                                                ? "Deleting question..."
                                                : "Delete Question"}
                                            </button>

                                            {question?.isAnswered ? (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleAdminDeleteAnswer(
                                                    questionId,
                                                  )
                                                }
                                                disabled={
                                                  deletingAdminAnswerId ===
                                                  questionId
                                                }
                                                className="inline-flex items-center gap-2 rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                                              >
                                                <FaTrash />
                                                {deletingAdminAnswerId ===
                                                questionId
                                                  ? "Deleting reply..."
                                                  : "Delete Reply"}
                                              </button>
                                            ) : null}

                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleAdminAnswerQuestion(
                                                  questionId,
                                                )
                                              }
                                              disabled={
                                                submittingAdminAnswerId ===
                                                questionId
                                              }
                                              className="inline-flex items-center gap-2 rounded bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
                                            >
                                              <FaReply />
                                              {submittingAdminAnswerId ===
                                              questionId
                                                ? "Saving..."
                                                : question?.isAnswered
                                                  ? "Update Answer"
                                                  : "Save Answer"}
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-sm text-gray-600">
                                No questions yet.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-b border-gray-200">
                  <button
                    type="button"
                    onClick={() => toggleSection("quality")}
                    className="flex w-full items-center justify-between border-0 py-4 text-left focus:outline-none"
                  >
                    <span className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                      Our Quality Promise
                    </span>
                    {expandedSections.quality ? (
                      <FaChevronUp className="text-gray-500" />
                    ) : (
                      <FaChevronDown className="text-gray-500" />
                    )}
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${expandedSections.quality ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                  >
                    <div className="overflow-hidden">
                      <div className="pb-4 text-sm text-gray-600">
                        {qualityPromiseParagraph ||
                          "Every batch is produced with strict quality checks for purity, consistency, and safety."}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
