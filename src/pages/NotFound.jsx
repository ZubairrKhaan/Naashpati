import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div className="max-w-md w-full bg-white shadow rounded-lg p-6 text-center space-y-4">
      <h1 className="text-4xl font-bold text-gray-900">404</h1>
      <p className="text-lg text-gray-700">This page doesn't exist.</p>
      <Link
        to="/"
        className="inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#68a300] hover:bg-[#5f9600]"
      >
        Go to Home
      </Link>
    </div>
  </div>
);

export default NotFound;
