import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  selectCartItems,
  selectCartTotal,
  selectCartItemCount,
} from "../store/slices/cartSlice";
import { selectAuthUser } from "../store/slices/authSlice";
import { createOrder } from "../store/slices/orderSlice";
import Loader from "../components/Loader";
import toast from "react-hot-toast";
import { FaCreditCard, FaTruck, FaMapMarkerAlt } from "react-icons/fa";

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const cartItems = useSelector(selectCartItems);
  const cartTotal = useSelector(selectCartTotal);
  const itemCount = useSelector(selectCartItemCount);
  const user = useSelector(selectAuthUser);
  const API_URL = import.meta.env.VITE_API_URL || "/api";
  const SERVER_URL = API_URL.replace(/\/api\/?$/, "");

  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });
  const [selectedAddressId, setSelectedAddressId] = useState("");

  const [paymentMethod] = useState("demo");
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPlacedOrder, setHasPlacedOrder] = useState(false);
  const TAX_RATE = 0.08;
  const subtotal = Number(cartTotal || 0);
  const taxAmount = Number((subtotal * TAX_RATE).toFixed(2));
  const grandTotal = Number((subtotal + taxAmount).toFixed(2));

  const getProductImage = (product) => {
    const rawImage =
      product?.image || product?.images?.[0]?.url || product?.images?.[0];
    if (!rawImage) return "/placeholder-product.jpg";
    if (/^https?:\/\//i.test(rawImage)) return rawImage;
    if (rawImage === "/placeholder-product.jpg") return rawImage;
    if (rawImage.startsWith("/uploads/")) return `${SERVER_URL}${rawImage}`;
    return rawImage;
  };

  useEffect(() => {
    if (itemCount === 0 && !isProcessing && !hasPlacedOrder) {
      navigate("/cart");
      return;
    }
  }, [itemCount, isProcessing, hasPlacedOrder, navigate]);

  useEffect(() => {
    if (!user) return;

    const fullName = String(user.name || "").trim();
    const [derivedFirstName = "", ...restNameParts] = fullName.split(" ");
    const derivedLastName = restNameParts.join(" ");

    const accountFirstName = user.firstName || derivedFirstName || "";
    const accountLastName = user.lastName || derivedLastName || "";
    const accountEmail = user.email || "";
    const accountPhone = user.phone || "";

    const savedAddresses = Array.isArray(user.addressBook)
      ? user.addressBook.filter(
          (entry) =>
            entry?.street ||
            entry?.city ||
            entry?.state ||
            entry?.zipCode ||
            entry?.country,
        )
      : [];

    const defaultAddress =
      savedAddresses.find((entry) => entry.isDefault) ||
      (user.shippingAddress?.street ||
      user.shippingAddress?.firstName ||
      user.shippingAddress?.lastName ||
      user.shippingAddress?.email ||
      user.shippingAddress?.phone ||
      user.shippingAddress?.city ||
      user.shippingAddress?.state ||
      user.shippingAddress?.zipCode ||
      user.shippingAddress?.country
        ? user.shippingAddress
        : null);

    setShippingAddress({
      firstName: defaultAddress?.firstName || accountFirstName,
      lastName: defaultAddress?.lastName || accountLastName,
      email: defaultAddress?.email || accountEmail,
      phone: defaultAddress?.phone || accountPhone,
      street: defaultAddress?.street || "",
      city: defaultAddress?.city || "",
      state: defaultAddress?.state || "",
      zipCode: defaultAddress?.zipCode || "",
      country: defaultAddress?.country || "",
    });
    setSelectedAddressId(defaultAddress?._id || "manual");
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress({
      ...shippingAddress,
      [name]: value,
    });
    setSelectedAddressId("manual");
  };

  const handleSelectSavedAddress = (entry) => {
    const fullName = String(user?.name || "").trim();
    const [derivedFirstName = "", ...restNameParts] = fullName.split(" ");
    const derivedLastName = restNameParts.join(" ");

    const accountFirstName = user?.firstName || derivedFirstName || "";
    const accountLastName = user?.lastName || derivedLastName || "";
    const accountEmail = user?.email || "";
    const accountPhone = user?.phone || "";

    setShippingAddress({
      firstName: entry.firstName || accountFirstName,
      lastName: entry.lastName || accountLastName,
      email: entry.email || accountEmail,
      phone: entry.phone || accountPhone,
      street: entry.street || "",
      city: entry.city || "",
      state: entry.state || "",
      zipCode: entry.zipCode || "",
      country: entry.country || "",
    });
    setSelectedAddressId(entry._id || "manual");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !shippingAddress.firstName ||
      !shippingAddress.lastName ||
      !shippingAddress.email ||
      !shippingAddress.phone ||
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.zipCode ||
      !shippingAddress.country
    ) {
      toast.error("Please fill in all shipping address fields");
      return;
    }

    setIsProcessing(true);

    try {
      const orderData = {
        orderItems: cartItems.map((item) => ({
          product: item.product._id,
          name: item.product.name,
          image:
            item.product.image ||
            item.product.images?.[0]?.url ||
            item.product.images?.[0] ||
            "/placeholder-product.jpg",
          price: item.price,
          quantity: item.quantity,
        })),
        shippingAddress,
        paymentMethod,
        taxPrice: taxAmount,
        shippingPrice: 0,
        totalPrice: grandTotal,
      };

      const createdOrder = await dispatch(createOrder(orderData)).unwrap();
      setHasPlacedOrder(true);
      const customerName =
        [shippingAddress.firstName, shippingAddress.lastName]
          .filter(Boolean)
          .join(" ") || "N/A";
      const estimatedDelivery = new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000,
      ).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      navigate("/cart", {
        state: {
          orderSuccess: true,
          orderSummary: {
            orderId: createdOrder?._id || "",
            customerName,
            totalAmount: grandTotal,
            paymentMethod,
            deliveryCity: shippingAddress.city || "N/A",
            estimatedDelivery,
            email: shippingAddress.email || "N/A",
            phone: shippingAddress.phone || "N/A",
          },
        },
      });
    } catch (error) {
      toast.error(error || "Failed to place order");
    } finally {
      setIsProcessing(false);
    }
  };

  if (itemCount === 0 && !hasPlacedOrder) {
    return <Loader />;
  }

  const savedAddresses = Array.isArray(user?.addressBook)
    ? user.addressBook.filter(
        (entry) =>
          entry?.street ||
          entry?.city ||
          entry?.state ||
          entry?.zipCode ||
          entry?.country,
      )
    : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              {/* <FaTruck className="mr-2" /> */}
              Order Summary
            </h2>

            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.product._id}
                  className="flex items-center space-x-4"
                >
                  <img
                    src={getProductImage(item.product)}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product.name}</h3>
                    <p className="text-[14px] text-gray-600">
                      Quantity: {item.quantity} × {item.price.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold text-[16px]">
                    Rs. {(item.quantity * item.price).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t mt-4 pt-4">
              <div className="flex justify-between text-[16px] text-gray-700 mb-2">
                <span>Subtotal:</span>
                <span>Rs. {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[16px] text-gray-700 mb-2">
                <span>Tax (8%):</span>
                <span>Rs. {taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[16px] font-semibold">
                <span>Total:</span>
                <span>Rs. {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="space-y-6">
            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FaMapMarkerAlt className="mr-2" />
                Shipping Address
              </h2>

              {savedAddresses.length > 0 ? (
                <div className="mb-6 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-gray-700">
                      Saved Addresses
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate("/profile")}
                      className="text-sm text-green-700 hover:text-green-800"
                    >
                      Manage in Profile
                    </button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {savedAddresses.map((entry) => (
                      <button
                        key={entry._id}
                        type="button"
                        onClick={() => handleSelectSavedAddress(entry)}
                        className={`rounded-lg border p-4 text-left transition ${
                          String(selectedAddressId) === String(entry._id)
                            ? "border-green-400 bg-green-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <p className="font-medium text-gray-800">
                          {entry.label || "Saved Address"}
                        </p>
                        {entry.isDefault ? (
                          <p className="mt-1 text-xs uppercase tracking-wide text-green-700">
                            Default
                          </p>
                        ) : null}
                        <p className="mt-2 text-sm text-gray-600">
                          {entry.street}
                        </p>
                        <p className="text-sm text-gray-600">
                          {entry.city}, {entry.state} {entry.zipCode}
                        </p>
                        <p className="text-sm text-gray-600">{entry.country}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={shippingAddress.firstName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-0 focus:ring-0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={shippingAddress.lastName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-0 focus:ring-0"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={shippingAddress.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-0 focus:ring-0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={shippingAddress.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-0 focus:ring-0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={shippingAddress.street}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-0 focus:ring-0"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-0 focus:ring-0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={shippingAddress.state}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-0 focus:ring-0"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={shippingAddress.zipCode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-0 focus:ring-0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={shippingAddress.country}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-0 focus:ring-0"
                      required
                    />
                  </div>
                </div>

                {/* Demo payment */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <FaCreditCard className="mr-2" />
                    Demo Order Placement
                  </h2>

                  <div className="rounded-md border border-green-100 bg-green-50 p-4 text-sm text-gray-700">
                    <p className="font-medium text-green-700">
                      Demo checkout is enabled.
                    </p>
                    <p className="mt-1">
                      No card or payment details are required. Your order will
                      be placed directly for demonstration purposes.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full border border-transparent bg-[#232323] text-white py-3 px-4 hover:bg-black hover:border-[#232323] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center duration-300 transition"
                >
                  {isProcessing ? (
                    <>
                      <Loader />
                      <span className="ml-2">Processing...</span>
                    </>
                  ) : (
                    "Place Demo Order"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
