import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { forgotPassword, selectAuthIsLoading } from "../store/slices/authSlice";
import toast from "react-hot-toast";

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthIsLoading);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      const message = await dispatch(forgotPassword({ email })).unwrap();
      toast.success(
        message || "If your account exists, a reset link has been sent.",
      );
    } catch (error) {
      toast.error(error || "Failed to send reset link");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Forgot your password?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email and we will send a reset link.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-[#68a300]"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#68a300] hover:bg-[#5f9600] disabled:opacity-50"
          >
            {isLoading ? "Sending..." : "Send reset link"}
          </button>

          <div className="text-center text-sm">
            <Link to="/login" className="text-[#68a300] hover:text-[#5f9600] font-medium">
              Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
