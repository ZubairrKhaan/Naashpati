// Helper to resolve image/media URLs (handles absolute and relative paths)
const resolveMediaUrl = (url) => {
  if (!url) return "/placeholder-product.jpg";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/uploads/")) return `${API_ORIGIN}${url}`;
  return url;
};
import { useCallback, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  selectAuthChecked,
  selectAuthUser,
  selectIsAuthenticated,
} from "../store/slices/authSlice";
import {
  fetchCategories,
  fetchProducts,
  selectProducts,
  selectCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  deleteProduct,
} from "../store/slices/productSlice";
import {
  getOrders,
  selectOrders,
  updateOrderStatus,
} from "../store/slices/orderSlice";
import { getUsers, selectAllUsers } from "../store/slices/userSlice";
import Loader from "../components/Loader";
import toast from "react-hot-toast";
import CreateProduct from "./admin/CreateProduct";
import EditProduct from "./admin/EditProduct";
import {
  FaChartLine,
  FaShoppingCart,
  FaUsers,
  FaBox,
  FaDollarSign,
  FaEye,
  FaEdit,
  FaCopy,
  FaTrash,
  FaPlus,
  FaCheck,
  FaTimes,
  FaBullhorn,
  FaImage,
  FaVideo,
  FaChevronDown,
} from "react-icons/fa";
import { FaFileExcel } from "react-icons/fa";
import {
  exportToExcel,
  formatProductsForExport,
  formatOrdersForExport,
  formatUsersForExport,
  formatCategoriesForExport,
} from "../utils/exportToExcel";
import {
  fetchAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  selectAllAnnouncements,
} from "../store/slices/announcementSlice";
import {
  fetchAllHeroSlides,
  createHeroSlide,
  deleteHeroSlide,
  selectAllHeroSlides,
} from "../store/slices/heroSlideSlice";
import {
  fetchHeroBadges,
  updateHeroBadges,
  updateHeroGenderImages,
  selectHeroBadges,
  selectHeroGenderImages,
} from "../store/slices/heroBadgeSlice";
import {
  fetchAllProductBanners,
  createProductBanner,
  deleteProductBanner,
  selectAllProductBanners,
} from "../store/slices/productBannerSlice";
import {
  fetchAllSaleOffers,
  createSaleOffer,
  deleteSaleOffer,
  selectAllSaleOffers,
} from "../store/slices/saleOfferSlice";

const LENSES_PRODUCTS_SECTION = "lenses-products";

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authChecked = useSelector(selectAuthChecked);
  const user = useSelector(selectAuthUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const products = useSelector(selectProducts);
  const categories = useSelector(selectCategories);
  const orders = useSelector(selectOrders);
  const users = useSelector(selectAllUsers);
  const productPagination = useSelector((state) => state.products.pagination);
  const orderPagination = useSelector((state) => state.orders.pagination);
  const userPagination = useSelector((state) => state.users.pagination);
  const heroSlides = useSelector(selectAllHeroSlides);
  const heroBadgeImages = useSelector(selectHeroBadges);
  const heroGenderImages = useSelector(selectHeroGenderImages);
  const productBanners = useSelector(selectAllProductBanners);
  const saleOffers = useSelector(selectAllSaleOffers);

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [activeProductCategory, setActiveProductCategory] = useState("all");
  const [productCategoriesOpen, setProductCategoriesOpen] = useState(false);
  const [addProductCategory, setAddProductCategory] = useState("");
  const [addProductIsLenses, setAddProductIsLenses] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });
  const [categoryImageFile, setCategoryImageFile] = useState(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState(null);
  const [uploadingCategoryImage, setUploadingCategoryImage] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryEditForm, setCategoryEditForm] = useState({
    name: "",
    description: "",
    image: "",
  });
  const [categoryEditImageFile, setCategoryEditImageFile] = useState(null);
  const [categoryEditImagePreview, setCategoryEditImagePreview] =
    useState("");
  const [savingCategoryEdit, setSavingCategoryEdit] = useState(false);
  const [productBannerForm, setProductBannerForm] = useState({
    displayOrder: 0,
  });
  const [productBannerImageFile, setProductBannerImageFile] = useState(null);
  const [productBannerImagePreview, setProductBannerImagePreview] =
    useState(null);
  const [uploadingProductBannerImage, setUploadingProductBannerImage] =
    useState(false);
  const [saleOfferForm, setSaleOfferForm] = useState({
    name: "",
    displayOrder: 0,
    productIds: [],
  });
  const [saleOfferBannerFile, setSaleOfferBannerFile] = useState(null);
  const [saleOfferBannerPreview, setSaleOfferBannerPreview] = useState(null);
  const [uploadingSaleOfferBanner, setUploadingSaleOfferBanner] =
    useState(false);
  const [heroForm, setHeroForm] = useState({
    displayOrder: 0,
  });
  const [heroImageFile, setHeroImageFile] = useState(null);
  const [heroImagePreview, setHeroImagePreview] = useState(null);
  const [heroBadgeImageFiles, setHeroBadgeImageFiles] = useState([]);
  const [heroBadgeImagePreviews, setHeroBadgeImagePreviews] = useState([]);
  const [updatingHeroBadges, setUpdatingHeroBadges] = useState(false);
  const [genderImageFiles, setGenderImageFiles] = useState({
    female: null,
    male: null,
  });
  const [genderImagePreviews, setGenderImagePreviews] = useState({
    female: "",
    male: "",
  });
  const [genderImageRemovals, setGenderImageRemovals] = useState({
    female: false,
    male: false,
  });
  const [savingGenderImages, setSavingGenderImages] = useState(false);
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);
  const [aboutVideoFile, setAboutVideoFile] = useState(null);
  const [aboutVideoPreview, setAboutVideoPreview] = useState("");
  const [aboutVideoUrl, setAboutVideoUrl] = useState("");
  const [uploadingAboutVideo, setUploadingAboutVideo] = useState(false);
  const [loadingAboutVideo, setLoadingAboutVideo] = useState(false);
  const [aboutSectionHeading, setAboutSectionHeading] = useState("");
  const [aboutSectionDescription, setAboutSectionDescription] = useState("");
  const [aboutSectionImages, setAboutSectionImages] = useState(["", "", ""]);
  const [aboutSectionImageFiles, setAboutSectionImageFiles] = useState([
    null,
    null,
    null,
  ]);
  const [aboutSectionImagePreviews, setAboutSectionImagePreviews] = useState([
    "",
    "",
    "",
  ]);
  const [savingAboutSection, setSavingAboutSection] = useState(false);
  const [scienceHeading, setScienceHeading] = useState("");
  const [scienceDescription, setScienceDescription] = useState("");
  const [scienceBadgeImages, setScienceBadgeImages] = useState([]);
  const [scienceBadgeImageFiles, setScienceBadgeImageFiles] = useState([]);
  const [scienceBadgeImagePreviews, setScienceBadgeImagePreviews] = useState(
    [],
  );
  const [scienceImage, setScienceImage] = useState("");
  const [scienceImageFile, setScienceImageFile] = useState(null);
  const [scienceImagePreview, setScienceImagePreview] = useState("");
  const [savingScienceSection, setSavingScienceSection] = useState(false);
  const [whyNutrifactorHeading, setWhyNutrifactorHeading] = useState("");
  const [whyNutrifactorDescription, setWhyNutrifactorDescription] =
    useState("");
  const [whyNutrifactorImage, setWhyNutrifactorImage] = useState("");
  const [whyNutrifactorImageFile, setWhyNutrifactorImageFile] = useState(null);
  const [whyNutrifactorImagePreview, setWhyNutrifactorImagePreview] =
    useState("");
  const [savingWhyNutrifactorSection, setSavingWhyNutrifactorSection] =
    useState(false);
  const [missionHeading, setMissionHeading] = useState("");
  const [missionDescription, setMissionDescription] = useState("");
  const [missionImage, setMissionImage] = useState("");
  const [missionImageFile, setMissionImageFile] = useState(null);
  const [missionImagePreview, setMissionImagePreview] = useState("");
  const [savingMissionSection, setSavingMissionSection] = useState(false);
  const [healthPriorityHeading, setHealthPriorityHeading] = useState("");
  const [healthPriorityItems, setHealthPriorityItems] = useState([
    { title: "", description: "" },
    { title: "", description: "" },
    { title: "", description: "" },
  ]);
  const [healthPriorityImages, setHealthPriorityImages] = useState([
    "",
    "",
    "",
    "",
  ]);
  const [healthPriorityImageFiles, setHealthPriorityImageFiles] = useState([
    null,
    null,
    null,
    null,
  ]);
  const [healthPriorityImagePreviews, setHealthPriorityImagePreviews] =
    useState(["", "", "", ""]);
  const [savingHealthPrioritySection, setSavingHealthPrioritySection] =
    useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamMemberImageFiles, setTeamMemberImageFiles] = useState([]);
  const [teamMemberImagePreviews, setTeamMemberImagePreviews] = useState([]);
  const [savingTeamMembers, setSavingTeamMembers] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    message: "",
    type: "info",
    isActive: true,
    startDate: "",
    endDate: "",
  });
  const [selectedBatchProductId, setSelectedBatchProductId] = useState("");
  const [productBatches, setProductBatches] = useState([]);
  const [batchStockTotal, setBatchStockTotal] = useState(0);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [creatingBatch, setCreatingBatch] = useState(false);
  const [batchForm, setBatchForm] = useState({
    batchNumber: "",
    quantity: "",
    costPrice: "",
    purchaseDate: "",
    expiryDate: "",
  });
  const announcements = useSelector(selectAllAnnouncements);
  const API_URL = import.meta.env.VITE_API_URL || "/api";
  const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");
  const adminManageableCategories = categories.filter((category) => {
    const value = String(category.value || "").trim().toLowerCase();
    return value !== "male-collection" && value !== "female-collection";
  });
  const selectedProductCategory = adminManageableCategories.find(
    (category) => category.value === activeProductCategory,
  );
  const visibleProducts =
    activeProductCategory === "all"
      ? products
      : activeProductCategory === LENSES_PRODUCTS_SECTION
        ? products.filter((product) => product.lenses)
      : products.filter((product) => product.category === activeProductCategory);
  const activeProductCategoryName =
    activeProductCategory === LENSES_PRODUCTS_SECTION
      ? "Lenses Products"
      : selectedProductCategory?.name || "All Products";
  const defaultFacilityHeading =
    "Pakistan's Largest Nutraceutical Manufacturing Facility";
  const defaultFacilityDescription =
    "With over a decade of experience, Naashpati specializes in manufacturing nutraceutical and natural healthcare products. Backed by modern laboratories, strict quality protocols, and scalable production systems, we continue to set standards in safety, consistency, and product innovation.";
  const defaultFacilityImages = [
    "/images/banners/hero_banner1.jpg",
    "/images/banners/hero_banner1.jpg",
    "/images/banners/hero_banner1.jpg",
  ];
  const defaultScienceHeading = "We Are Backed By Science";
  const defaultScienceDescription =
    "Naashpati delivers high-quality, safe products crafted under expert supervision and aligned with global standards. Committed to GMP, HACCP, ISO systems, and compliance-driven quality controls, we ensure excellence at every stage.";
  const defaultScienceBadgeImages = [];
  const defaultScienceImage = "";
  const defaultWhyNutrifactorHeading = "WHY NUTRIFACTOR!";
  const defaultWhyNutrifactorDescription =
    "Nutrifactor stands out from other nutraceutical brands due to our values of transparency and traceability in delivering high-quality natural healthcare products. Our commitment to excellence encompasses sustainable sourcing, integrity across all levels, and rigorous testing methods exceeding usual standard practices. We strive to bridge the gap between consumers and nutraceuticals science by being transparent in our labels. All the health benefits listed on our products are strictly in accordance with the scientific research.";
  const defaultWhyNutrifactorImage = "";
  const defaultMissionHeading = "Bridging Ancient Wisdom with Modern Wellness";
  const defaultMissionDescription =
    "For centuries, herbal traditions have guided communities toward balance and vitality. At Naashpati, we honour that heritage by making it accessible, transparent, and trustworthy for the modern world. From the highland farms of Morocco to the tropical forests of Sri Lanka, we trace every ingredient back to its origin and share that journey with you because you deserve to know exactly what you're putting in your body.";
  const defaultMissionImage = "";
  const defaultHealthPriorityHeading = "YOUR HEALTH, OUR PRIORITY";
  const defaultHealthPriorityItems = [
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
  const defaultHealthPriorityImages = ["", "", "", ""];

  const getDashboardProductsFetchParams = useCallback(
    (section = activeProductCategory) => ({
      page: 1,
      limit: 200,
      includeDraft: true,
      ...(section === LENSES_PRODUCTS_SECTION ? { lenses: true } : {}),
    }),
    [activeProductCategory],
  );

  const getAuthToken = () => {
    const rawToken = localStorage.getItem("accessToken");
    return rawToken ? JSON.parse(rawToken) : null;
  };

  const fetchProductBatches = async (productId) => {
    if (!productId) {
      setProductBatches([]);
      setBatchStockTotal(0);
      return;
    }

    try {
      setLoadingBatches(true);
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/batches/product/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to fetch batches");
      }

      setProductBatches(
        Array.isArray(result?.data?.batches) ? result.data.batches : [],
      );
      setBatchStockTotal(Number(result?.data?.totalStock || 0));
    } catch (error) {
      setProductBatches([]);
      setBatchStockTotal(0);
      toast.error(error.message || "Failed to fetch batches");
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();

    if (!selectedBatchProductId) {
      toast.error("Please select a product first");
      return;
    }

    if (!batchForm.batchNumber.trim()) {
      toast.error("Batch number is required");
      return;
    }

    const quantity = Number(batchForm.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error("Quantity must be greater than zero");
      return;
    }

    const costPrice = Number(batchForm.costPrice);
    if (!Number.isFinite(costPrice) || costPrice < 0) {
      toast.error("Cost price must be a non-negative number");
      return;
    }

    try {
      setCreatingBatch(true);
      const token = getAuthToken();
      const payload = {
        productId: selectedBatchProductId,
        batchNumber: batchForm.batchNumber.trim(),
        quantity,
        costPrice,
        purchaseDate: batchForm.purchaseDate || new Date().toISOString(),
        expiryDate: batchForm.expiryDate || null,
      };

      const response = await fetch(`${API_URL}/batches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Failed to create batch");
      }

      toast.success("Batch added successfully");
      setBatchForm({
        batchNumber: "",
        quantity: "",
        costPrice: "",
        purchaseDate: "",
        expiryDate: "",
      });
      await fetchProductBatches(selectedBatchProductId);
      dispatch(fetchProducts({ page: 1, limit: 200, includeDraft: true }));
    } catch (error) {
      toast.error(error.message || "Failed to create batch");
    } finally {
      setCreatingBatch(false);
    }
  };

  const fetchAboutContent = async () => {
    try {
      setLoadingAboutVideo(true);
      const response = await fetch(`${API_URL}/about-content`);
      if (!response.ok) {
        throw new Error("Failed to fetch About video");
      }
      const result = await response.json();
      setAboutVideoUrl(result?.data?.videoUrl || "");
      setAboutSectionHeading(
        result?.data?.facilityHeading?.trim() || defaultFacilityHeading,
      );
      setAboutSectionDescription(
        result?.data?.facilityDescription?.trim() || defaultFacilityDescription,
      );
      const remoteImages = Array.isArray(result?.data?.facilityImages)
        ? result.data.facilityImages
        : [];
      setAboutSectionImages(
        [0, 1, 2].map(
          (index) => remoteImages[index] || defaultFacilityImages[index],
        ),
      );
      setAboutSectionImageFiles([null, null, null]);
      setAboutSectionImagePreviews(["", "", ""]);
      const remoteBadgeImages = Array.isArray(result?.data?.scienceBadgeImages)
        ? result.data.scienceBadgeImages
        : [];
      setScienceHeading(
        result?.data?.scienceHeading?.trim() || defaultScienceHeading,
      );
      setScienceDescription(
        result?.data?.scienceDescription?.trim() || defaultScienceDescription,
      );
      setScienceBadgeImages(remoteBadgeImages);
      setScienceBadgeImageFiles([]);
      setScienceBadgeImagePreviews([]);
      setScienceImage(result?.data?.scienceImage || "");
      setScienceImageFile(null);
      setScienceImagePreview("");
      setWhyNutrifactorHeading(
        result?.data?.whyNutrifactorHeading?.trim() ||
          defaultWhyNutrifactorHeading,
      );
      setWhyNutrifactorDescription(
        result?.data?.whyNutrifactorDescription?.trim() ||
          defaultWhyNutrifactorDescription,
      );
      setWhyNutrifactorImage(result?.data?.whyNutrifactorImage || "");
      setWhyNutrifactorImageFile(null);
      setWhyNutrifactorImagePreview("");
      setMissionHeading(
        result?.data?.missionHeading?.trim() || defaultMissionHeading,
      );
      setMissionDescription(
        result?.data?.missionDescription?.trim() || defaultMissionDescription,
      );
      setMissionImage(result?.data?.missionImage || "");
      setMissionImageFile(null);
      setMissionImagePreview("");
      setHealthPriorityHeading(
        result?.data?.healthPriorityHeading?.trim() ||
          defaultHealthPriorityHeading,
      );
      const remoteHealthPriorityItems = Array.isArray(
        result?.data?.healthPriorityItems,
      )
        ? result.data.healthPriorityItems
        : [];
      setHealthPriorityItems(
        [0, 1, 2].map(
          (index) =>
            remoteHealthPriorityItems[index] ||
            defaultHealthPriorityItems[index],
        ),
      );
      const remoteHealthPriorityImages = Array.isArray(
        result?.data?.healthPriorityImages,
      )
        ? result.data.healthPriorityImages
        : [];
      setHealthPriorityImages(
        [0, 1, 2, 3].map((index) => remoteHealthPriorityImages[index] || ""),
      );
      setHealthPriorityImageFiles([null, null, null, null]);
      setHealthPriorityImagePreviews(["", "", "", ""]);
      const remoteTeamMembers = Array.isArray(result?.data?.teamMembers)
        ? result.data.teamMembers
        : [];
      setTeamMembers(remoteTeamMembers);
      setTeamMemberImageFiles(new Array(remoteTeamMembers.length).fill(null));
      setTeamMemberImagePreviews(new Array(remoteTeamMembers.length).fill(""));
    } catch {
      setAboutVideoUrl("");
      setAboutSectionHeading(defaultFacilityHeading);
      setAboutSectionDescription(defaultFacilityDescription);
      setAboutSectionImages(defaultFacilityImages);
      setAboutSectionImageFiles([null, null, null]);
      setAboutSectionImagePreviews(["", "", ""]);
      setScienceHeading(defaultScienceHeading);
      setScienceDescription(defaultScienceDescription);
      setScienceBadgeImages(defaultScienceBadgeImages);
      setScienceBadgeImageFiles([]);
      setScienceBadgeImagePreviews([]);
      setScienceImage(defaultScienceImage);
      setScienceImageFile(null);
      setScienceImagePreview("");
      setWhyNutrifactorHeading(defaultWhyNutrifactorHeading);
      setWhyNutrifactorDescription(defaultWhyNutrifactorDescription);
      setWhyNutrifactorImage(defaultWhyNutrifactorImage);
      setWhyNutrifactorImageFile(null);
      setWhyNutrifactorImagePreview("");
      setMissionHeading(defaultMissionHeading);
      setMissionDescription(defaultMissionDescription);
      setMissionImage(defaultMissionImage);
      setMissionImageFile(null);
      setMissionImagePreview("");
      setHealthPriorityHeading(defaultHealthPriorityHeading);
      setHealthPriorityItems(defaultHealthPriorityItems);
      setHealthPriorityImages(defaultHealthPriorityImages);
      setHealthPriorityImageFiles([null, null, null, null]);
      setHealthPriorityImagePreviews(["", "", "", ""]);
      setTeamMembers([]);
      setTeamMemberImageFiles([]);
      setTeamMemberImagePreviews([]);
    } finally {
      setLoadingAboutVideo(false);
    }
  };

  useEffect(() => {
    if (!authChecked) {
      return;
    }

    if (!isAuthenticated) {
      navigate("/login", {
        replace: true,
        state: { from: { pathname: "/admin" } },
      });
      return;
    }

    if (user?.role !== "admin") {
      navigate("/", { replace: true });
      toast.error("Access denied. Admin privileges required.");
      return;
    }
  }, [authChecked, isAuthenticated, navigate, user]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      // Prefetch core dashboard datasets so overview and stat cards are accurate immediately.
      dispatch(fetchProducts({ page: 1, limit: 200, includeDraft: true }));
      dispatch(fetchCategories());
      dispatch(getOrders({ page: 1, limit: 200 }));
      dispatch(getUsers({ page: 1, limit: 200 }));
      dispatch(fetchAllAnnouncements());
      dispatch(fetchAllHeroSlides());
      dispatch(fetchAllProductBanners());
      dispatch(fetchAllSaleOffers());
      fetchAboutContent();
    }
  }, [dispatch, isAuthenticated, user]);

  useEffect(() => {
    if (!(isAuthenticated && user?.role === "admin")) return;

    if (activeTab === "products") {
      dispatch(fetchProducts(getDashboardProductsFetchParams()));
      dispatch(fetchAllProductBanners());
    } else if (activeTab === "categories") {
      dispatch(fetchCategories());
    } else if (activeTab === "orders") {
      dispatch(getOrders({ page: 1, limit: 200 }));
    } else if (activeTab === "users") {
      dispatch(getUsers({ page: 1, limit: 200 }));
    } else if (activeTab === "announcements") {
      dispatch(fetchAllAnnouncements());
    } else if (activeTab === "hero") {
      dispatch(fetchAllHeroSlides());
      dispatch(fetchHeroBadges());
    } else if (activeTab === "sales") {
      dispatch(
        fetchProducts({
          page: 1,
          limit: 200,
          includeDraft: true,
          lenses: "all",
        }),
      );
      dispatch(fetchAllSaleOffers());
    } else if (activeTab === "batches") {
      dispatch(fetchProducts({ page: 1, limit: 200, includeDraft: true }));
    } else if (activeTab === "about-video") {
      fetchAboutContent();
    }
  }, [
    activeTab,
    dispatch,
    getDashboardProductsFetchParams,
    isAuthenticated,
    user,
  ]);

  useEffect(() => {
    if (
      activeProductCategory === "all" ||
      activeProductCategory === LENSES_PRODUCTS_SECTION
    ) {
      return;
    }

    const categoryExists = adminManageableCategories.some(
      (category) => category.value === activeProductCategory,
    );

    if (!categoryExists) {
      setActiveProductCategory("all");
    }
  }, [activeProductCategory, adminManageableCategories]);

  useEffect(() => {
    if (activeTab !== "batches") return;
    if (!products.length) return;

    const productId = selectedBatchProductId || products[0]?._id;
    if (!productId) return;

    if (!selectedBatchProductId) {
      setSelectedBatchProductId(productId);
    }

    fetchProductBatches(productId);
  }, [activeTab, products, selectedBatchProductId]);

  useEffect(() => {
    return () => {
      if (aboutVideoPreview) {
        URL.revokeObjectURL(aboutVideoPreview);
      }
    };
  }, [aboutVideoPreview]);

  const uploadDashboardImage = async (file) => {
    const formDataUpload = new FormData();
    formDataUpload.append("image", file);
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formDataUpload,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to upload image");
    }

    const result = await response.json();
    return result.data.url;
  };

  const uploadDashboardVideo = async (file) => {
    const formDataUpload = new FormData();
    formDataUpload.append("video", file);
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/upload/video`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formDataUpload,
      credentials: "include",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.error || "Failed to upload video");
    }

    return result.data.url;
  };

  const handleUploadAboutVideo = async (e) => {
    e.preventDefault();

    if (!aboutVideoFile) {
      toast.error("Please select a video file first");
      return;
    }

    try {
      setUploadingAboutVideo(true);
      const uploadedVideoUrl = await uploadDashboardVideo(aboutVideoFile);
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/about-content`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ videoUrl: uploadedVideoUrl }),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to save About video");
      }

      setAboutVideoUrl(result?.data?.videoUrl || uploadedVideoUrl);
      setAboutVideoFile(null);
      if (aboutVideoPreview) {
        URL.revokeObjectURL(aboutVideoPreview);
      }
      setAboutVideoPreview("");
      toast.success("About video updated successfully");
    } catch (error) {
      toast.error(error.message || "Failed to update About video");
    } finally {
      setUploadingAboutVideo(false);
    }
  };

  const handleRemoveAboutVideo = async () => {
    if (!window.confirm("Remove current About page video?")) {
      return;
    }

    try {
      setUploadingAboutVideo(true);
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/about-content`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to remove About video");
      }

      setAboutVideoUrl("");
      setAboutVideoFile(null);
      if (aboutVideoPreview) {
        URL.revokeObjectURL(aboutVideoPreview);
      }
      setAboutVideoPreview("");
      toast.success("About video removed");
    } catch (error) {
      toast.error(error.message || "Failed to remove About video");
    } finally {
      setUploadingAboutVideo(false);
    }
  };

  const handleAboutSectionImageChange = (index, file) => {
    if (!file) {
      return;
    }

    const nextFiles = [...aboutSectionImageFiles];
    nextFiles[index] = file;
    setAboutSectionImageFiles(nextFiles);

    const reader = new FileReader();
    reader.onload = (event) => {
      const nextPreviews = [...aboutSectionImagePreviews];
      nextPreviews[index] = event.target?.result || "";
      setAboutSectionImagePreviews(nextPreviews);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAboutSection = async (e) => {
    e.preventDefault();

    if (!aboutSectionHeading.trim()) {
      toast.error("Section heading is required");
      return;
    }

    if (!aboutSectionDescription.trim()) {
      toast.error("Section description is required");
      return;
    }

    try {
      setSavingAboutSection(true);

      const uploadedImages = [...aboutSectionImages];
      for (let index = 0; index < 3; index += 1) {
        if (aboutSectionImageFiles[index]) {
          uploadedImages[index] = await uploadDashboardImage(
            aboutSectionImageFiles[index],
          );
        }
      }

      if (uploadedImages.some((item) => !item)) {
        throw new Error("Please provide all 3 images");
      }

      const token = getAuthToken();
      const response = await fetch(`${API_URL}/about-content`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          facilityHeading: aboutSectionHeading.trim(),
          facilityDescription: aboutSectionDescription.trim(),
          facilityImages: uploadedImages,
        }),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to save section");
      }

      setAboutSectionImages(uploadedImages);
      setAboutSectionImageFiles([null, null, null]);
      setAboutSectionImagePreviews(["", "", ""]);
      toast.success("Section after video updated successfully");
    } catch (error) {
      toast.error(error.message || "Failed to save section");
    } finally {
      setSavingAboutSection(false);
    }
  };

  const handleResetAboutSectionDefaults = () => {
    setAboutSectionHeading(defaultFacilityHeading);
    setAboutSectionDescription(defaultFacilityDescription);
    setAboutSectionImages(defaultFacilityImages);
    setAboutSectionImageFiles([null, null, null]);
    setAboutSectionImagePreviews(["", "", ""]);
  };

  const handleRemoveAboutSectionImage = (index) => {
    const nextImages = [...aboutSectionImages];
    nextImages[index] = "";
    setAboutSectionImages(nextImages);

    const nextFiles = [...aboutSectionImageFiles];
    nextFiles[index] = null;
    setAboutSectionImageFiles(nextFiles);

    const nextPreviews = [...aboutSectionImagePreviews];
    nextPreviews[index] = "";
    setAboutSectionImagePreviews(nextPreviews);
  };

  const handleSaveScienceSection = async (e) => {
    e.preventDefault();

    if (!scienceHeading.trim()) {
      toast.error("Science section heading is required");
      return;
    }

    if (!scienceDescription.trim()) {
      toast.error("Science section description is required");
      return;
    }

    try {
      setSavingScienceSection(true);

      let uploadedBadgeImages = [...scienceBadgeImages];

      if (scienceBadgeImageFiles.length > 0) {
        const newlyUploaded = [];
        for (const file of scienceBadgeImageFiles) {
          const uploadedUrl = await uploadDashboardImage(file);
          newlyUploaded.push(uploadedUrl);
        }
        uploadedBadgeImages = [...uploadedBadgeImages, ...newlyUploaded].slice(
          0,
          8,
        );
      }

      if (uploadedBadgeImages.length < 1) {
        toast.error("Please upload at least one certification badge image");
        setSavingScienceSection(false);
        return;
      }

      let uploadedScienceImage = scienceImage;

      if (scienceImageFile) {
        uploadedScienceImage = await uploadDashboardImage(scienceImageFile);
      }

      if (!uploadedScienceImage) {
        toast.error("Please upload one image for this section");
        setSavingScienceSection(false);
        return;
      }

      const token = getAuthToken();
      const response = await fetch(`${API_URL}/about-content`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scienceHeading: scienceHeading.trim(),
          scienceDescription: scienceDescription.trim(),
          scienceBadgeImages: uploadedBadgeImages,
          scienceImage: uploadedScienceImage,
        }),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to save science section");
      }

      setScienceBadgeImages(uploadedBadgeImages);
      setScienceBadgeImageFiles([]);
      setScienceBadgeImagePreviews([]);
      setScienceImage(uploadedScienceImage);
      setScienceImageFile(null);
      setScienceImagePreview("");

      toast.success("Science section updated successfully");
    } catch (error) {
      toast.error(error.message || "Failed to save science section");
    } finally {
      setSavingScienceSection(false);
    }
  };

  const handleResetScienceSectionDefaults = () => {
    setScienceHeading(defaultScienceHeading);
    setScienceDescription(defaultScienceDescription);
    setScienceBadgeImages(defaultScienceBadgeImages);
    setScienceBadgeImageFiles([]);
    setScienceBadgeImagePreviews([]);
    setScienceImage(defaultScienceImage);
    setScienceImageFile(null);
    setScienceImagePreview("");
  };

  const handleScienceImageChange = (file) => {
    if (!file) {
      return;
    }

    setScienceImageFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setScienceImagePreview(event.target?.result || "");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveScienceImage = () => {
    setScienceImage("");
    setScienceImageFile(null);
    setScienceImagePreview("");
  };

  const handleWhyNutrifactorImageChange = (file) => {
    if (!file) {
      return;
    }

    setWhyNutrifactorImageFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setWhyNutrifactorImagePreview(event.target?.result || "");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveWhyNutrifactorImage = () => {
    setWhyNutrifactorImage("");
    setWhyNutrifactorImageFile(null);
    setWhyNutrifactorImagePreview("");
  };

  const handleResetWhyNutrifactorSectionDefaults = () => {
    setWhyNutrifactorHeading(defaultWhyNutrifactorHeading);
    setWhyNutrifactorDescription(defaultWhyNutrifactorDescription);
    setWhyNutrifactorImage(defaultWhyNutrifactorImage);
    setWhyNutrifactorImageFile(null);
    setWhyNutrifactorImagePreview("");
  };

  const handleSaveWhyNutrifactorSection = async (e) => {
    e.preventDefault();

    if (!whyNutrifactorHeading.trim()) {
      toast.error("Why Nutrifactor heading is required");
      return;
    }

    if (!whyNutrifactorDescription.trim()) {
      toast.error("Why Nutrifactor description is required");
      return;
    }

    try {
      setSavingWhyNutrifactorSection(true);

      let uploadedWhyImage = whyNutrifactorImage;
      if (whyNutrifactorImageFile) {
        uploadedWhyImage = await uploadDashboardImage(whyNutrifactorImageFile);
      }

      if (!uploadedWhyImage) {
        toast.error("Please upload one image for this section");
        setSavingWhyNutrifactorSection(false);
        return;
      }

      const token = getAuthToken();
      const response = await fetch(`${API_URL}/about-content`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          whyNutrifactorHeading: whyNutrifactorHeading.trim(),
          whyNutrifactorDescription: whyNutrifactorDescription.trim(),
          whyNutrifactorImage: uploadedWhyImage,
        }),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "Failed to save Why Nutrifactor section",
        );
      }

      setWhyNutrifactorImage(uploadedWhyImage);
      setWhyNutrifactorImageFile(null);
      setWhyNutrifactorImagePreview("");
      toast.success("Why Nutrifactor section updated successfully");
    } catch (error) {
      toast.error(error.message || "Failed to save Why Nutrifactor section");
    } finally {
      setSavingWhyNutrifactorSection(false);
    }
  };

  const handleMissionImageChange = (file) => {
    if (!file) {
      return;
    }

    setMissionImageFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setMissionImagePreview(event.target?.result || "");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveMissionImage = () => {
    setMissionImage("");
    setMissionImageFile(null);
    setMissionImagePreview("");
  };

  const handleResetMissionSectionDefaults = () => {
    setMissionHeading(defaultMissionHeading);
    setMissionDescription(defaultMissionDescription);
    setMissionImage(defaultMissionImage);
    setMissionImageFile(null);
    setMissionImagePreview("");
  };

  const handleSaveMissionSection = async (e) => {
    e.preventDefault();

    if (!missionHeading.trim()) {
      toast.error("Mission heading is required");
      return;
    }

    if (!missionDescription.trim()) {
      toast.error("Mission description is required");
      return;
    }

    try {
      setSavingMissionSection(true);

      let uploadedMissionImage = missionImage;
      if (missionImageFile) {
        uploadedMissionImage = await uploadDashboardImage(missionImageFile);
      }

      if (!uploadedMissionImage) {
        toast.error("Please upload one image for this section");
        setSavingMissionSection(false);
        return;
      }

      const token = getAuthToken();
      const response = await fetch(`${API_URL}/about-content`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          missionHeading: missionHeading.trim(),
          missionDescription: missionDescription.trim(),
          missionImage: uploadedMissionImage,
        }),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to save Mission section");
      }

      setMissionImage(uploadedMissionImage);
      setMissionImageFile(null);
      setMissionImagePreview("");
      toast.success("Mission section updated successfully");
    } catch (error) {
      toast.error(error.message || "Failed to save Mission section");
    } finally {
      setSavingMissionSection(false);
    }
  };

  const handleHealthPriorityItemChange = (index, field, value) => {
    setHealthPriorityItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return next;
    });
  };

  const handleHealthPriorityImageChange = (index, file) => {
    if (!file) {
      return;
    }

    setHealthPriorityImageFiles((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });

    const reader = new FileReader();
    reader.onload = (event) => {
      setHealthPriorityImagePreviews((prev) => {
        const next = [...prev];
        next[index] = event.target?.result || "";
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveHealthPriorityImage = (index) => {
    setHealthPriorityImages((prev) => {
      const next = [...prev];
      next[index] = "";
      return next;
    });

    setHealthPriorityImageFiles((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });

    setHealthPriorityImagePreviews((prev) => {
      const next = [...prev];
      next[index] = "";
      return next;
    });
  };

  const handleResetHealthPrioritySectionDefaults = () => {
    setHealthPriorityHeading(defaultHealthPriorityHeading);
    setHealthPriorityItems(defaultHealthPriorityItems);
    setHealthPriorityImages(defaultHealthPriorityImages);
    setHealthPriorityImageFiles([null, null, null, null]);
    setHealthPriorityImagePreviews(["", "", "", ""]);
  };

  const handleSaveHealthPrioritySection = async (e) => {
    e.preventDefault();

    if (!healthPriorityHeading.trim()) {
      toast.error("Health priority heading is required");
      return;
    }

    const normalizedItems = healthPriorityItems.map((item) => ({
      title: item.title?.trim() || "",
      description: item.description?.trim() || "",
    }));

    if (normalizedItems.some((item) => !item.title || !item.description)) {
      toast.error("Please complete all three text blocks");
      return;
    }

    try {
      setSavingHealthPrioritySection(true);

      const uploadedImages = [...healthPriorityImages];
      for (let index = 0; index < 4; index += 1) {
        if (healthPriorityImageFiles[index]) {
          uploadedImages[index] = await uploadDashboardImage(
            healthPriorityImageFiles[index],
          );
        }
      }

      const payloadImages = uploadedImages.filter(Boolean).slice(0, 4);

      const token = getAuthToken();
      const response = await fetch(`${API_URL}/about-content`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          healthPriorityHeading: healthPriorityHeading.trim(),
          healthPriorityItems: normalizedItems,
          healthPriorityImages: payloadImages,
        }),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "Failed to save Health Priority section",
        );
      }

      setHealthPriorityImages([
        payloadImages[0] || "",
        payloadImages[1] || "",
        payloadImages[2] || "",
        payloadImages[3] || "",
      ]);
      setHealthPriorityImageFiles([null, null, null, null]);
      setHealthPriorityImagePreviews(["", "", "", ""]);
      toast.success("Health Priority section updated successfully");
    } catch (error) {
      toast.error(error.message || "Failed to save Health Priority section");
    } finally {
      setSavingHealthPrioritySection(false);
    }
  };

  const handleTeamMemberChange = (index, field, value) => {
    setTeamMembers((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return next;
    });
  };

  const handleTeamMemberImageChange = (index, file) => {
    if (!file) {
      return;
    }

    setTeamMemberImageFiles((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });

    const reader = new FileReader();
    reader.onload = (event) => {
      setTeamMemberImagePreviews((prev) => {
        const next = [...prev];
        next[index] = event.target?.result || "";
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveTeamMemberImage = (index) => {
    setTeamMembers((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        image: "",
      };
      return next;
    });

    setTeamMemberImageFiles((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });

    setTeamMemberImagePreviews((prev) => {
      const next = [...prev];
      next[index] = "";
      return next;
    });
  };

  const handleAddTeamMember = () => {
    if (teamMembers.length >= 12) {
      toast.error("Maximum 12 team members are allowed");
      return;
    }

    setTeamMembers((prev) => [
      ...prev,
      { name: "", role: "", bio: "", image: "" },
    ]);
    setTeamMemberImageFiles((prev) => [...prev, null]);
    setTeamMemberImagePreviews((prev) => [...prev, ""]);
  };

  const handleRemoveTeamMember = (index) => {
    setTeamMembers((prev) => prev.filter((_, i) => i !== index));

    setTeamMemberImageFiles((prev) => {
      return prev.filter((_, i) => i !== index);
    });

    setTeamMemberImagePreviews((prev) => {
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleResetTeamMembersDefaults = () => {
    setTeamMembers([]);
    setTeamMemberImageFiles([]);
    setTeamMemberImagePreviews([]);
  };

  const handleSaveTeamMembers = async (e) => {
    e.preventDefault();

    try {
      setSavingTeamMembers(true);

      const uploadedMembers = [...teamMembers];

      for (let index = 0; index < uploadedMembers.length; index += 1) {
        if (teamMemberImageFiles[index]) {
          const uploadedUrl = await uploadDashboardImage(
            teamMemberImageFiles[index],
          );
          uploadedMembers[index] = {
            ...uploadedMembers[index],
            image: uploadedUrl,
          };
        }
      }

      const normalizedMembers = uploadedMembers
        .map((member) => ({
          name: member.name?.trim() || "",
          role: member.role?.trim() || "",
          bio: member.bio?.trim() || "",
          image: member.image?.trim() || "",
        }))
        .filter(
          (member) => member.name || member.role || member.bio || member.image,
        )
        .slice(0, 12);

      if (normalizedMembers.length < 1) {
        toast.error("Please add at least one team member");
        setSavingTeamMembers(false);
        return;
      }

      if (
        normalizedMembers.some(
          (member) => !member.name || !member.role || !member.bio,
        )
      ) {
        toast.error("Please complete name, role, and bio for each team member");
        setSavingTeamMembers(false);
        return;
      }

      if (normalizedMembers.some((member) => !member.image)) {
        toast.error("Please upload one image for each team member");
        setSavingTeamMembers(false);
        return;
      }

      const token = getAuthToken();
      const response = await fetch(`${API_URL}/about-content`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          teamMembers: normalizedMembers,
        }),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to save team members");
      }

      setTeamMembers(normalizedMembers);
      setTeamMemberImageFiles(new Array(normalizedMembers.length).fill(null));
      setTeamMemberImagePreviews(new Array(normalizedMembers.length).fill(""));
      toast.success("Team members updated successfully");
    } catch (error) {
      toast.error(error.message || "Failed to save team members");
    } finally {
      setSavingTeamMembers(false);
    }
  };

  const handleScienceBadgeImageSelection = (files) => {
    if (!files?.length) {
      return;
    }

    const allowedCount = Math.max(0, 8 - scienceBadgeImages.length);
    const selectedFiles = Array.from(files).slice(0, allowedCount);

    if (selectedFiles.length < files.length) {
      toast.error("Maximum 8 certification badges are allowed");
    }

    if (!selectedFiles.length) {
      return;
    }

    setScienceBadgeImageFiles((prev) => [...prev, ...selectedFiles]);

    selectedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setScienceBadgeImagePreviews((prev) => [
          ...prev,
          event.target?.result || "",
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveSavedScienceBadge = (index) => {
    const next = [...scienceBadgeImages];
    next.splice(index, 1);
    setScienceBadgeImages(next);
  };

  const handleRemovePendingScienceBadge = (index) => {
    setScienceBadgeImageFiles((prev) => prev.filter((_, i) => i !== index));
    setScienceBadgeImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await dispatch(deleteProduct(productId)).unwrap();
        toast.success("Product deleted successfully");
      } catch (error) {
        toast.error("Failed to delete product");
      }
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowEditProductModal(true);
  };

  const handleOpenAddProduct = (categoryValue = activeProductCategory) => {
    const isLensesSection = categoryValue === LENSES_PRODUCTS_SECTION;
    const categoryForForm =
      categoryValue && categoryValue !== "all" && !isLensesSection
        ? categoryValue
        : adminManageableCategories[0]?.value || "";

    setAddProductCategory(isLensesSection ? "" : categoryForForm);
    setAddProductIsLenses(isLensesSection);
    setShowAddProductModal(true);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      let imageUrl = "";
      if (categoryImageFile) {
        setUploadingCategoryImage(true);
        const formDataUpload = new FormData();
        formDataUpload.append("image", categoryImageFile);
        const rawToken = localStorage.getItem("accessToken");
        const token = rawToken ? JSON.parse(rawToken) : null;
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "/api"}/upload`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formDataUpload,
            credentials: "include",
          },
        );
        if (!response.ok) throw new Error("Failed to upload image");
        const result = await response.json();
        imageUrl = result.data.url;
        setUploadingCategoryImage(false);
      }
      const createdCategory = await dispatch(
        createCategory({ ...categoryForm, image: imageUrl }),
      ).unwrap();
      setCategoryForm({ name: "", description: "" });
      setCategoryImageFile(null);
      setCategoryImagePreview(null);
      setActiveProductCategory(createdCategory.value);
      setProductCategoriesOpen(true);
      toast.success(`${createdCategory.name} created successfully`);
    } catch (error) {
      setUploadingCategoryImage(false);
      toast.error(error || "Failed to create category");
      toast.error(
        error?.message || String(error) || "Failed to create category",
      );
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("Delete this category?")) {
      return;
    }

    try {
      await dispatch(deleteCategory(categoryId)).unwrap();
      toast.success("Category deleted successfully");
    } catch (error) {
      toast.error(error || "Failed to delete category");
      toast.error(
        error?.message || String(error) || "Failed to delete category",
      );
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryEditForm({
      name: category?.name || "",
      description: category?.description || "",
      image: category?.image || "",
    });
    setCategoryEditImageFile(null);
    setCategoryEditImagePreview("");
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();

    if (!editingCategory?._id) {
      return;
    }

    if (!categoryEditForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      setSavingCategoryEdit(true);
      let imageUrl = categoryEditForm.image || "";

      if (categoryEditImageFile) {
        imageUrl = await uploadDashboardImage(categoryEditImageFile);
      }

      await dispatch(
        updateCategory({
          id: editingCategory._id,
          data: {
            name: categoryEditForm.name.trim(),
            description: categoryEditForm.description.trim(),
            image: imageUrl,
          },
        }),
      ).unwrap();

      setEditingCategory(null);
      setCategoryEditForm({ name: "", description: "", image: "" });
      setCategoryEditImageFile(null);
      setCategoryEditImagePreview("");
      toast.success("Category updated successfully");
    } catch (error) {
      toast.error(error?.message || String(error) || "Failed to update category");
    } finally {
      setSavingCategoryEdit(false);
    }
  };

  const handleCreateHeroSlide = async (e) => {
    e.preventDefault();

    if (!heroImageFile) {
      toast.error("Hero image is required");
      return;
    }

    try {
      setUploadingHeroImage(true);
      const imageUrl = await uploadDashboardImage(heroImageFile);

      await dispatch(
        createHeroSlide({
          image: imageUrl,
          displayOrder: Number(heroForm.displayOrder || 0),
        }),
      ).unwrap();
      setHeroForm({ displayOrder: 0 });
      setHeroImageFile(null);
      setHeroImagePreview(null);
      toast.success("Hero slide created successfully");
    } catch (error) {
      toast.error(error || "Failed to create hero slide");
      toast.error(
        error?.message || String(error) || "Failed to create hero slide",
      );
    } finally {
      setUploadingHeroImage(false);
    }
  };

  const handleCreateProductBanner = async (e) => {
    e.preventDefault();

    if (!productBannerImageFile) {
      toast.error("Banner image is required");
      return;
    }

    try {
      setUploadingProductBannerImage(true);
      const imageUrl = await uploadDashboardImage(productBannerImageFile);
      await dispatch(
        createProductBanner({
          image: imageUrl,
          displayOrder: Number(productBannerForm.displayOrder || 0),
        }),
      ).unwrap();
      setProductBannerForm({ displayOrder: 0 });
      setProductBannerImageFile(null);
      setProductBannerImagePreview(null);
      toast.success("Products banner created successfully");
    } catch (error) {
      toast.error(error || "Failed to create products banner");
    } finally {
      setUploadingProductBannerImage(false);
    }
  };

  const handleDeleteProductBanner = async (bannerId) => {
    if (!window.confirm("Delete this products banner?")) {
      return;
    }

    try {
      await dispatch(deleteProductBanner(bannerId)).unwrap();
      toast.success("Products banner deleted successfully");
    } catch (error) {
      toast.error(error || "Failed to delete products banner");
    }
  };

  const handleSaleOfferProductToggle = (productId) => {
    setSaleOfferForm((prev) => {
      const selected = new Set(prev.productIds);
      if (selected.has(productId)) {
        selected.delete(productId);
      } else {
        selected.add(productId);
      }

      return {
        ...prev,
        productIds: Array.from(selected),
      };
    });
  };

  const handleCreateSaleOffer = async (e) => {
    e.preventDefault();

    if (!saleOfferForm.name.trim()) {
      toast.error("Sale name is required");
      return;
    }

    if (!saleOfferBannerFile) {
      toast.error("Sale banner is required");
      return;
    }

    if (saleOfferForm.productIds.length === 0) {
      toast.error("Please select at least one existing product for this sale");
      return;
    }

    try {
      setUploadingSaleOfferBanner(true);
      const bannerUrl = await uploadDashboardImage(saleOfferBannerFile);
      await dispatch(
        createSaleOffer({
          name: saleOfferForm.name.trim(),
          banner: bannerUrl,
          products: saleOfferForm.productIds,
          displayOrder: Number(saleOfferForm.displayOrder || 0),
        }),
      ).unwrap();

      setSaleOfferForm({ name: "", displayOrder: 0, productIds: [] });
      setSaleOfferBannerFile(null);
      setSaleOfferBannerPreview(null);
      toast.success("Sale offer created successfully");
    } catch (error) {
      toast.error(error || "Failed to create sale offer");
    } finally {
      setUploadingSaleOfferBanner(false);
    }
  };

  const handleDeleteSaleOffer = async (offerId) => {
    if (!window.confirm("Delete this sale offer?")) {
      return;
    }

    try {
      await dispatch(deleteSaleOffer(offerId)).unwrap();
      toast.success("Sale offer deleted successfully");
    } catch (error) {
      toast.error(error || "Failed to delete sale offer");
    }
  };

  const handleDeleteHeroSlide = async (slideId) => {
    if (!window.confirm("Delete this hero slide?")) {
      return;
    }

    try {
      await dispatch(deleteHeroSlide(slideId)).unwrap();
      toast.success("Hero slide deleted successfully");
    } catch (error) {
      toast.error(error || "Failed to delete hero slide");
    }
  };

  const handleHeroBadgeImageSelection = (files) => {
    if (!files?.length) {
      return;
    }

    const maxNew = Math.max(0, 20 - heroBadgeImages.length);
    const selectedFiles = Array.from(files).slice(0, maxNew);

    if (selectedFiles.length < files.length) {
      toast.error("Maximum 20 certificate badges are allowed");
    }

    if (!selectedFiles.length) {
      return;
    }

    setHeroBadgeImageFiles(selectedFiles);
    setHeroBadgeImagePreviews([]);

    selectedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setHeroBadgeImagePreviews((prev) => [
          ...prev,
          event.target?.result || "",
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePendingHeroBadge = (index) => {
    setHeroBadgeImageFiles((prev) => prev.filter((_, i) => i !== index));
    setHeroBadgeImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveHeroBadges = async (e) => {
    e.preventDefault();

    if (!heroBadgeImageFiles.length) {
      toast.error("Please select at least one badge image");
      return;
    }

    try {
      setUpdatingHeroBadges(true);

      const uploadedBadgeImages = [];
      for (const file of heroBadgeImageFiles) {
        const uploadedUrl = await uploadDashboardImage(file);
        uploadedBadgeImages.push(uploadedUrl);
      }

      const mergedBadges = [...heroBadgeImages, ...uploadedBadgeImages].slice(
        0,
        20,
      );

      await dispatch(updateHeroBadges(mergedBadges)).unwrap();

      setHeroBadgeImageFiles([]);
      setHeroBadgeImagePreviews([]);
      toast.success("Hero certificate badges updated successfully");
    } catch (error) {
      toast.error(
        typeof error === "string"
          ? error
          : error?.message || "Failed to update hero certificate badges",
      );
    } finally {
      setUpdatingHeroBadges(false);
    }
  };

  const handleGenderImageChange = (key, file) => {
    if (!file) {
      return;
    }

    setGenderImageFiles((prev) => ({
      ...prev,
      [key]: file,
    }));
    setGenderImageRemovals((prev) => ({
      ...prev,
      [key]: false,
    }));

    const reader = new FileReader();
    reader.onload = (event) => {
      setGenderImagePreviews((prev) => ({
        ...prev,
        [key]: event.target?.result || "",
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveGenderImage = (key) => {
    setGenderImageFiles((prev) => ({
      ...prev,
      [key]: null,
    }));
    setGenderImagePreviews((prev) => ({
      ...prev,
      [key]: "",
    }));
    setGenderImageRemovals((prev) => ({
      ...prev,
      [key]: true,
    }));
  };

  const handleSaveGenderImages = async (e) => {
    e.preventDefault();

    const updates = {};

    if (genderImageRemovals.female) {
      updates.female = "";
    }

    if (genderImageRemovals.male) {
      updates.male = "";
    }

    try {
      if (genderImageFiles.female) {
        updates.female = await uploadDashboardImage(genderImageFiles.female);
      }

      if (genderImageFiles.male) {
        updates.male = await uploadDashboardImage(genderImageFiles.male);
      }

      if (!Object.keys(updates).length) {
        toast.error("Select or clear at least one gender image");
        return;
      }

      setSavingGenderImages(true);
      await dispatch(updateHeroGenderImages(updates)).unwrap();
      setGenderImageFiles({ female: null, male: null });
      setGenderImagePreviews({ female: "", male: "" });
      setGenderImageRemovals({ female: false, male: false });
      toast.success("Shop by gender images updated successfully");
    } catch (error) {
      toast.error(
        typeof error === "string"
          ? error
          : error?.message || "Failed to update gender images",
      );
    } finally {
      setSavingGenderImages(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await dispatch(
        updateOrderStatus({ id: orderId, status: newStatus }),
      ).unwrap();
      toast.success("Order status updated");
    } catch (error) {
      toast.error("Failed to update order status");
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTabButtonClass = (tab) =>
    `w-full rounded-md border px-3 py-2 text-left text-sm font-medium transition ${
      activeTab === tab
        ? "border-green-200 bg-green-50 text-green-700"
        : "border-transparent text-gray-600 hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900"
    }`;

  const formatOrderDisplayId = (orderId) => {
    if (!orderId) return "#--------";
    return `#${String(orderId).slice(-8).toUpperCase()}`;
  };

  const handleCopyOrderId = async (orderId) => {
    if (!orderId) {
      toast.error("Order ID not available");
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(orderId);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = orderId;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "absolute";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      toast.success("Full order ID copied");
    } catch {
      toast.error("Failed to copy order ID");
    }
  };

  // Calculate dashboard stats
  const totalRevenue = orders.reduce(
    (sum, order) => sum + Number(order.totalPrice ?? order.total ?? 0),
    0,
  );
  const totalOrders = orderPagination?.total || orders?.length || 0;
  const totalProducts = productPagination?.total || products?.length || 0;
  const totalUsers = userPagination?.total || users?.length || 0;
  const selectedBatchProduct = products.find(
    (product) => product._id === selectedBatchProductId,
  );
  if (!authChecked || !isAuthenticated || user?.role !== "admin") {
    return <Loader />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">Manage your e-commerce platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <FaDollarSign className="text-green-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-800">
                Rs. {totalRevenue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <FaShoppingCart className="text-blue-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">{totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <FaBox className="text-purple-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Products
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {totalProducts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-full">
              <FaUsers className="text-orange-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-800">{totalUsers}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px,1fr]">
        {/* Navigation Tabs */}
        <div className="h-fit rounded-lg border bg-white p-4 shadow-md">
          <h2 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Dashboard Sections
          </h2>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={getTabButtonClass("overview")}
            >
              Overview
            </button>
            <button
              onClick={() => {
                if (activeTab !== "products") {
                  setActiveTab("products");
                  setActiveProductCategory("all");
                  setProductCategoriesOpen(true);
                  return;
                }

                setProductCategoriesOpen((prev) => !prev);
              }}
              className={getTabButtonClass("products")}
            >
              <span className="flex w-full items-center justify-between gap-3">
                <span>Products</span>
                <FaChevronDown
                  className={`text-xs opacity-80 transition-transform ${
                    productCategoriesOpen ? "rotate-180" : ""
                  }`}
                />
              </span>
            </button>
            {productCategoriesOpen && (
              <div className="space-y-1 border-l border-gray-200 pl-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("products");
                    setActiveProductCategory("all");
                  }}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                    activeTab === "products" && activeProductCategory === "all"
                      ? "bg-green-50 text-green-700"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  All Products
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("products");
                    setActiveProductCategory(LENSES_PRODUCTS_SECTION);
                    setProductCategoriesOpen(true);
                  }}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                    activeTab === "products" &&
                    activeProductCategory === LENSES_PRODUCTS_SECTION
                      ? "bg-green-50 text-green-700"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  Lenses Products
                </button>
                {adminManageableCategories.map((category) => (
                  <button
                    key={category._id || category.value}
                    type="button"
                    onClick={() => {
                      setActiveTab("products");
                      setActiveProductCategory(category.value);
                      setProductCategoriesOpen(true);
                    }}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                      activeTab === "products" &&
                      activeProductCategory === category.value
                        ? "bg-green-50 text-green-700"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setActiveTab("orders")}
              className={getTabButtonClass("orders")}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={getTabButtonClass("users")}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={getTabButtonClass("categories")}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveTab("hero")}
              className={getTabButtonClass("hero")}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab("sales")}
              className={getTabButtonClass("sales")}
            >
              Sales
            </button>
            <button
              onClick={() => setActiveTab("batches")}
              className={getTabButtonClass("batches")}
            >
              Batches
            </button>
            <button
              onClick={() => setActiveTab("about-video")}
              className={getTabButtonClass("about-video")}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab("announcements")}
              className={getTabButtonClass("announcements")}
            >
              Announcements
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-md">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-6">
                Dashboard Overview
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Orders */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order) => (
                      <div
                        key={order._id}
                        className="flex items-center justify-between p-4 border rounded"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium" title={order._id}>
                              Order {formatOrderDisplayId(order._id)}
                            </p>
                            <button
                              type="button"
                              title="Copy full order ID"
                              onClick={() => handleCopyOrderId(order._id)}
                              className="text-gray-400 transition hover:text-gray-700"
                            >
                              <FaCopy className="text-xs" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-600">
                            {order.user?.name} - $
                            {Number(
                              order.totalPrice ?? order.total ?? 0,
                            ).toFixed(2)}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs ${getOrderStatusColor(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Low Stock Products */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Low Stock Alert
                  </h3>
                  <div className="space-y-4">
                    {products
                      .filter((product) => product.stock < 10)
                      .slice(0, 5)
                      .map((product) => (
                        <div
                          key={product._id}
                          className="flex items-center justify-between p-4 border rounded"
                        >
                          <div className="flex items-center space-x-3">
                            <img
                              src={
                                product.image
                                  ? resolveMediaUrl(product.image)
                                  : resolveMediaUrl(
                                      product.images?.[0]?.url ||
                                        product.images?.[0],
                                    )
                              }
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-red-600">
                                Only {product.stock} left
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === "products" && (
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">Product Management</h2>
                  <p className="text-sm text-gray-500">
                    Manage products inside the selected category tab.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleOpenAddProduct()}
                    disabled={
                      activeProductCategory === "all" &&
                      adminManageableCategories.length === 0
                    }
                    className="bg-[#68a300] text-white px-4 py-2 rounded hover:bg-[#5f9600] flex items-center space-x-2"
                  >
                    <FaPlus />
                    <span>
                      Add{" "}
                      {activeProductCategory === "all"
                        ? "Product"
                        : activeProductCategoryName}
                    </span>
                  </button>
                  <button
                    onClick={() =>
                      exportToExcel(
                        [
                          {
                            name: activeProductCategoryName,
                            data: formatProductsForExport(visibleProducts),
                          },
                        ],
                        "products.xlsx",
                      ).catch(() => toast.error("Export failed"))
                    }
                    className="flex items-center space-x-2 rounded bg-green-700 px-4 py-2 text-white hover:bg-green-800"
                  >
                    <FaFileExcel />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              <div>
                {(adminManageableCategories.length > 0 ||
                  activeProductCategory === LENSES_PRODUCTS_SECTION) && (
                  <div className="mb-6 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveProductCategory("all")}
                      className={`rounded border px-3 py-2 text-sm font-medium ${
                        activeProductCategory === "all"
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      All Products
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveProductCategory(LENSES_PRODUCTS_SECTION)
                      }
                      className={`rounded border px-3 py-2 text-sm font-medium ${
                        activeProductCategory === LENSES_PRODUCTS_SECTION
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Lenses Products
                    </button>
                    {adminManageableCategories.map((category) => (
                      <button
                        key={category._id || category.value}
                        type="button"
                        onClick={() => setActiveProductCategory(category.value)}
                        className={`rounded border px-3 py-2 text-sm font-medium ${
                          activeProductCategory === category.value
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {activeProductCategoryName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Showing {visibleProducts.length} product
                      {visibleProducts.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          SKU
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Cost Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Stock
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {visibleProducts.map((product) => (
                        <tr key={product._id}>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img
                                src={
                                  product.image
                                    ? resolveMediaUrl(product.image)
                                    : resolveMediaUrl(
                                        product.images?.[0]?.url ||
                                          product.images?.[0],
                                      )
                                }
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {product.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {product.lenses ? "Lens product" : "Product"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {product.lenses
                              ? "Lenses"
                              : product.category || "Uncategorized"}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.sku || "N/A"}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${Number(product.costPrice || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${product.price?.toFixed(2)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded ${
                                product.stock > 10
                                  ? "bg-green-100 text-green-800"
                                  : product.stock > 0
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {product.stock}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {visibleProducts.length === 0 && (
                    <div className="border-t p-8 text-center text-gray-400">
                      No products found in this section yet.
                      {activeProductCategory !== "all" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenAddProduct(activeProductCategory)
                          }
                          className="ml-2 font-medium text-green-700 hover:text-green-800"
                        >
                          Add one now.
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === "categories" && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-[360px,1fr] gap-8">
                <div className="border rounded-lg p-5 bg-gray-50">
                  <h2 className="text-2xl font-semibold mb-4">Add Category</h2>
                  <form className="space-y-4" onSubmit={handleCreateCategory}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category Name
                      </label>
                      <input
                        type="text"
                        value={categoryForm.name}
                        onChange={(e) =>
                          setCategoryForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        placeholder="e.g. Skincare"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={categoryForm.description}
                        onChange={(e) =>
                          setCategoryForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        rows={3}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        placeholder="Optional short description for the home page"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category Image
                      </label>
                      {categoryImagePreview && (
                        <img
                          src={categoryImagePreview}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded-full border-2 border-[#68a300] mb-2"
                        />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setCategoryImageFile(file);
                            const reader = new FileReader();
                            reader.onload = (ev) =>
                              setCategoryImagePreview(ev.target.result);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={uploadingCategoryImage}
                      className="bg-[#68a300] text-white px-4 py-2 rounded hover:bg-[#5f9600] flex items-center space-x-2 disabled:opacity-60"
                    >
                      <FaPlus />
                      <span>
                        {uploadingCategoryImage
                          ? "Uploading..."
                          : "Add Category"}
                      </span>
                    </button>
                  </form>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-6">
                    Category Management
                  </h2>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {adminManageableCategories.map((category) => (
                      <div
                        key={category._id || category.value}
                        className="overflow-hidden rounded-xl border bg-white shadow-sm"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                          {category.image ? (
                            <img
                              src={resolveMediaUrl(category.image)}
                              alt={category.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="space-y-2 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {category.name}
                              </h3>
                              <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
                                {category.value}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditCategory(category)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteCategory(
                                    category._id,
                                    category.value,
                                  )
                                }
                                className="text-red-600 hover:text-red-900"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500">
                            {category.description || "No description yet."}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Order Management</h2>
                <button
                  onClick={() =>
                    exportToExcel(
                      [{ name: "Orders", data: formatOrdersForExport(orders) }],
                      "orders.xlsx",
                    ).catch(() => toast.error("Export failed"))
                  }
                  className="flex items-center space-x-2 rounded bg-green-700 px-4 py-2 text-white hover:bg-green-800"
                >
                  <FaFileExcel />
                  <span>Export</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Order ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Customer Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order._id}>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <span title={order._id}>
                              {formatOrderDisplayId(order._id)}
                            </span>
                            <button
                              type="button"
                              title="Copy full order ID"
                              onClick={() => handleCopyOrderId(order._id)}
                              className="text-gray-400 transition hover:text-gray-700"
                            >
                              <FaCopy className="text-xs" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.user?.name}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.user?._id ? "User" : "Guest Customer"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          Rs.{" "}
                          {Number(order.totalPrice ?? order.total ?? 0).toFixed(
                            2,
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleUpdateOrderStatus(order._id, e.target.value)
                            }
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() =>
                              navigate(`/admin/orders/${order._id}`)
                            }
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FaEye />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-semibold">User Management</h2>
                <button
                  onClick={() =>
                    exportToExcel(
                      [{ name: "Users", data: formatUsersForExport(users) }],
                      "users.xlsx",
                    ).catch(() => toast.error("Export failed"))
                  }
                  className="flex items-center space-x-2 rounded bg-green-700 px-4 py-2 text-white hover:bg-green-800"
                >
                  <FaFileExcel />
                  <span>Export</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Joined
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((userData) => (
                      <tr key={userData._id}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {userData.name}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {userData.email}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              userData.role === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {userData.role}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(userData.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() =>
                              navigate(`/admin/users/${userData._id}`)
                            }
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FaEye />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Hero Tab */}
          {activeTab === "hero" && (
            <div className="p-6">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px,1fr]">
                <div className="space-y-6">
                  <div className="rounded-lg border bg-gray-50 p-5">
                    <h2 className="mb-4 text-2xl font-semibold">
                      Add Hero Slide
                    </h2>
                    <form
                      className="space-y-4"
                      onSubmit={handleCreateHeroSlide}
                    >
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Hero Image
                        </label>
                        {heroImagePreview && (
                          <img
                            src={heroImagePreview}
                            alt="Hero preview"
                            className="mb-3 h-40 w-full rounded-lg object-cover"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (!file) {
                              return;
                            }

                            setHeroImageFile(file);
                            const reader = new FileReader();
                            reader.onload = (event) =>
                              setHeroImagePreview(event.target.result);
                            reader.readAsDataURL(file);
                          }}
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Display Order
                        </label>
                        <input
                          type="number"
                          value={heroForm.displayOrder}
                          onChange={(e) =>
                            setHeroForm((prev) => ({
                              ...prev,
                              displayOrder: e.target.value,
                            }))
                          }
                          className="w-full rounded border border-gray-300 px-3 py-2"
                          min="0"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={uploadingHeroImage}
                        className="flex items-center space-x-2 rounded bg-[#68a300] px-4 py-2 text-white hover:bg-[#5f9600] disabled:opacity-60"
                      >
                        <FaPlus />
                        <span>
                          {uploadingHeroImage
                            ? "Uploading..."
                            : "Add Hero Slide"}
                        </span>
                      </button>
                    </form>
                  </div>

                  <div className="rounded-lg border bg-gray-50 p-5">
                    <h2 className="mb-4 text-2xl font-semibold">
                      Hero Certificate Badges
                    </h2>

                    {heroBadgeImages.length > 0 && (
                      <div className="mb-4">
                        <p className="mb-2 text-sm font-medium text-gray-700">
                          Current Badges ({heroBadgeImages.length}/20)
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                          {heroBadgeImages.map((url, index) => (
                            <div
                              key={`current-badge-${index}`}
                              className="relative overflow-hidden rounded-full border"
                            >
                              <img
                                src={resolveMediaUrl(url)}
                                alt={`Badge ${index + 1}`}
                                className="h-14 w-14 object-cover"
                              />
                              <button
                                type="button"
                                onClick={async () => {
                                  const updated = heroBadgeImages.filter(
                                    (_, i) => i !== index,
                                  );
                                  try {
                                    await dispatch(
                                      updateHeroBadges(updated),
                                    ).unwrap();
                                    toast.success("Badge removed");
                                  } catch {
                                    toast.error("Failed to remove badge");
                                  }
                                }}
                                className="absolute right-0 top-0 bg-black/70 px-1 text-[10px] font-semibold text-white"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <form className="space-y-4" onSubmit={handleSaveHeroBadges}>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Add Certificate Badges
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) =>
                            handleHeroBadgeImageSelection(e.target.files)
                          }
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        />
                        {heroBadgeImagePreviews.length > 0 && (
                          <div className="mt-3 grid grid-cols-4 gap-2">
                            {heroBadgeImagePreviews.map((preview, index) => (
                              <div
                                key={`hero-badge-preview-${index}`}
                                className="relative overflow-hidden rounded-full border"
                              >
                                <img
                                  src={preview}
                                  alt={`Hero badge preview ${index + 1}`}
                                  className="h-14 w-14 object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemovePendingHeroBadge(index)
                                  }
                                  className="absolute right-0 top-0 bg-black/70 px-1 text-[10px] font-semibold text-white"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={updatingHeroBadges}
                        className="flex items-center space-x-2 rounded bg-[#5b3f95] px-4 py-2 text-white hover:bg-[#4d337f] disabled:opacity-60"
                      >
                        <FaPlus />
                        <span>
                          {updatingHeroBadges
                            ? "Saving..."
                            : "Save Certificate Badges"}
                        </span>
                      </button>
                    </form>
                  </div>

                  <div className="rounded-lg border bg-gray-50 p-5">
                    <h2 className="mb-4 text-2xl font-semibold">
                      Shop By Gender Images
                    </h2>

                    <form
                      className="space-y-4"
                      onSubmit={handleSaveGenderImages}
                    >
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {[
                          { key: "female", label: "Female Collection" },
                          { key: "male", label: "Male Collection" },
                        ].map(({ key, label }) => {
                          const preview =
                            genderImagePreviews[key] ||
                            resolveMediaUrl(heroGenderImages?.[key]);

                          return (
                            <div
                              key={key}
                              className="rounded-lg border bg-white p-3"
                            >
                              <p className="mb-2 text-xs font-semibold uppercase text-gray-500">
                                {label}
                              </p>
                              {preview ? (
                                <img
                                  src={preview}
                                  alt={`${label} preview`}
                                  className="mb-3 h-32 w-full rounded object-cover"
                                />
                              ) : (
                                <div className="mb-3 flex h-32 items-center justify-center rounded border-2 border-dashed border-gray-300 text-xs text-gray-400">
                                  No image selected
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  handleGenderImageChange(
                                    key,
                                    e.target.files[0],
                                  )
                                }
                                className="w-full rounded border border-gray-300 px-2 py-2 text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveGenderImage(key)}
                                className="mt-2 w-full rounded border border-red-200 px-2 py-2 text-xs text-red-600 hover:bg-red-50"
                              >
                                Clear
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        type="submit"
                        disabled={savingGenderImages}
                        className="flex items-center space-x-2 rounded bg-[#68a300] px-4 py-2 text-white hover:bg-[#5f9600] disabled:opacity-60"
                      >
                        <FaCheck />
                        <span>
                          {savingGenderImages
                            ? "Saving..."
                            : "Save Gender Images"}
                        </span>
                      </button>
                    </form>
                  </div>
                </div>

                <div>
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Hero Slides</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <FaImage />
                      <span>{heroSlides.length} slides</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {heroSlides.map((slide) => (
                      <div
                        key={slide._id}
                        className="overflow-hidden rounded-xl border bg-white shadow-sm"
                      >
                        <img
                          src={(() => {
                            const url = resolveMediaUrl(slide.image);
                            console.log(
                              "Hero slide image src:",
                              url,
                              slide.image,
                            );
                            return url;
                          })()}
                          alt="Hero slide"
                          className="h-44 w-full object-cover"
                        />
                        <div className="space-y-2 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                Order: {slide.displayOrder || 0}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteHeroSlide(slide._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {heroSlides.length === 0 && (
                      <div className="rounded-xl border border-dashed p-8 text-center text-gray-400 md:col-span-2 xl:col-span-3">
                        No hero slides yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sales Tab */}
          {activeTab === "sales" && (
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">Sales Offers</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Create clickable home banners using products that already
                    exist in the catalog.
                  </p>
                </div>
                <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                  {saleOffers.length} offer{saleOffers.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px,1fr]">
                <div className="rounded-lg border bg-gray-50 p-5">
                  <h3 className="mb-4 text-xl font-semibold">
                    Add Sale Offer
                  </h3>
                  <form className="space-y-4" onSubmit={handleCreateSaleOffer}>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Sale Name
                      </label>
                      <input
                        type="text"
                        value={saleOfferForm.name}
                        onChange={(e) =>
                          setSaleOfferForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Summer Sale"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Banner
                      </label>
                      {saleOfferBannerPreview && (
                        <img
                          src={saleOfferBannerPreview}
                          alt="Sale banner preview"
                          className="mb-3 h-32 w-full rounded-lg object-cover"
                        />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (!file) return;

                          setSaleOfferBannerFile(file);
                          const reader = new FileReader();
                          reader.onload = (event) =>
                            setSaleOfferBannerPreview(event.target.result);
                          reader.readAsDataURL(file);
                        }}
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Display Order
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={saleOfferForm.displayOrder}
                        onChange={(e) =>
                          setSaleOfferForm((prev) => ({
                            ...prev,
                            displayOrder: e.target.value,
                          }))
                        }
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">
                          Existing Products
                        </label>
                        <span className="text-xs text-gray-500">
                          {saleOfferForm.productIds.length} selected
                        </span>
                      </div>
                      <div className="max-h-72 space-y-2 overflow-y-auto rounded border bg-white p-3">
                        {products.map((product) => (
                          <label
                            key={product._id}
                            className="flex cursor-pointer items-center gap-3 rounded p-2 hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={saleOfferForm.productIds.includes(
                                product._id,
                              )}
                              onChange={() =>
                                handleSaleOfferProductToggle(product._id)
                              }
                              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <img
                              src={resolveMediaUrl(
                                product.image ||
                                  product.thumbnail ||
                                  product.images?.[0]?.url ||
                                  product.images?.[0],
                              )}
                              alt={product.name}
                              className="h-11 w-11 flex-none rounded border border-gray-200 object-cover"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-gray-700">
                                {product.name}
                              </span>
                              <span className="block truncate text-xs text-gray-400">
                                {product.lenses
                                  ? "Lenses"
                                  : product.category || "Product"}
                              </span>
                            </span>
                          </label>
                        ))}

                        {products.length === 0 && (
                          <p className="py-6 text-center text-sm text-gray-400">
                            No products available yet.
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={uploadingSaleOfferBanner}
                      className="flex items-center space-x-2 rounded bg-[#68a300] px-4 py-2 text-white hover:bg-[#5f9600] disabled:opacity-60"
                    >
                      <FaPlus />
                      <span>
                        {uploadingSaleOfferBanner
                          ? "Uploading..."
                          : "Add Sale Offer"}
                      </span>
                    </button>
                  </form>
                </div>

                <div>
                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    {saleOffers.map((offer) => (
                      <div
                        key={offer._id}
                        className="overflow-hidden rounded-xl border bg-white shadow-sm"
                      >
                        <img
                          src={resolveMediaUrl(offer.banner)}
                          alt={offer.name}
                          className="h-44 w-full object-cover"
                        />
                        <div className="space-y-4 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {offer.name}
                              </h3>
                              <p className="mt-1 text-sm text-gray-500">
                                Order: {offer.displayOrder || 0}
                              </p>
                              <p className="mt-1 text-sm text-gray-500">
                                {(offer.products || []).length} product
                                {(offer.products || []).length === 1
                                  ? ""
                                  : "s"}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteSaleOffer(offer._id)}
                              className="text-red-600 hover:text-red-900"
                              aria-label={`Delete ${offer.name}`}
                            >
                              <FaTrash />
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {(offer.products || []).slice(0, 6).map((product) => (
                              <span
                                key={product._id || product}
                                className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                              >
                                {product.name || "Product"}
                              </span>
                            ))}
                            {(offer.products || []).length > 6 && (
                              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                                +{(offer.products || []).length - 6} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {saleOffers.length === 0 && (
                      <div className="rounded-xl border border-dashed p-8 text-center text-gray-400 xl:col-span-2">
                        No sale offers yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Batches Tab */}
          {activeTab === "batches" && (
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Batch Management</h2>
                <p className="text-sm text-gray-500">
                  Total batch stock: {batchStockTotal}
                </p>
              </div>

              <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-[360px,1fr]">
                <div className="rounded-lg border bg-gray-50 p-5">
                  <h3 className="mb-4 text-xl font-semibold">Add New Batch</h3>
                  <form className="space-y-4" onSubmit={handleCreateBatch}>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Product
                      </label>
                      <select
                        value={selectedBatchProductId}
                        onChange={(e) =>
                          setSelectedBatchProductId(e.target.value)
                        }
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        required
                      >
                        {products.map((product) => (
                          <option key={product._id} value={product._id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Batch Number
                      </label>
                      <input
                        type="text"
                        value={batchForm.batchNumber}
                        onChange={(e) =>
                          setBatchForm((prev) => ({
                            ...prev,
                            batchNumber: e.target.value,
                          }))
                        }
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        placeholder="e.g. LOT-2026-001"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={batchForm.quantity}
                        onChange={(e) =>
                          setBatchForm((prev) => ({
                            ...prev,
                            quantity: e.target.value,
                          }))
                        }
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Cost Price
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={batchForm.costPrice}
                        onChange={(e) =>
                          setBatchForm((prev) => ({
                            ...prev,
                            costPrice: e.target.value,
                          }))
                        }
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Purchase Date
                      </label>
                      <input
                        type="date"
                        value={batchForm.purchaseDate}
                        onChange={(e) =>
                          setBatchForm((prev) => ({
                            ...prev,
                            purchaseDate: e.target.value,
                          }))
                        }
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Expiry Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={batchForm.expiryDate}
                        onChange={(e) =>
                          setBatchForm((prev) => ({
                            ...prev,
                            expiryDate: e.target.value,
                          }))
                        }
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={creatingBatch}
                      className="flex items-center space-x-2 rounded bg-[#68a300] px-4 py-2 text-white hover:bg-[#5f9600] disabled:opacity-60"
                    >
                      <FaPlus />
                      <span>{creatingBatch ? "Saving..." : "Add Batch"}</span>
                    </button>
                  </form>
                </div>

                <div>
                  <h3 className="mb-4 text-xl font-semibold">
                    Existing Batches
                  </h3>
                  <p className="mb-3 text-sm text-gray-600">
                    Product: {selectedBatchProduct?.name || "-"}
                  </p>

                  {loadingBatches ? (
                    <div className="rounded-xl border border-dashed p-8 text-center text-gray-400">
                      Loading batches...
                    </div>
                  ) : productBatches.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-8 text-center text-gray-400">
                      No batches found for selected product.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border bg-white">
                      <table className="min-w-full table-auto">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                              Product
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                              Batch Number
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                              Quantity
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                              Remaining
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                              Cost Price
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                              Purchase Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                              Expiry Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {productBatches.map((batch) => (
                            <tr key={batch._id}>
                              <td className="px-4 py-4 text-sm text-gray-700">
                                {selectedBatchProduct?.name || "-"}
                              </td>
                              <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                {batch.batch_number}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-700">
                                {Number(batch.quantity || 0)}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-700">
                                {Number(batch.remaining_quantity || 0)}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-700">
                                ${Number(batch.cost_price || 0).toFixed(2)}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-700">
                                {batch.purchase_date
                                  ? new Date(
                                      batch.purchase_date,
                                    ).toLocaleDateString()
                                  : "-"}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-700">
                                {batch.expiry_date
                                  ? new Date(
                                      batch.expiry_date,
                                    ).toLocaleDateString()
                                  : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* About Video Tab */}
          {activeTab === "about-video" && (
            <div className="p-6 space-y-8">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px,1fr]">
                <div className="rounded-lg border bg-gray-50 p-5">
                  <h2 className="mb-4 text-2xl font-semibold">
                    About Page Video
                  </h2>
                  <form className="space-y-4" onSubmit={handleUploadAboutVideo}>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Upload Video
                      </label>
                      {aboutVideoPreview && (
                        <video
                          src={aboutVideoPreview}
                          controls
                          className="mb-3 h-44 w-full rounded-lg border object-cover"
                        />
                      )}
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (!file) {
                            return;
                          }

                          setAboutVideoFile(file);
                          if (aboutVideoPreview) {
                            URL.revokeObjectURL(aboutVideoPreview);
                          }
                          setAboutVideoPreview(URL.createObjectURL(file));
                        }}
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        Supported: MP4/WebM/OGG, max size 100MB.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={uploadingAboutVideo}
                        className="flex items-center space-x-2 rounded bg-[#68a300] px-4 py-2 text-white hover:bg-[#5f9600] disabled:opacity-60"
                      >
                        <FaVideo />
                        <span>
                          {uploadingAboutVideo ? "Saving..." : "Save Video"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRemoveAboutVideo}
                        disabled={uploadingAboutVideo || !aboutVideoUrl}
                        className="flex items-center space-x-2 rounded border border-red-200 bg-white px-4 py-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <FaTrash />
                        <span>Remove</span>
                      </button>
                    </div>
                  </form>
                </div>

                <div>
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">
                      Current About Video
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <FaVideo />
                      <span>{aboutVideoUrl ? "Configured" : "Not Set"}</span>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border bg-white p-4 shadow-sm">
                    {loadingAboutVideo ? (
                      <div className="flex h-72 items-center justify-center text-gray-400">
                        Loading...
                      </div>
                    ) : aboutVideoUrl ? (
                      <video
                        src={resolveMediaUrl(aboutVideoUrl)}
                        controls
                        className="h-72 w-full rounded-lg bg-black object-contain"
                      />
                    ) : (
                      <div className="flex h-72 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400">
                        No video uploaded yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-semibold">
                    Section After Video Content
                  </h2>
                  <button
                    type="button"
                    onClick={handleResetAboutSectionDefaults}
                    className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Reset Defaults
                  </button>
                </div>

                <form className="space-y-6" onSubmit={handleSaveAboutSection}>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Heading
                    </label>
                    <input
                      type="text"
                      value={aboutSectionHeading}
                      onChange={(e) => setAboutSectionHeading(e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      maxLength={180}
                      placeholder="Enter section heading"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Descriptive Paragraph
                    </label>
                    <textarea
                      value={aboutSectionDescription}
                      onChange={(e) =>
                        setAboutSectionDescription(e.target.value)
                      }
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      rows={4}
                      maxLength={1200}
                      placeholder="Enter section paragraph"
                    />
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-medium text-gray-700">
                      Upload 3 Images
                    </p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {[0, 1, 2].map((index) => {
                        const preview =
                          aboutSectionImagePreviews[index] ||
                          resolveMediaUrl(aboutSectionImages[index]);

                        return (
                          <div
                            key={index}
                            className="rounded-lg border bg-gray-50 p-3"
                          >
                            <p className="mb-2 text-xs font-semibold uppercase text-gray-500">
                              Image {index + 1}
                            </p>
                            {preview ? (
                              <img
                                src={preview}
                                alt={`Section preview ${index + 1}`}
                                className="mb-3 h-28 w-full rounded object-cover"
                              />
                            ) : (
                              <div className="mb-3 flex h-28 items-center justify-center rounded border-2 border-dashed border-gray-300 text-xs text-gray-400">
                                No image selected
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handleAboutSectionImageChange(
                                  index,
                                  e.target.files[0],
                                )
                              }
                              className="w-full rounded border border-gray-300 px-2 py-2 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveAboutSectionImage(index)
                              }
                              className="mt-2 w-full rounded border border-red-200 px-2 py-2 text-xs text-red-600 hover:bg-red-50"
                            >
                              Clear
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingAboutSection}
                    className="inline-flex items-center space-x-2 rounded bg-[#68a300] px-4 py-2 text-white hover:bg-[#5f9600] disabled:opacity-60"
                  >
                    <FaCheck />
                    <span>
                      {savingAboutSection ? "Saving..." : "Save Section"}
                    </span>
                  </button>
                </form>
              </div>

              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-semibold">
                    "Backed by Science" Section Content
                  </h2>
                  <button
                    type="button"
                    onClick={handleResetScienceSectionDefaults}
                    className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Reset Defaults
                  </button>
                </div>

                <form className="space-y-6" onSubmit={handleSaveScienceSection}>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Heading
                    </label>
                    <input
                      type="text"
                      value={scienceHeading}
                      onChange={(e) => setScienceHeading(e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      maxLength={180}
                      placeholder="e.g. We Are Backed By Science"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Descriptive Paragraph
                    </label>
                    <textarea
                      value={scienceDescription}
                      onChange={(e) => setScienceDescription(e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      rows={4}
                      maxLength={1200}
                      placeholder="Enter descriptive paragraph"
                    />
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-medium text-gray-700">
                      Certification Badges (upload 1 or more)
                    </p>

                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) =>
                        handleScienceBadgeImageSelection(e.target.files)
                      }
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    />

                    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                      {scienceBadgeImages.map((badge, index) => (
                        <div
                          key={`${badge}-${index}`}
                          className="rounded border p-2"
                        >
                          <img
                            src={resolveMediaUrl(badge)}
                            alt={`Saved badge ${index + 1}`}
                            className="h-20 w-full rounded object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveSavedScienceBadge(index)}
                            className="mt-2 w-full rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      ))}

                      {scienceBadgeImagePreviews.map((preview, index) => (
                        <div
                          key={`pending-${index}`}
                          className="rounded border border-[#68a300]/40 bg-[#f4faeb] p-2"
                        >
                          <img
                            src={preview}
                            alt={`Pending badge ${index + 1}`}
                            className="h-20 w-full rounded object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleRemovePendingScienceBadge(index)
                            }
                            className="mt-2 w-full rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>

                    <p className="mt-2 text-xs text-gray-400">
                      You can keep up to 8 badge images.
                    </p>
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-medium text-gray-700">
                      Section Image (upload 1 image)
                    </p>

                    {(scienceImagePreview || scienceImage) && (
                      <img
                        src={
                          scienceImagePreview || resolveMediaUrl(scienceImage)
                        }
                        alt="Science section preview"
                        className="mb-3 h-40 w-full max-w-sm rounded-lg border object-cover"
                      />
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleScienceImageChange(e.target.files[0])
                      }
                      className="w-full max-w-sm rounded border border-gray-300 px-3 py-2 text-sm"
                    />

                    <button
                      type="button"
                      onClick={handleRemoveScienceImage}
                      className="mt-2 rounded border border-red-200 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                    >
                      Clear Section Image
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={savingScienceSection}
                    className="inline-flex items-center space-x-2 rounded bg-[#68a300] px-4 py-2 text-white hover:bg-[#5f9600] disabled:opacity-60"
                  >
                    <FaCheck />
                    <span>
                      {savingScienceSection ? "Saving..." : "Save Section"}
                    </span>
                  </button>
                </form>
              </div>

              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-semibold">
                    Why Nutrifactor Section
                  </h2>
                  <button
                    type="button"
                    onClick={handleResetWhyNutrifactorSectionDefaults}
                    className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Reset Defaults
                  </button>
                </div>

                <form
                  className="space-y-6"
                  onSubmit={handleSaveWhyNutrifactorSection}
                >
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Heading
                    </label>
                    <input
                      type="text"
                      value={whyNutrifactorHeading}
                      onChange={(e) => setWhyNutrifactorHeading(e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      maxLength={180}
                      placeholder="e.g. WHY NUTRIFACTOR!"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Descriptive Paragraph
                    </label>
                    <textarea
                      value={whyNutrifactorDescription}
                      onChange={(e) =>
                        setWhyNutrifactorDescription(e.target.value)
                      }
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      rows={5}
                      maxLength={1400}
                      placeholder="Enter Why Nutrifactor paragraph"
                    />
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-medium text-gray-700">
                      Section Image (upload 1 image)
                    </p>

                    {(whyNutrifactorImagePreview || whyNutrifactorImage) && (
                      <img
                        src={
                          whyNutrifactorImagePreview ||
                          resolveMediaUrl(whyNutrifactorImage)
                        }
                        alt="Why Nutrifactor preview"
                        className="mb-3 h-44 w-full max-w-2xl rounded-lg border object-cover"
                      />
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleWhyNutrifactorImageChange(e.target.files[0])
                      }
                      className="w-full max-w-sm rounded border border-gray-300 px-3 py-2 text-sm"
                    />

                    <button
                      type="button"
                      onClick={handleRemoveWhyNutrifactorImage}
                      className="mt-2 rounded border border-red-200 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                    >
                      Clear Section Image
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={savingWhyNutrifactorSection}
                    className="inline-flex items-center space-x-2 rounded bg-[#68a300] px-4 py-2 text-white hover:bg-[#5f9600] disabled:opacity-60"
                  >
                    <FaCheck />
                    <span>
                      {savingWhyNutrifactorSection
                        ? "Saving..."
                        : "Save Section"}
                    </span>
                  </button>
                </form>
              </div>

              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-semibold">
                    Our Mission Section
                  </h2>
                  <button
                    type="button"
                    onClick={handleResetMissionSectionDefaults}
                    className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Reset Defaults
                  </button>
                </div>

                <form className="space-y-6" onSubmit={handleSaveMissionSection}>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Heading
                    </label>
                    <input
                      type="text"
                      value={missionHeading}
                      onChange={(e) => setMissionHeading(e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      maxLength={180}
                      placeholder="Enter mission heading"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Descriptive Paragraph
                    </label>
                    <textarea
                      value={missionDescription}
                      onChange={(e) => setMissionDescription(e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      rows={5}
                      maxLength={1500}
                      placeholder="Enter mission paragraph"
                    />
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-medium text-gray-700">
                      Section Image (upload 1 image)
                    </p>

                    {(missionImagePreview || missionImage) && (
                      <img
                        src={
                          missionImagePreview || resolveMediaUrl(missionImage)
                        }
                        alt="Mission section preview"
                        className="mb-3 h-44 w-full max-w-2xl rounded-lg border object-cover"
                      />
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleMissionImageChange(e.target.files[0])
                      }
                      className="w-full max-w-sm rounded border border-gray-300 px-3 py-2 text-sm"
                    />

                    <button
                      type="button"
                      onClick={handleRemoveMissionImage}
                      className="mt-2 rounded border border-red-200 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                    >
                      Clear Section Image
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={savingMissionSection}
                    className="inline-flex items-center space-x-2 rounded bg-[#68a300] px-4 py-2 text-white hover:bg-[#5f9600] disabled:opacity-60"
                  >
                    <FaCheck />
                    <span>
                      {savingMissionSection ? "Saving..." : "Save Section"}
                    </span>
                  </button>
                </form>
              </div>

              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-semibold">
                    Your Health, Our Priority Section
                  </h2>
                  <button
                    type="button"
                    onClick={handleResetHealthPrioritySectionDefaults}
                    className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Reset Defaults
                  </button>
                </div>

                <form
                  className="space-y-6"
                  onSubmit={handleSaveHealthPrioritySection}
                >
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Heading
                    </label>
                    <input
                      type="text"
                      value={healthPriorityHeading}
                      onChange={(e) => setHealthPriorityHeading(e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      maxLength={180}
                      placeholder="e.g. YOUR HEALTH, OUR PRIORITY"
                    />
                  </div>

                  {[0, 1, 2].map((index) => (
                    <div
                      key={`health-item-${index}`}
                      className="rounded-lg border bg-gray-50 p-4"
                    >
                      <p className="mb-3 text-sm font-semibold text-gray-700">
                        Text Block {index + 1}
                      </p>
                      <input
                        type="text"
                        value={healthPriorityItems[index]?.title || ""}
                        onChange={(e) =>
                          handleHealthPriorityItemChange(
                            index,
                            "title",
                            e.target.value,
                          )
                        }
                        className="mb-3 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        maxLength={180}
                        placeholder="Title"
                      />
                      <textarea
                        value={healthPriorityItems[index]?.description || ""}
                        onChange={(e) =>
                          handleHealthPriorityItemChange(
                            index,
                            "description",
                            e.target.value,
                          )
                        }
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        rows={3}
                        maxLength={1000}
                        placeholder="Description"
                      />
                    </div>
                  ))}

                  <div>
                    <p className="mb-3 text-sm font-medium text-gray-700">
                      Image Grid (upload up to 4 images)
                    </p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {[0, 1, 2, 3].map((index) => {
                        const preview =
                          healthPriorityImagePreviews[index] ||
                          resolveMediaUrl(healthPriorityImages[index]);

                        return (
                          <div
                            key={`health-image-${index}`}
                            className="rounded-lg border bg-gray-50 p-3"
                          >
                            <p className="mb-2 text-xs font-semibold uppercase text-gray-500">
                              Image {index + 1}
                            </p>
                            {preview ? (
                              <img
                                src={preview}
                                alt={`Health Priority preview ${index + 1}`}
                                className="mb-3 h-32 w-full rounded object-cover"
                              />
                            ) : (
                              <div className="mb-3 flex h-32 items-center justify-center rounded border-2 border-dashed border-gray-300 text-xs text-gray-400">
                                No image selected
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handleHealthPriorityImageChange(
                                  index,
                                  e.target.files[0],
                                )
                              }
                              className="w-full rounded border border-gray-300 px-2 py-2 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveHealthPriorityImage(index)
                              }
                              className="mt-2 w-full rounded border border-red-200 px-2 py-2 text-xs text-red-600 hover:bg-red-50"
                            >
                              Clear
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingHealthPrioritySection}
                    className="inline-flex items-center space-x-2 rounded bg-[#68a300] px-4 py-2 text-white hover:bg-[#5f9600] disabled:opacity-60"
                  >
                    <FaCheck />
                    <span>
                      {savingHealthPrioritySection
                        ? "Saving..."
                        : "Save Section"}
                    </span>
                  </button>
                </form>
              </div>

              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-semibold">
                    Meet Our Team Members
                  </h2>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleResetTeamMembersDefaults}
                      className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Clear All
                    </button>
                    <button
                      type="button"
                      onClick={handleAddTeamMember}
                      className="rounded bg-[#68a300] px-3 py-2 text-sm text-white hover:bg-[#5f9600]"
                    >
                      Add Member
                    </button>
                  </div>
                </div>

                <form className="space-y-5" onSubmit={handleSaveTeamMembers}>
                  {teamMembers.length === 0 && (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                      No team members added yet. Click Add Member to start.
                    </div>
                  )}

                  {teamMembers.map((member, index) => (
                    <div
                      key={`team-member-${index}`}
                      className="rounded-lg border bg-gray-50 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-700">
                          Member {index + 1}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleRemoveTeamMember(index)}
                          className="rounded border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <input
                          type="text"
                          value={member.name || ""}
                          onChange={(e) =>
                            handleTeamMemberChange(
                              index,
                              "name",
                              e.target.value,
                            )
                          }
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                          placeholder="Name"
                          maxLength={120}
                        />
                        <input
                          type="text"
                          value={member.role || ""}
                          onChange={(e) =>
                            handleTeamMemberChange(
                              index,
                              "role",
                              e.target.value,
                            )
                          }
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                          placeholder="Role"
                          maxLength={180}
                        />
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr,260px]">
                        <textarea
                          value={member.bio || ""}
                          onChange={(e) =>
                            handleTeamMemberChange(index, "bio", e.target.value)
                          }
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                          rows={3}
                          placeholder="Bio"
                          maxLength={1000}
                        />

                        <div className="rounded border bg-white p-2">
                          <p className="mb-2 text-xs font-semibold uppercase text-gray-500">
                            Member Image
                          </p>
                          {(teamMemberImagePreviews[index] || member.image) && (
                            <img
                              src={
                                teamMemberImagePreviews[index] ||
                                resolveMediaUrl(member.image)
                              }
                              alt={`Team member ${index + 1} preview`}
                              className="mb-2 h-24 w-full rounded object-cover"
                            />
                          )}

                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleTeamMemberImageChange(
                                index,
                                e.target.files[0],
                              )
                            }
                            className="w-full rounded border border-gray-300 px-2 py-2 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveTeamMemberImage(index)}
                            className="mt-2 w-full rounded border border-red-200 px-2 py-2 text-xs text-red-600 hover:bg-red-50"
                          >
                            Clear Image
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="submit"
                    disabled={savingTeamMembers}
                    className="inline-flex items-center space-x-2 rounded bg-[#68a300] px-4 py-2 text-white hover:bg-[#5f9600] disabled:opacity-60"
                  >
                    <FaCheck />
                    <span>
                      {savingTeamMembers ? "Saving..." : "Save Team Members"}
                    </span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Announcements Tab */}
          {activeTab === "announcements" && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Announcements</h2>
                <button
                  onClick={() => {
                    setEditingAnnouncement(null);
                    setAnnouncementForm({
                      title: "",
                      message: "",
                      type: "info",
                      isActive: true,
                      startDate: "",
                      endDate: "",
                    });
                    setShowAnnouncementModal(true);
                  }}
                  className="bg-[#68a300] text-white px-4 py-2 rounded hover:bg-[#5f9600] flex items-center space-x-2"
                >
                  <FaPlus />
                  <span>New Announcement</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Message
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Expires
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {announcements.map((ann) => (
                      <tr key={ann._id}>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          {ann.title}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {ann.message}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2 py-1 text-xs rounded capitalize ${
                              ann.type === "promo"
                                ? "bg-green-100 text-green-800"
                                : ann.type === "warning"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : ann.type === "success"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {ann.type}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2 py-1 text-xs rounded ${ann.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                          >
                            {ann.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {ann.endDate
                            ? new Date(ann.endDate).toLocaleDateString()
                            : "Never"}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium space-x-3">
                          <button
                            onClick={() => {
                              setEditingAnnouncement(ann);
                              setAnnouncementForm({
                                title: ann.title,
                                message: ann.message,
                                type: ann.type,
                                isActive: ann.isActive,
                                startDate: ann.startDate
                                  ? ann.startDate.slice(0, 10)
                                  : "",
                                endDate: ann.endDate
                                  ? ann.endDate.slice(0, 10)
                                  : "",
                              });
                              setShowAnnouncementModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm("Delete this announcement?")) {
                                try {
                                  await dispatch(
                                    deleteAnnouncement(ann._id),
                                  ).unwrap();
                                  toast.success("Announcement deleted");
                                } catch {
                                  toast.error("Failed to delete announcement");
                                }
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {announcements.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-gray-400"
                        >
                          No announcements yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingAnnouncement ? "Edit Announcement" : "New Announcement"}
              </h2>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>
            <form
              className="p-6 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const payload = {
                    ...announcementForm,
                    startDate: announcementForm.startDate || undefined,
                    endDate: announcementForm.endDate || null,
                  };
                  if (editingAnnouncement) {
                    await dispatch(
                      updateAnnouncement({
                        id: editingAnnouncement._id,
                        data: payload,
                      }),
                    ).unwrap();
                    toast.success("Announcement updated");
                  } else {
                    await dispatch(createAnnouncement(payload)).unwrap();
                    toast.success("Announcement created");
                  }
                  setShowAnnouncementModal(false);
                  dispatch(fetchAllAnnouncements());
                } catch {
                  toast.error("Failed to save announcement");
                }
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={announcementForm.title}
                  onChange={(e) =>
                    setAnnouncementForm((f) => ({
                      ...f,
                      title: e.target.value,
                    }))
                  }
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#68a300]"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  required
                  value={announcementForm.message}
                  onChange={(e) =>
                    setAnnouncementForm((f) => ({
                      ...f,
                      message: e.target.value,
                    }))
                  }
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#68a300]"
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={announcementForm.type}
                    onChange={(e) =>
                      setAnnouncementForm((f) => ({
                        ...f,
                        type: e.target.value,
                      }))
                    }
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#68a300]"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="promo">Promo</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={announcementForm.isActive}
                      onChange={(e) =>
                        setAnnouncementForm((f) => ({
                          ...f,
                          isActive: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-[#68a300]"
                    />
                    Active
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={announcementForm.startDate}
                    onChange={(e) =>
                      setAnnouncementForm((f) => ({
                        ...f,
                        startDate: e.target.value,
                      }))
                    }
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#68a300]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={announcementForm.endDate}
                    onChange={(e) =>
                      setAnnouncementForm((f) => ({
                        ...f,
                        endDate: e.target.value,
                      }))
                    }
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#68a300]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-[#68a300] text-white rounded hover:bg-[#5f9600]"
                >
                  {editingAnnouncement ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Add New Product
              </h2>
              <button
                onClick={() => {
                  setShowAddProductModal(false);
                  setAddProductCategory("");
                  setAddProductIsLenses(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <CreateProduct
                key={
                  addProductIsLenses
                    ? LENSES_PRODUCTS_SECTION
                    : addProductCategory || "new-product"
                }
                initialCategory={addProductCategory}
                initialLenses={addProductIsLenses}
                onClose={() => {
                  setShowAddProductModal(false);
                  setAddProductCategory("");
                  setAddProductIsLenses(false);
                }}
                onSuccess={() => {
                  setShowAddProductModal(false);
                  setAddProductCategory("");
                  setAddProductIsLenses(false);
                  dispatch(
                    fetchProducts(
                      getDashboardProductsFetchParams(activeProductCategory),
                    ),
                  ); // Refresh products list
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditProductModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Product
              </h2>
              <button
                onClick={() => {
                  setShowEditProductModal(false);
                  setEditingProduct(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <EditProduct
                product={editingProduct}
                onClose={() => {
                  setShowEditProductModal(false);
                  setEditingProduct(null);
                }}
                onSuccess={() => {
                  setShowEditProductModal(false);
                  setEditingProduct(null);
                  dispatch(
                    fetchProducts(
                      getDashboardProductsFetchParams(activeProductCategory),
                    ),
                  ); // Refresh products list
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Category
              </h2>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>
            <form className="space-y-4 p-6" onSubmit={handleUpdateCategory}>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Category Name
                </label>
                <input
                  type="text"
                  value={categoryEditForm.name}
                  onChange={(e) =>
                    setCategoryEditForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  placeholder="e.g. Skincare"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={categoryEditForm.description}
                  onChange={(e) =>
                    setCategoryEditForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Optional short description for the home page"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Category Image
                </label>
                {(categoryEditImagePreview || categoryEditForm.image) && (
                  <img
                    src={
                      categoryEditImagePreview ||
                      resolveMediaUrl(categoryEditForm.image)
                    }
                    alt="Preview"
                    className="mb-3 h-32 w-full rounded-lg object-cover"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setCategoryEditImageFile(file);
                      const reader = new FileReader();
                      reader.onload = (ev) =>
                        setCategoryEditImagePreview(ev.target.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCategoryEdit}
                  className="rounded bg-[#68a300] px-4 py-2 text-sm text-white hover:bg-[#5f9600] disabled:opacity-60"
                >
                  {savingCategoryEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
