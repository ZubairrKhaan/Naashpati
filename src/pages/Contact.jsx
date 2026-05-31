import { useState } from "react";
import {
  FaPhoneAlt,
  FaComments,
  FaTruck,
  FaEnvelope,
  FaPaperPlane,
} from "react-icons/fa";
import toast from "react-hot-toast";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    comment: "",
    orderId: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formData.name || !formData.email || !formData.comment) {
      toast.error(
        "Please complete all required fields before sending your message.",
      );
      return;
    }

    setFormData((prev) => ({
      ...prev,
      comment: prev.comment,
      phone: prev.phone,
    }));
    toast.success(
      "Thank you! Your message has been sent. We will contact you soon.",
    );
  };

  const handleRequestCall = () => {
    toast.success(
      "Your callback request has been sent. We will call you shortly.",
    );
  };

  const handleChatSupport = () => {
    toast.success(
      "Chat support is available. One of our agents will connect with you soon.",
    );
  };

  const handleTrackOrder = () => {
    if (!formData.orderId) {
      toast.error("Please enter your order number to track it.");
      return;
    }
    toast.success(
      `Order ${formData.orderId} is being prepared. A delivery update will be sent shortly.`,
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="bg-white shadow-lg rounded-3xl p-8 sm:p-10">
            <div className="mb-8">
              <p className="text-[14px] uppercase tracking-[0.24em] text-herbs-600 font-semibold">
                Contact Us
              </p>
              <h1 className="mt-3 font-semibold text-secondary-900 text-[24px]">
                We’re here to help.
              </h1>
              <p className="text-[14px] mt-4 text-secondary-600 leading-7">
                Send us a message and our customer support team will respond as
                soon as possible. Need help with an order? Use the quick action
                cards below.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="block">
                  <span className="text-sm font-medium text-secondary-800">
                    Name
                  </span>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    // placeholder="Jane Doe"
                    className="mt-2 block w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-secondary-900 shadow-sm focus:border-herbs-500 focus:ring-herbs-500"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-secondary-800">
                    Phone Number
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    // placeholder="(123) 456-7890"
                    className="mt-2 block w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-secondary-900 shadow-sm focus:border-herbs-500 focus:ring-herbs-500"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-secondary-800">
                  Email
                </span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  //   placeholder="jane@example.com"
                  className="mt-2 block w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-secondary-900 shadow-sm focus:border-herbs-500 focus:ring-herbs-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-secondary-800">
                  Comment
                </span>
                <textarea
                  name="comment"
                  value={formData.comment}
                  onChange={handleChange}
                  rows="5"
                  placeholder="How can we assist you today?"
                  className="mt-2 block w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-secondary-900 shadow-sm focus:border-herbs-500 focus:ring-herbs-500"
                />
              </label>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-herbs-600 px-6 py-3 text-sm font-semibold shadow-lg transition hover:bg-herbs-700"
              >
                <FaPaperPlane className="mr-2 h-4 w-4" />
                Send Message
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-herbs-50 border border-herbs-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-herbs-600 p-3 text-white">
                <FaPhoneAlt className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-secondary-900">
                  Request a Call
                </h2>
                <p className="mt-1 text-sm text-secondary-600">
                  Need a fast response? Ask us to call you back at your
                  convenience.
                </p>
              </div>
            </div>
            <button
              onClick={handleRequestCall}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-white border border-herbs-200 px-4 py-3 text-sm font-semibold text-herbs-700 transition hover:bg-herbs-100"
            >
              Request a call
            </button>
          </div>

          <div className="bg-herbs-50 border border-herbs-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-herbs-600 p-3 text-white">
                <FaComments className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-secondary-900">
                  Chat Support
                </h2>
                <p className="mt-1 text-sm text-secondary-600">
                  Chat with our support team for guided help and order
                  questions.
                </p>
              </div>
            </div>
            <button
              onClick={handleChatSupport}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-white border border-herbs-200 px-4 py-3 text-sm font-semibold text-herbs-700 transition hover:bg-herbs-100"
            >
              Open chat support
            </button>
          </div>

          <div className="bg-herbs-50 border border-herbs-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-herbs-600 p-3 text-white">
                <FaTruck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-secondary-900">
                  Track Your Order
                </h2>
                <p className="mt-1 text-sm text-secondary-600">
                  Enter your order number and get an instant status update.
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <input
                type="text"
                name="orderId"
                value={formData.orderId}
                onChange={handleChange}
                placeholder="Order #123456"
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-secondary-900 shadow-sm focus:border-herbs-500 focus:ring-herbs-500"
              />
              <button
                onClick={handleTrackOrder}
                className="inline-flex w-full items-center justify-center rounded-full bg-white border border-herbs-200 px-4 py-3 text-sm font-semibold text-herbs-700 transition hover:bg-herbs-100"
              >
                Track order
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-secondary-900">
              Need urgent help?
            </h3>
            <p className="mt-3 text-sm text-secondary-600">
              Email us at{" "}
              <a
                href="mailto:contact@naashpati.com"
                className="text-herbs-600 hover:text-herbs-700"
              >
                contact@naashpati.com
              </a>{" "}
              or call <span className="font-semibold">+1 (800) 123-4567</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
