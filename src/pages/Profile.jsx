import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  selectAuthUser,
  selectAuthChecked,
  selectIsAuthenticated,
  deleteAccount,
  updateProfile,
  updateTwoFactorSetting,
  uploadProfilePhoto,
  changePassword,
  selectAuthIsLoading,
  selectAuthError,
  logout,
} from "../store/slices/authSlice";
import { selectOrders, getMyOrders } from "../store/slices/orderSlice";
import { addItemsToCart } from "../store/slices/cartSlice";
import Loader from "../components/Loader";
import toast from "react-hot-toast";
import {
  FaUser,
  FaShoppingBag,
  FaHeart,
  FaCog,
  FaSignOutAlt,
  FaEdit,
  FaSave,
  FaCamera,
  FaEye,
  FaEyeSlash,
  FaClock,
  FaBell,
  FaMapMarkerAlt,
} from "react-icons/fa";

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectAuthUser);
  const authChecked = useSelector(selectAuthChecked);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthIsLoading);
  const authError = useSelector(selectAuthError);
  const userOrders = useSelector(selectOrders);
  const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [wishlistItems, setWishlistItems] = useState([]);
  const [recentlyViewedItems, setRecentlyViewedItems] = useState([]);
  const [addressBook, setAddressBook] = useState([]);
  const [addressForm, setAddressForm] = useState({
    _id: "",
    label: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    isDefault: false,
  });
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [preferences, setPreferences] = useState({
    orderUpdates: true,
    promotions: false,
    restockAlerts: true,
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    Boolean(user?.twoFactorEnabled),
  );
  const [twoFactorPassword, setTwoFactorPassword] = useState("");
  const [showTwoFactorPassword, setShowTwoFactorPassword] = useState(false);
  const [deleteAccountForm, setDeleteAccountForm] = useState({
    currentPassword: "",
    confirmation: "",
  });
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [highlightedOrderId, setHighlightedOrderId] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
  });

  const queryParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const requestedTab = queryParams.get("tab");
  const requestedOrderId = queryParams.get("orderId");

  const getResolvedNameParts = (currentUser) => {
    const fullName = String(currentUser?.name || "").trim();
    const [derivedFirstName = "", ...restNameParts] = fullName.split(" ");
    const derivedLastName = restNameParts.join(" ");

    return {
      firstName: currentUser?.firstName || derivedFirstName || "",
      lastName: currentUser?.lastName || derivedLastName || "",
    };
  };

  useEffect(() => {
    if (requestedTab === "orders") {
      setActiveTab("orders");
    }
  }, [requestedTab]);

  useEffect(() => {
    if (
      activeTab !== "orders" ||
      !requestedOrderId ||
      userOrders.length === 0
    ) {
      return;
    }

    const matchedOrder = userOrders.find(
      (order) => String(order._id) === String(requestedOrderId),
    );

    if (!matchedOrder) {
      return;
    }

    const matchedOrderId = String(matchedOrder._id);
    setHighlightedOrderId(matchedOrderId);

    const targetElement = document.getElementById(
      `profile-order-${matchedOrderId}`,
    );
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    const timeoutId = window.setTimeout(() => {
      setHighlightedOrderId((current) =>
        current === matchedOrderId ? "" : current,
      );
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [activeTab, requestedOrderId, userOrders]);

  useEffect(() => {
    if (!authChecked) {
      return;
    }

    if (!isAuthenticated) {
      navigate("/login", {
        replace: true,
        state: {
          from: {
            pathname: location.pathname,
            search: location.search,
          },
        },
      });
      return;
    }

    if (user) {
      const resolvedNames = getResolvedNameParts(user);

      setFormData({
        firstName: resolvedNames.firstName,
        lastName: resolvedNames.lastName,
        email: user.email || "",
        phone: user.phone || "",
        address: {
          street: user.shippingAddress?.street || "",
          city: user.shippingAddress?.city || "",
          state: user.shippingAddress?.state || "",
          zipCode: user.shippingAddress?.zipCode || "",
          country: user.shippingAddress?.country || "",
        },
      });
      setAddressBook(
        Array.isArray(user.addressBook) && user.addressBook.length > 0
          ? user.addressBook
          : user.shippingAddress?.street ||
              user.shippingAddress?.city ||
              user.shippingAddress?.state ||
              user.shippingAddress?.zipCode ||
              user.shippingAddress?.country
            ? [
                {
                  _id: "primary-address",
                  label: "Primary",
                  ...user.shippingAddress,
                  isDefault: true,
                },
              ]
            : [],
      );
      setTwoFactorEnabled(Boolean(user.twoFactorEnabled));
    }

    if (activeTab === "orders") {
      dispatch(getMyOrders());
    }
  }, [
    activeTab,
    authChecked,
    dispatch,
    isAuthenticated,
    location.pathname,
    location.search,
    navigate,
    user,
  ]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("profilePreferences");
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === "object") {
        setPreferences((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore malformed local storage data
    }
  }, []);

  useEffect(() => {
    if (activeTab !== "wishlist") return;
    try {
      const raw = localStorage.getItem("wishlistItems");
      const parsed = raw ? JSON.parse(raw) : [];
      setWishlistItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setWishlistItems([]);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "recently-viewed") return;
    try {
      const raw = localStorage.getItem("recentlyViewedItems");
      const parsed = raw ? JSON.parse(raw) : [];
      setRecentlyViewedItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setRecentlyViewedItems([]);
    }
  }, [activeTab]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      await dispatch(
        updateProfile({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          shippingAddress: formData.address,
        }),
      ).unwrap();
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error || "Failed to update profile");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form data to original user data
    if (user) {
      const resolvedNames = getResolvedNameParts(user);

      setFormData({
        firstName: resolvedNames.firstName,
        lastName: resolvedNames.lastName,
        email: user.email || "",
        phone: user.phone || "",
        address: {
          street: user.shippingAddress?.street || "",
          city: user.shippingAddress?.city || "",
          state: user.shippingAddress?.state || "",
          zipCode: user.shippingAddress?.zipCode || "",
          country: user.shippingAddress?.country || "",
        },
      });
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handlePasswordFieldChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword.trim()) {
      toast.error("Current password is required.");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New password and confirm password must match.");
      return;
    }

    try {
      await dispatch(
        changePassword({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      ).unwrap();

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Password changed successfully!");
    } catch (error) {
      toast.error(error || "Failed to change password");
    }
  };

  const avatarCandidates = useMemo(() => {
    if (!user?.avatar) return [];

    if (
      user.avatar.startsWith("http://") ||
      user.avatar.startsWith("https://")
    ) {
      return [user.avatar];
    }

    if (user.avatar.startsWith("/uploads/")) {
      const sameOrigin =
        typeof window !== "undefined"
          ? `${window.location.origin}${user.avatar}`
          : user.avatar;
      return [`${API_URL}${user.avatar}`, sameOrigin, user.avatar];
    }

    return [user.avatar];
  }, [API_URL, user?.avatar]);

  const [avatarSrcIndex, setAvatarSrcIndex] = useState(0);

  useEffect(() => {
    setAvatarSrcIndex(0);
  }, [avatarCandidates.length, user?.avatar]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be 5MB or less.");
      e.target.value = "";
      return;
    }

    try {
      await dispatch(uploadProfilePhoto(file)).unwrap();
      toast.success("Profile photo updated successfully!");
    } catch (error) {
      toast.error(error || "Failed to upload profile photo");
    } finally {
      e.target.value = "";
    }
  };

  const handleRemoveWishlistItem = (productId) => {
    const nextItems = wishlistItems.filter(
      (item) => String(item?._id) !== String(productId),
    );
    setWishlistItems(nextItems);
    localStorage.setItem("wishlistItems", JSON.stringify(nextItems));
    toast.success("Removed from wishlist");
  };

  const handleAddressFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetAddressForm = () => {
    setAddressForm({
      _id: "",
      label: "",
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      isDefault: false,
    });
    setIsEditingAddress(false);
  };

  const persistAddressBook = async (nextAddressBook, message) => {
    const normalizedBook = nextAddressBook.map((entry, index) => ({
      ...entry,
      isDefault: nextAddressBook.some((item) => item.isDefault)
        ? entry.isDefault
        : index === 0,
    }));

    try {
      await dispatch(updateProfile({ addressBook: normalizedBook })).unwrap();
      setAddressBook(normalizedBook);
      if (message) {
        toast.success(message);
      }
    } catch (error) {
      toast.error(error || "Failed to update address book");
    }
  };

  const handleSaveAddress = async () => {
    if (
      !addressForm.street.trim() ||
      !addressForm.city.trim() ||
      !addressForm.state.trim() ||
      !addressForm.zipCode.trim() ||
      !addressForm.country.trim()
    ) {
      toast.error("Please fill in all address fields.");
      return;
    }

    const entryId =
      addressForm._id || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const nextEntry = {
      ...addressForm,
      _id: entryId,
      label: addressForm.label.trim() || `Address ${addressBook.length + 1}`,
      street: addressForm.street.trim(),
      city: addressForm.city.trim(),
      state: addressForm.state.trim(),
      zipCode: addressForm.zipCode.trim(),
      country: addressForm.country.trim(),
    };

    let nextAddressBook = isEditingAddress
      ? addressBook.map((entry) =>
          String(entry._id) === String(entryId) ? nextEntry : entry,
        )
      : [nextEntry, ...addressBook];

    if (nextEntry.isDefault || nextAddressBook.length === 1) {
      nextAddressBook = nextAddressBook.map((entry) => ({
        ...entry,
        isDefault: String(entry._id) === String(entryId),
      }));
    }

    await persistAddressBook(
      nextAddressBook,
      isEditingAddress ? "Address updated" : "Address added",
    );
    resetAddressForm();
  };

  const handleEditAddress = (entry) => {
    setAddressForm({
      _id: entry._id,
      label: entry.label || "",
      street: entry.street || "",
      city: entry.city || "",
      state: entry.state || "",
      zipCode: entry.zipCode || "",
      country: entry.country || "",
      isDefault: Boolean(entry.isDefault),
    });
    setIsEditingAddress(true);
    setActiveTab("addresses");
  };

  const handleDeleteAddress = async (entryId) => {
    let nextAddressBook = addressBook.filter(
      (entry) => String(entry._id) !== String(entryId),
    );
    if (
      nextAddressBook.length > 0 &&
      !nextAddressBook.some((entry) => entry.isDefault)
    ) {
      nextAddressBook = nextAddressBook.map((entry, index) => ({
        ...entry,
        isDefault: index === 0,
      }));
    }
    await persistAddressBook(nextAddressBook, "Address removed");
    if (String(addressForm._id) === String(entryId)) {
      resetAddressForm();
    }
  };

  const handleSetDefaultAddress = async (entryId) => {
    const nextAddressBook = addressBook.map((entry) => ({
      ...entry,
      isDefault: String(entry._id) === String(entryId),
    }));
    await persistAddressBook(nextAddressBook, "Default address updated");
  };

  const handleReorder = (order) => {
    const reorderItems = (order?.orderItems || [])
      .map((item) => {
        const productId = item?.product?._id || item?.product;
        if (!productId) return null;

        return {
          product: {
            _id: productId,
            name: item?.product?.name || item?.name || "Product",
            image: item?.product?.image || item?.image || "",
            images: item?.product?.images || [],
            description: item?.product?.shortDescription || "",
            price: Number(item?.price || 0),
            stock: Number(item?.product?.stock || 9999),
          },
          quantity: Number(item?.quantity || 1),
          price: Number(item?.price || 0),
        };
      })
      .filter(Boolean);

    if (reorderItems.length === 0) {
      toast.error("No reorderable items found in this order.");
      return;
    }

    dispatch(addItemsToCart(reorderItems));
    toast.success("Items added to cart");
    navigate("/cart");
  };

  const handleViewDetails = (order) => {
    navigate(`/orders/${order._id}`);
  };

  const getProductImage = (product, fallback = "") => {
    const rawImage =
      product?.image ||
      product?.images?.[0]?.url ||
      product?.images?.[0] ||
      fallback;
    if (!rawImage) return "/placeholder-product.jpg";
    if (/^https?:\/\//i.test(rawImage)) return rawImage;
    if (rawImage === "/placeholder-product.jpg") return rawImage;
    if (rawImage.startsWith("/uploads/")) return `${SERVER_URL}${rawImage}`;
    return rawImage;
  };

  const handleClearWishlist = () => {
    setWishlistItems([]);
    localStorage.setItem("wishlistItems", JSON.stringify([]));
    toast.success("Wishlist cleared");
  };

  const handleTogglePreference = (key) => {
    setPreferences((prev) => {
      const next = {
        ...prev,
        [key]: !prev[key],
      };
      localStorage.setItem("profilePreferences", JSON.stringify(next));
      return next;
    });
  };

  const handleToggleTwoFactor = async () => {
    const nextValue = !twoFactorEnabled;

    if (!twoFactorPassword.trim()) {
      toast.error("Enter your current password to change two-factor settings");
      return;
    }

    try {
      const result = await dispatch(
        updateTwoFactorSetting({
          enabled: nextValue,
          currentPassword: twoFactorPassword,
        }),
      ).unwrap();

      setTwoFactorEnabled(Boolean(result.enabled));
      setTwoFactorPassword("");
      toast.success(
        result.message ||
          (nextValue
            ? "Two-factor authentication enabled"
            : "Two-factor authentication disabled"),
      );
    } catch (error) {
      toast.error(error || "Failed to update two-factor settings");
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteAccountForm.currentPassword.trim()) {
      toast.error("Enter your current password to delete your account");
      return;
    }

    if (deleteAccountForm.confirmation.trim() !== "DELETE") {
      toast.error('Type "DELETE" to confirm account deletion');
      return;
    }

    try {
      const message = await dispatch(
        deleteAccount({
          currentPassword: deleteAccountForm.currentPassword,
        }),
      ).unwrap();

      toast.success(message || "Account deleted successfully");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(error || "Failed to delete account");
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

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (!user) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center mb-6">
                <div className="relative mx-auto mb-4 h-20 w-20">
                  <div className="h-20 w-20 overflow-hidden rounded-full bg-green-100">
                    {user.avatar ? (
                      <img
                        src={avatarCandidates[avatarSrcIndex] || ""}
                        alt={[user.firstName, user.lastName]
                          .filter(Boolean)
                          .join(" ")}
                        className="h-full w-full object-cover"
                        onError={() => {
                          if (avatarSrcIndex < avatarCandidates.length - 1) {
                            setAvatarSrcIndex((prev) => prev + 1);
                          }
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <FaUser className="text-2xl text-green-600" />
                      </div>
                    )}
                  </div>
                  <label
                    htmlFor="profile-photo-upload"
                    className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-green-600 p-1.5 text-white hover:bg-green-700"
                    title="Upload profile photo"
                  >
                    <FaCamera className="text-xs" />
                  </label>
                  <input
                    id="profile-photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={isLoading}
                  />
                </div>
                <h2 className="text-[18px] font-semibold text-gray-800">
                  {[user.firstName, user.lastName].filter(Boolean).join(" ")}
                </h2>
                <p className="break-all text-gray-600 text-[14px]">
                  {user.email}
                </p>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left outline-none ring-0 focus:outline-none focus:ring-0 transition-none ${
                    activeTab === "profile"
                      ? "bg-green-50 text-green-700 border border-green-200 hover:border-green-200 focus:border-green-200"
                      : "border border-transparent text-gray-700 hover:bg-gray-50 hover:border-transparent hover:outline-none hover:ring-0"
                  }`}
                >
                  <FaUser />
                  <span>Profile</span>
                </button>

                <button
                  onClick={() => setActiveTab("orders")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-[14px] outline-none ring-0 focus:outline-none focus:ring-0 transition-none ${
                    activeTab === "orders"
                      ? "bg-green-50 text-green-700 border border-green-200 hover:border-green-200 focus:border-green-200"
                      : "border border-transparent text-gray-700 hover:bg-gray-50 hover:border-transparent hover:outline-none hover:ring-0"
                  }`}
                >
                  <FaShoppingBag />
                  <span>Orders</span>
                </button>

                <button
                  onClick={() => setActiveTab("wishlist")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-[14px] outline-none ring-0 focus:outline-none focus:ring-0 transition-none ${
                    activeTab === "wishlist"
                      ? "bg-green-50 text-green-700 border border-green-200 hover:border-green-200 focus:border-green-200"
                      : "border border-transparent text-gray-700 hover:bg-gray-50 hover:border-transparent hover:outline-none hover:ring-0"
                  }`}
                >
                  <FaHeart />
                  <span>Wishlist</span>
                </button>

                <button
                  onClick={() => setActiveTab("addresses")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-[14px] outline-none ring-0 focus:outline-none focus:ring-0 transition-none ${
                    activeTab === "addresses"
                      ? "bg-green-50 text-green-700 border border-green-200 hover:border-green-200 focus:border-green-200"
                      : "border border-transparent text-gray-700 hover:bg-gray-50 hover:border-transparent hover:outline-none hover:ring-0"
                  }`}
                >
                  <FaMapMarkerAlt />
                  <span>Addresses</span>
                </button>

                <button
                  onClick={() => setActiveTab("recently-viewed")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-[14px] outline-none ring-0 focus:outline-none focus:ring-0 transition-none ${
                    activeTab === "recently-viewed"
                      ? "bg-green-50 text-green-700 border border-green-200 hover:border-green-200 focus:border-green-200"
                      : "border border-transparent text-gray-700 hover:bg-gray-50 hover:border-transparent hover:outline-none hover:ring-0"
                  }`}
                >
                  <FaClock />
                  <span>Recently Viewed</span>
                </button>

                <button
                  onClick={() => setActiveTab("settings")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-[14px] outline-none ring-0 focus:outline-none focus:ring-0 transition-none ${
                    activeTab === "settings"
                      ? "bg-green-50 text-green-700 border border-green-200 hover:border-green-200 focus:border-green-200"
                      : "border border-transparent text-gray-700 hover:bg-gray-50 hover:border-transparent hover:outline-none hover:ring-0"
                  }`}
                >
                  <FaCog />
                  <span>Settings</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-[14px] border-0 text-red-600 hover:bg-red-50 hover:border-0 hover:outline-none hover:ring-0 outline-none ring-0 focus:outline-none focus:ring-0"
                >
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[20px] font-semibold text-gray-800">
                    Profile Information
                  </h3>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-[14px] flex items-center space-x-1 text-blue-600 px-4 py-2 hover:bg-white focus:outline-none border-0"
                      style={{ boxShadow: "none" }}
                    >
                      {/* <FaEdit /> */}
                      <span>Edit</span>
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={isLoading}
                        className="text-[14px] flex items-center space-x-2 text-blue-600 px-4 py-2 hover:bg-white focus:outline-none border-0 disabled:opacity-50"
                      >
                        {/* <FaSave /> */}
                        <span>Save</span>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="text-[14px] flex items-center space-x-1 text-red-600 px-4 py-2 hover:bg-white focus:outline-none border-0"
                      >
                        {/* <FaTimes /> */}
                        <span>Cancel</span>
                      </button>
                    </div>
                  )}
                </div>

                {authError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">
                    {authError}
                  </div>
                )}

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Wishlist Items
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-gray-800">
                      {wishlistItems.length}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Orders Placed
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-gray-800">
                      {userOrders.length}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Member Since
                    </p>
                    <p className="mt-2 text-sm font-semibold text-gray-800">
                      {new Date(
                        user.createdAt || Date.now(),
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-0 disabled:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-0 disabled:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-0 disabled:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-0 disabled:bg-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <h4 className="text-lg font-medium text-gray-800 mb-4">
                      Address
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Street Address
                        </label>
                        <input
                          type="text"
                          name="address.street"
                          value={formData.address.street}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-0 disabled:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          name="address.city"
                          value={formData.address.city}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-0 disabled:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State
                        </label>
                        <input
                          type="text"
                          name="address.state"
                          value={formData.address.state}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-0 disabled:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          name="address.zipCode"
                          value={formData.address.zipCode}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-0 disabled:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <input
                          type="text"
                          name="address.country"
                          value={formData.address.country}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-0 disabled:bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                <h3 className="text-[20px] font-semibold text-gray-800">
                  Order History
                </h3>

                {userOrders.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <FaShoppingBag className="mx-auto text-4xl text-gray-300 mb-4" />
                    <h4 className="text-[18px] font-medium text-gray-600 mb-2">
                      No orders yet
                    </h4>
                    <p className="text-[14px] text-gray-500 mb-4">
                      Start shopping to see your order history here.
                    </p>
                    <button
                      onClick={() => navigate("/products")}
                      className="text-[14px] bg-[#232323] text-white px-4 py-2 hover:bg-[#ffffff] hover:text-[#232323] border border-[#232323] hover:border-[#232323] transition-colors duration-300"
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  userOrders.map((order) => (
                    <div
                      id={`profile-order-${order._id}`}
                      key={order._id}
                      className={`bg-white rounded-lg shadow-md p-6 transition-all duration-300 ${
                        highlightedOrderId === String(order._id)
                          ? "ring-2 ring-green-400 shadow-lg"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold">
                            Order #{order._id.slice(-8)}
                          </h4>
                          <p className="text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(order.status)}`}
                        >
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        {order.orderItems.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-4"
                          >
                            <img
                              src={getProductImage(item.product, item.image)}
                              alt={item.product?.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div className="flex-1">
                              <p className="font-medium">
                                {item.product?.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                Quantity: {item.quantity} ×{" "}
                                {item.price?.toFixed(2)}
                              </p>
                            </div>
                            <p className="font-semibold">
                              Rs. {(item.quantity * item.price).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="border-t pt-4 flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600">
                            Total: Rs. {order.totalPrice?.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Payment:{" "}
                            {order.paymentMethod === "demo"
                              ? "Demo Order"
                              : order.paymentMethod}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => handleViewDetails(order)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            View Details
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReorder(order)}
                            className="rounded border border-green-200 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
                          >
                            Reorder
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "addresses" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="mb-6 flex items-center gap-2">
                    {/* <FaMapMarkerAlt className="text-gray-500" /> */}
                    <h3 className="text-[20px] font-semibold text-gray-800">
                      Address Book
                    </h3>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-4">
                      {addressBook.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-[14px] text-gray-500">
                          No saved addresses yet.
                        </div>
                      ) : (
                        addressBook.map((entry) => (
                          <div
                            key={entry._id}
                            className="rounded-lg border border-gray-200 p-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-semibold text-gray-800">
                                  {entry.label}
                                </p>
                                {entry.isDefault ? (
                                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-green-700">
                                    Default address
                                  </p>
                                ) : null}
                                <p className="mt-2 text-sm text-gray-600">
                                  {entry.street}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {entry.city}, {entry.state} {entry.zipCode}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {entry.country}
                                </p>
                              </div>
                              <div className="flex flex-col gap-2">
                                {!entry.isDefault ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSetDefaultAddress(entry._id)
                                    }
                                    className="rounded border border-green-200 px-3 py-2 text-sm text-green-700 hover:bg-green-50"
                                  >
                                    Set Default
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => handleEditAddress(entry)}
                                  className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAddress(entry._id)}
                                  className="rounded border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="rounded-lg border border-gray-200 p-5">
                      <h4 className="mb-4 text-[18px] font-medium text-gray-800">
                        {isEditingAddress ? "Edit Address" : "Add New Address"}
                      </h4>
                      <div className="space-y-4">
                        <input
                          type="text"
                          name="label"
                          value={addressForm.label}
                          onChange={handleAddressFieldChange}
                          placeholder="Label (e.g. Home, Office)"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-0 text-[14px]"
                        />
                        <input
                          type="text"
                          name="street"
                          value={addressForm.street}
                          onChange={handleAddressFieldChange}
                          placeholder="Street address"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-0 text-[14px]"
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            name="city"
                            value={addressForm.city}
                            onChange={handleAddressFieldChange}
                            placeholder="City"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-0 text-[14px]"
                          />
                          <input
                            type="text"
                            name="state"
                            value={addressForm.state}
                            onChange={handleAddressFieldChange}
                            placeholder="State"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-0 text-[14px]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            name="zipCode"
                            value={addressForm.zipCode}
                            onChange={handleAddressFieldChange}
                            placeholder="ZIP code"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-0 text-[14px]"
                          />
                          <input
                            type="text"
                            name="country"
                            value={addressForm.country}
                            onChange={handleAddressFieldChange}
                            placeholder="Country"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-0 text-[14px]"
                          />
                        </div>
                        <label className="flex items-center gap-2 text-[14px] text-gray-700">
                          <input
                            type="checkbox"
                            name="isDefault"
                            checked={addressForm.isDefault}
                            onChange={handleAddressFieldChange}
                          />
                          Set as default shipping address
                        </label>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={handleSaveAddress}
                            disabled={isLoading}
                            className="bg-[#232323] px-4 py-2 text-white hover:bg-[#ffffff] hover:border-[#232323] hover:text-[#232323] disabled:opacity-50 transition-colors duration-300"
                          >
                            {isEditingAddress
                              ? "Update Address"
                              : "Save Address"}
                          </button>
                          {isEditingAddress ? (
                            <button
                              type="button"
                              onClick={resetAddressForm}
                              className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === "wishlist" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <h3 className="text-[20px] font-semibold text-gray-800">
                    Wishlist
                  </h3>
                  {wishlistItems.length > 0 ? (
                    <button
                      type="button"
                      onClick={handleClearWishlist}
                      className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Clear All
                    </button>
                  ) : null}
                </div>
                {wishlistItems.length === 0 ? (
                  <div className="text-center py-12">
                    <FaHeart className="mx-auto text-4xl text-gray-300 mb-4" />
                    <h4 className="text-[18px] font-medium text-gray-600 mb-2">
                      Your wishlist is empty
                    </h4>
                    <p className="text-[14px] text-gray-500 mb-4">
                      Save items you love for later.
                    </p>
                    <button
                      onClick={() => navigate("/products")}
                      className="text-[14px] bg-[#232323] text-white px-4 py-2 hover:bg-[#ffffff] hover:text-[#232323] border border-[#232323] hover:border-[#232323] transition-colors duration-300"
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {wishlistItems.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center justify-between gap-4 rounded border border-gray-200 p-4"
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <img
                            src={item.image || "/placeholder-product.jpg"}
                            alt={item.name}
                            className="h-14 w-14 rounded object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-800">
                              {item.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              ${Number(item.price || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/products/${item._id}`)}
                            className="rounded bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveWishlistItem(item._id)}
                            className="rounded border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "recently-viewed" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="mb-6 text-[20px] font-semibold text-gray-800">
                  Recently Viewed
                </h3>
                {recentlyViewedItems.length === 0 ? (
                  <div className="text-center py-12">
                    <FaClock className="mx-auto mb-4 text-4xl text-gray-300" />
                    <h4 className="mb-2 text-[18px] font-medium text-gray-600">
                      No recently viewed products
                    </h4>
                    <p className="text-[14px] mb-4 text-gray-500">
                      Products you open will appear here for quick access.
                    </p>
                    <button
                      onClick={() => navigate("/products")}
                      className="text-[14px] bg-[#232323] text-white px-4 py-2 hover:bg-[#ffffff] hover:text-[#232323] border border-[#232323] hover:border-[#232323] transition-colors duration-300"
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentlyViewedItems.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center justify-between gap-4 rounded border border-gray-200 p-4"
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <img
                            src={item.image || "/placeholder-product.jpg"}
                            alt={item.name}
                            className="h-14 w-14 rounded object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-800">
                              {item.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              ${Number(item.price || 0).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Viewed{" "}
                              {new Date(
                                item.viewedAt || Date.now(),
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(`/products/${item._id}`)}
                          className="rounded bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-[20px] font-semibold text-gray-800 mb-6">
                  Account Settings
                </h3>

                <div className="space-y-6">
                  <div>
                    <div className="mb-4 flex items-center gap-2">
                      <FaBell className="text-gray-500" />
                      <h4 className="text-[18px] font-medium">Notifications</h4>
                    </div>
                    <div className="space-y-3 rounded-lg border border-gray-200 p-4">
                      {[
                        ["orderUpdates", "Order updates"],
                        ["promotions", "Promotions and offers"],
                        ["restockAlerts", "Restock alerts"],
                      ].map(([key, label]) => (
                        <label
                          key={key}
                          className="flex items-center justify-between gap-4"
                        >
                          <span className="text-[14px] text-gray-700">
                            {label}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleTogglePreference(key)}
                            className={`relative h-7 w-14 rounded-full border-0 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-0 flex-shrink-0 ${
                              preferences[key]
                                ? "bg-green-600 shadow-sm"
                                : "bg-gray-300"
                            }`}
                            aria-pressed={preferences[key]}
                          >
                            <span
                              className={`absolute top-1/2 left-1 -translate-y-1/2 h-5 w-5 rounded-full bg-white transition-transform duration-200 shadow-md ${
                                preferences[key]
                                  ? "translate-x-7"
                                  : "translate-x-0"
                              }`}
                            />
                          </button>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[18px] font-medium mb-4">Security</h4>
                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-[16px] font-medium text-gray-800">
                            Two-factor authentication (Email OTP)
                          </p>
                          <p className="text-[14px] text-gray-500 mt-1">
                            When enabled, login requires a 6-digit code sent to
                            your email.
                          </p>
                          <div className="relative mt-4 max-w-sm">
                            <input
                              type={showTwoFactorPassword ? "text" : "password"}
                              value={twoFactorPassword}
                              onChange={(e) =>
                                setTwoFactorPassword(e.target.value)
                              }
                              placeholder="Current password"
                              className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-0 text-[14px"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowTwoFactorPassword((prev) => !prev)
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent text-gray-500 hover:text-gray-700 focus:outline-none"
                              aria-label={
                                showTwoFactorPassword
                                  ? "Hide current password"
                                  : "Show current password"
                              }
                            >
                              {showTwoFactorPassword ? (
                                <FaEyeSlash />
                              ) : (
                                <FaEye />
                              )}
                            </button>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleToggleTwoFactor}
                          disabled={isLoading}
                          className={`relative h-7 w-14 rounded-full border-0 transition-all duration-200 cursor-pointer focus:outline-none focus:border-0 focus:ring-0 flex-shrink-0 ${
                            twoFactorEnabled
                              ? "bg-green-600 shadow-sm"
                              : "bg-gray-300"
                          } ${isLoading ? "opacity-50" : ""}`}
                          aria-pressed={twoFactorEnabled}
                        >
                          <span
                            className={`absolute top-1/2 left-1 -translate-y-1/2 h-5 w-5 rounded-full bg-white transition-transform duration-200 shadow-md ${
                              twoFactorEnabled
                                ? "translate-x-7"
                                : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[18px] font-medium mb-4">
                      Change Password
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="relative">
                        <input
                          type={
                            showPassword.currentPassword ? "text" : "password"
                          }
                          placeholder="Current password"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:outline-none focus:ring-0 text-[14px]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            togglePasswordVisibility("currentPassword")
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-0 focus-visible:outline-none"
                          aria-label={
                            showPassword.currentPassword
                              ? "Hide current password"
                              : "Show current password"
                          }
                        >
                          {showPassword.currentPassword ? (
                            <FaEyeSlash />
                          ) : (
                            <FaEye />
                          )}
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword.newPassword ? "text" : "password"}
                          placeholder="New password"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:outline-none focus:ring-0 text-[14px]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            togglePasswordVisibility("newPassword")
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-0 focus-visible:outline-none"
                          aria-label={
                            showPassword.newPassword
                              ? "Hide new password"
                              : "Show new password"
                          }
                        >
                          {showPassword.newPassword ? (
                            <FaEyeSlash />
                          ) : (
                            <FaEye />
                          )}
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={
                            showPassword.confirmPassword ? "text" : "password"
                          }
                          placeholder="Confirm new password"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:outline-none focus:ring-0 text-[14px]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            togglePasswordVisibility("confirmPassword")
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-0 focus-visible:outline-none"
                          aria-label={
                            showPassword.confirmPassword
                              ? "Hide confirm password"
                              : "Show confirm password"
                          }
                        >
                          {showPassword.confirmPassword ? (
                            <FaEyeSlash />
                          ) : (
                            <FaEye />
                          )}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleChangePassword}
                        disabled={isLoading}
                        className="text-[14px] bg-[#232323] text-white px-4 py-2 hover:bg-[#ffffff] hover:text-[#232323] border border-[#232323] hover:border-[#232323] transition-colors duration-300 disabled:opacity-50"
                      >
                        {isLoading ? "Updating..." : "Update Password"}
                      </button>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="text-[18px] font-medium mb-4 text-red-600">
                      Danger Zone
                    </h4>
                    <div className="space-y-4 rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="text-[14px] text-red-700">
                        Deleting your account is permanent. Your profile and
                        saved account access will be removed.
                      </p>
                      <div className="relative max-w-md">
                        <input
                          type={showDeletePassword ? "text" : "password"}
                          value={deleteAccountForm.currentPassword}
                          onChange={(e) =>
                            setDeleteAccountForm((prev) => ({
                              ...prev,
                              currentPassword: e.target.value,
                            }))
                          }
                          placeholder="Current password"
                          className="w-full rounded-md border border-red-200 bg-white px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-0"
                        />
                        <button
                          type="button"
                          onClick={() => setShowDeletePassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent text-gray-500 hover:text-gray-700 focus:outline-none"
                          aria-label={
                            showDeletePassword
                              ? "Hide delete password"
                              : "Show delete password"
                          }
                        >
                          {showDeletePassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      <input
                        type="text"
                        value={deleteAccountForm.confirmation}
                        onChange={(e) =>
                          setDeleteAccountForm((prev) => ({
                            ...prev,
                            confirmation: e.target.value,
                          }))
                        }
                        placeholder='Type "DELETE" to confirm'
                        className="max-w-md w-full rounded-md border border-red-200 bg-white px-3 py-2 text-[14px] focus:outline-none focus:ring-0 mb-3"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleDeleteAccount}
                          disabled={isLoading}
                          className="bg-red-800 text-white px-4 py-2 hover:bg-[#ffffff] hover:text-red-800 hover:border-red-800 disabled:opacity-50 transition-colors duration-300 text-[14px]"
                        >
                          {isLoading ? "Deleting..." : "Delete Account"}
                        </button>
                      </div>
                    </div>
                    <p className="text-[14px] text-gray-500 mt-2">
                      This action cannot be undone. All your data will be
                      permanently deleted.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
