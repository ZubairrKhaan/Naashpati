import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaBoxOpen,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaUser,
} from "react-icons/fa";
import {
  selectAuthUser,
  selectIsAuthenticated,
} from "../../store/slices/authSlice";
import {
  clearOrder,
  getOrderById,
  selectOrder,
  selectOrdersError,
  selectOrdersLoading,
} from "../../store/slices/orderSlice";
import Loader from "../../components/Loader";

const formatCurrency = (amount) => `Rs. ${Number(amount || 0).toFixed(2)}`;
const API_URL = import.meta.env.VITE_API_URL || "/api";
const SERVER_URL = API_URL.replace(/\/api\/?$/, "");

const getOrderItemImage = (item) => {
  const storedImage = item.image;

  if (
    typeof storedImage === "string" &&
    storedImage &&
    storedImage !== "[object Object]"
  ) {
    return storedImage.startsWith("/")
      ? `${SERVER_URL}${storedImage}`
      : storedImage;
  }

  if (storedImage?.url) {
    return storedImage.url.startsWith("/")
      ? `${SERVER_URL}${storedImage.url}`
      : storedImage.url;
  }

  const productImage = item.product?.image;
  if (typeof productImage === "string" && productImage) {
    return productImage.startsWith("/")
      ? `${SERVER_URL}${productImage}`
      : productImage;
  }

  const galleryImage =
    item.product?.images?.[0]?.url || item.product?.images?.[0];
  if (typeof galleryImage === "string" && galleryImage) {
    return galleryImage.startsWith("/")
      ? `${SERVER_URL}${galleryImage}`
      : galleryImage;
  }

  return "/placeholder-product.jpg";
};

const OrderDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector(selectAuthUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const order = useSelector(selectOrder);
  const isLoading = useSelector(selectOrdersLoading);
  const error = useSelector(selectOrdersError);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (id) {
      dispatch(getOrderById(id));
    }

    return () => {
      dispatch(clearOrder());
    };
  }, [dispatch, id, isAuthenticated, navigate, user]);

  if (!isAuthenticated) {
    return <Loader />;
  }

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-lg bg-white p-8 shadow">
          <div className="text-center">
            <div className="mb-4 text-lg font-semibold text-red-600">
              Error Loading Order
            </div>
            <p className="mb-6 text-gray-600">{error}</p>
            <button
              onClick={() => navigate(user?.role === "admin" ? "/admin" : "/profile")}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              {user?.role === "admin"
                ? "Back to Admin Dashboard"
                : "Back to Profile"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-lg bg-white p-8 shadow">
          <div className="text-center">
            <div className="mb-4 text-lg text-gray-600">Order not found</div>
            <button
              onClick={() => navigate(user?.role === "admin" ? "/admin" : "/profile")}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              {user?.role === "admin"
                ? "Back to Admin Dashboard"
                : "Back to Profile"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={() => navigate(user?.role === "admin" ? "/admin" : "/profile")}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <FaArrowLeft className="mr-2" />
              {user?.role === "admin"
                ? "Back to Admin Dashboard"
                : "Back to Profile"}
            </button>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-gray-900">
                Order Details
              </h1>
              <p className="text-sm text-gray-600">ID: {order._id}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow lg:col-span-2">
            <div className="mb-4 flex items-center">
              {/* <FaBoxOpen className="mr-2 text-[#68a300]" /> */}
              <h2 className="text-xl font-semibold text-gray-900">Items</h2>
            </div>
            <div className="space-y-4">
              {order.orderItems?.map((item, index) => (
                <div
                  key={`${item.product?._id || item.product}-${index}`}
                  className="flex items-start gap-4 rounded border p-4"
                >
                  <img
                    src={getOrderItemImage(item)}
                    alt={item.name}
                    className="h-16 w-16 rounded object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantity} x {formatCurrency(item.price)}
                    </p>
                    {Array.isArray(item.batchAllocations) &&
                    item.batchAllocations.length > 0 ? (
                      <div className="mt-2 rounded bg-gray-50 p-2 text-xs text-gray-600">
                        <p className="mb-1 font-medium text-gray-700">
                          Batch Allocations (FIFO)
                        </p>
                        <div className="space-y-1">
                          {item.batchAllocations.map(
                            (allocation, allocIndex) => (
                              <p
                                key={`${allocation.batchId || allocation.batchNumber}-${allocIndex}`}
                              >
                                Batch {allocation.batchNumber}:{" "}
                                {allocation.quantity}
                              </p>
                            ),
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-gray-400">
                        No batch trace available for this item.
                      </p>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(item.quantity * item.price)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center">
                <FaUser className="mr-2 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Customer
                </h2>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-medium">Name:</span>{" "}
                  {order.user?.name || "N/A"}
                </p>
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  {order.shippingAddress?.email ||
                    order.customerSnapshot?.email ||
                    order.user?.email ||
                    "N/A"}
                </p>
                <p>
                  <span className="font-medium">Phone:</span>{" "}
                  {order.shippingAddress?.phone || "N/A"}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center">
                <FaMapMarkerAlt className="mr-2 text-red-500" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Shipping
                </h2>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p>{order.shippingAddress?.street}</p>
                <p>
                  {order.shippingAddress?.city}, {order.shippingAddress?.state}
                </p>
                <p>
                  {order.shippingAddress?.zipCode},{" "}
                  {order.shippingAddress?.country}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center">
                <FaMoneyBillWave className="mr-2 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">Summary</h2>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-medium">Status:</span> {order.status}
                </p>
                <p>
                  <span className="font-medium">Payment:</span>{" "}
                  {order.paymentMethod === "demo"
                    ? "Demo Order"
                    : order.paymentMethod}
                </p>
                <p>
                  <span className="font-medium">Paid:</span>{" "}
                  {order.isPaid ? "Yes" : "No"}
                </p>
                <p>
                  <span className="font-medium">Subtotal:</span>{" "}
                  {formatCurrency(
                    order.totalPrice - order.taxPrice - order.shippingPrice,
                  )}
                </p>
                <p>
                  <span className="font-medium">Shipping:</span>{" "}
                  {formatCurrency(order.shippingPrice)}
                </p>
                <p>
                  <span className="font-medium">Tax:</span>{" "}
                  {formatCurrency(order.taxPrice)}
                </p>
                <p className="pt-2 text-base font-semibold text-gray-900">
                  Total: {formatCurrency(order.totalPrice)}
                </p>
                <p>
                  <span className="font-medium">Placed:</span>{" "}
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
