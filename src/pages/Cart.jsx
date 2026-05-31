import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  selectCartItems,
  selectCartTotal,
  selectCartIsLoading,
  updateQuantity,
  removeFromCart,
  clearCart,
} from "../store/slices/cartSlice";
import Loader from "../components/Loader";
import toast from "react-hot-toast";
import {
  FaTrash,
  FaPlus,
  FaMinus,
  FaShoppingBag,
  FaCheckCircle,
} from "react-icons/fa";

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const cartItems = useSelector(selectCartItems);
  const cartTotal = useSelector(selectCartTotal);
  const isLoading = useSelector(selectCartIsLoading);
  const API_URL = import.meta.env.VITE_API_URL || "/api";
  const SERVER_URL = API_URL.replace(/\/api\/?$/, "");

  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [showOrderSuccessPopup, setShowOrderSuccessPopup] = useState(false);
  const [orderSummary, setOrderSummary] = useState(null);

  useEffect(() => {
    if (location.state?.orderSuccess && location.state?.orderSummary) {
      setOrderSummary(location.state.orderSummary);
      setShowOrderSuccessPopup(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const getProductImage = (product) => {
    const rawImage =
      product?.image || product?.images?.[0]?.url || product?.images?.[0];
    if (!rawImage) return "/placeholder-product.jpg";
    if (/^https?:\/\//i.test(rawImage)) return rawImage;
    if (rawImage === "/placeholder-product.jpg") return rawImage;
    if (rawImage.startsWith("/uploads/")) return `${SERVER_URL}${rawImage}`;
    return rawImage;
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;

    const item = cartItems.find((item) => item.product._id === productId);
    if (item && newQuantity > item.product.stock) {
      toast.error(`Only ${item.product.stock} items available in stock`);
      return;
    }

    dispatch(updateQuantity({ productId, quantity: newQuantity }));
  };

  const handleRemoveItem = (productId) => {
    dispatch(removeFromCart(productId));
    toast.success("Item removed from cart");
  };

  const handleClearCart = () => {
    if (window.confirm("Are you sure you want to clear your cart?")) {
      dispatch(clearCart());
      toast.success("Cart cleared");
    }
  };

  const handleApplyPromoCode = () => {
    // Simple promo code logic - in real app, this would be validated on backend
    if (promoCode.toLowerCase() === "welcome10") {
      setDiscount(cartTotal * 0.1);
      toast.success("Promo code applied! 10% discount");
    } else if (promoCode.toLowerCase() === "herbs20") {
      setDiscount(cartTotal * 0.2);
      toast.success("Promo code applied! 20% discount");
    } else {
      toast.error("Invalid promo code");
      setDiscount(0);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    navigate("/checkout");
  };

  const handleCloseOrderSuccessPopup = () => {
    setShowOrderSuccessPopup(false);
    dispatch(clearCart());
  };

  const subtotal = cartTotal;
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = (subtotal + shipping - discount) * 0.08;
  const total = subtotal + shipping + tax - discount;

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto px-4 py-8 overflow-x-hidden">
      {showOrderSuccessPopup && orderSummary ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={handleCloseOrderSuccessPopup}
        >
          <div
            className="relative w-full max-w-md rounded-lg bg-white p-6 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <FaCheckCircle className="mx-auto mb-3 text-4xl text-green-600" />
            <h2 className="text-2xl font-bold text-gray-800">
              Thank you for your order!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your order has been received and is now being processed.
            </p>
            <div className="mt-4 rounded-md p-4 text-left text-sm text-gray-700">
              <p>
                <span className="font-semibold">Order ID:</span>{" "}
                {orderSummary.orderId || "N/A"}
              </p>
              <p className="mt-1">
                <span className="font-semibold">Customer name:</span>{" "}
                {orderSummary.customerName || "N/A"}
              </p>
              <p className="mt-1">
                <span className="font-semibold">Total amount:</span> Rs. 
                {Number(orderSummary.totalAmount || 0).toFixed(2)}
              </p>
              <p className="mt-1">
                <span className="font-semibold">Payment method:</span>{" "}
                {orderSummary.paymentMethod || "N/A"}
              </p>
              <p className="mt-1">
                <span className="font-semibold">Delivery city:</span>{" "}
                {orderSummary.deliveryCity || "N/A"}
              </p>
              <p className="mt-1">
                <span className="font-semibold">Estimated delivery:</span>{" "}
                {orderSummary.estimatedDelivery || "N/A"}
              </p>
              <p className="mt-1">
                <span className="font-semibold">Email:</span>{" "}
                {orderSummary.email || "N/A"}
              </p>
              <p className="mt-1">
                <span className="font-semibold">Phone:</span>{" "}
                {orderSummary.phone || "N/A"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloseOrderSuccessPopup}
              className="mt-5 bg-[#232323] px-5 py-2 text-sm font-semibold text-white transition hover:bg-black"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[24px] font-bold text-gray-800">Shopping Cart</h1>
        {cartItems.length > 0 && (
          <button
            onClick={handleClearCart}
            className="text-red-600 hover:text-red-800 flex items-center space-x-2"
          >
            <FaTrash />
            <span>Clear Cart</span>
          </button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-16">
          <FaShoppingBag className="mx-auto text-6xl text-gray-300 mb-4" />
          <h2 className="text-[18px] font-semibold text-gray-600 mb-4">
            Your cart is empty
          </h2>
          <p className="text-[14px] text-gray-500 mb-8">
            Add some products to get started!
          </p>
          <button
            onClick={() => navigate("/products")}
            className="bg-[#232323] text-white px-4 py-2 hover:bg-white hover:text-[#232323] border border-[#232323] hover:border-[#232323] transition-colors duration-300"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.product._id}
                className="overflow-hidden bg-white rounded-lg shadow-md p-4 md:p-6"
              >
                <div className="flex flex-col gap-4 md:flex-row">
                  <img
                    src={getProductImage(item.product)}
                    alt={item.product.name}
                    className="h-24 w-24 rounded object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <h3 className="mb-2 break-words text-lg font-semibold text-gray-800">
                      {item.product.name}
                    </h3>
                    <p className="mb-4 text-sm text-gray-600 line-clamp-2">
                      {item.product.description}
                    </p>

                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-semibold text-green-600">
                          Rs. {item.product.price?.toFixed(2)}
                        </span>

                        <div className="flex shrink-0 items-center rounded border border-gray-300">
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                item.product._id,
                                item.quantity - 1,
                              )
                            }
                            className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                          >
                            <FaMinus className="text-xs" />
                          </button>
                          <span className="px-4 py-1 border-x border-gray-300">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                item.product._id,
                                item.quantity + 1,
                              )
                            }
                            disabled={item.quantity >= item.product.stock}
                            className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                          >
                            <FaPlus className="text-xs" />
                          </button>
                        </div>
                      </div>

                      <div className="flex w-full items-center justify-between gap-4 md:w-auto md:justify-end">
                        <span className="whitespace-nowrap font-semibold">
                          Rs. {(item.product.price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleRemoveItem(item.product._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Promo Code */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Promo Code</h3>
              <div className="flex flex-col gap-2 md:flex-row md:space-x-2">
                <input
                  type="text"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-0 focus:ring-0"
                />
                <button
                  onClick={handleApplyPromoCode}
                  className="bg-[#68a300] text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Apply
                </button>
              </div>
              {/* <p className="text-sm text-gray-500 mt-2">
                Try: WELCOME10 or HERBS20
              </p> */}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span>Rs. {subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? "Free" : `Rs. ${shipping.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>Rs. {tax.toFixed(2)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-Rs. {discount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span>Rs. {total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-[#ffce12] text-gray-700 py-3 hover:bg-[#e3b80f] mt-6 font-semibold"
              >
                Proceed to Checkout
              </button>

              <button
                onClick={() => navigate("/products")}
                className="w-full border border-gray-300 text-gray-700 py-2 hover:bg-gray-50 mt-3"
              >
                Continue Shopping
              </button>
            </div>

            {/* Shipping Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">
                Free Shipping
              </h4>
              <p className="text-blue-700 text-sm">
                Orders over Rs. 500 qualify for free shipping. Standard shipping
                is just Rs. 9.99.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
