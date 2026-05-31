import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  selectAuthUser,
  selectIsAuthenticated,
} from "../../store/slices/authSlice";
import {
  getUser,
  selectUser,
  selectUsersLoading,
  selectUsersError,
} from "../../store/slices/userSlice";
import Loader from "../../components/Loader";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaCalendar,
  FaShieldAlt,
  FaShoppingCart,
  FaCreditCard,
} from "react-icons/fa";

const UserDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectAuthUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userData = useSelector(selectUser);
  const isLoading = useSelector(selectUsersLoading);
  const error = useSelector(selectUsersError);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (user?.role !== "admin") {
      navigate("/");
      toast.error("Access denied. Admin privileges required.");
      return;
    }

    if (id) {
      dispatch(getUser(id));
    }
  }, [isAuthenticated, user, id, dispatch, navigate]);

  if (!isAuthenticated || user?.role !== "admin") {
    return <Loader />;
  }

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-8">
          <div className="text-center">
            <div className="text-red-600 text-lg font-semibold mb-4">
              Error Loading User
            </div>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate("/admin")}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Back to Admin Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-8">
          <div className="text-center">
            <div className="text-gray-600 text-lg mb-4">User not found</div>
            <button
              onClick={() => navigate("/admin")}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Back to Admin Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/admin")}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <FaArrowLeft className="mr-2" />
                Back to Admin Dashboard
              </button>
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
              <p className="text-gray-600">ID: {userData._id}</p>
            </div>
          </div>
        </div>

        {/* User Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <FaUser className="text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">
                Basic Information
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <p className="mt-1 text-sm text-gray-900">{userData.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <p className="mt-1 text-sm text-gray-900 flex items-center">
                  <FaEnvelope className="mr-2 text-gray-400" />
                  {userData.email}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <p className="mt-1">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      userData.role === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <FaShieldAlt className="mr-1" />
                    {userData.role}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Account Created
                </label>
                <p className="mt-1 text-sm text-gray-900 flex items-center">
                  <FaCalendar className="mr-2 text-gray-400" />
                  {new Date(userData.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Updated
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(userData.updatedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Account Status
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Account Status
                </label>
                <p className="mt-1">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Active
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email Verified
                </label>
                <p className="mt-1">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Verified
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FaShoppingCart className="text-green-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Activity Summary
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {userData.orders?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                ${userData.totalSpent?.toFixed(2) || "0.00"}
              </div>
              <div className="text-sm text-gray-600">Total Spent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {userData.reviews || 0}
              </div>
              <div className="text-sm text-gray-600">Product Reviews</div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        {userData.orders && userData.orders.length > 0 && (
          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Orders
            </h2>
            <div className="space-y-4">
              {userData.orders.slice(0, 5).map((order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium">Order #{order._id.slice(-8)}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${order.total?.toFixed(2)}</p>
                    <p className="text-sm text-gray-600 capitalize">
                      {order.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetail;
