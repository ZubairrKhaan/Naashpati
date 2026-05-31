import axios from "axios";

// Determine base URL for API
const baseURL = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_API_URL || "/api";

const TOO_MANY_REQUESTS_MESSAGE =
  "Too many requests, please wait a few seconds and try again.";
const RATE_LIMIT_COOLDOWN_MS = 10 * 1000;
const RATE_LIMIT_STORAGE_KEY = "naashpatiRateLimitUntil";

const getRateLimitUntil = () => {
  if (typeof window === "undefined") {
    return 0;
  }

  const rawValue = window.sessionStorage.getItem(RATE_LIMIT_STORAGE_KEY);
  const parsedValue = Number(rawValue);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const setRateLimitUntil = (timestamp) => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(RATE_LIMIT_STORAGE_KEY, String(timestamp));
};

const clearRateLimitUntil = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
};

const createRateLimitError = () => {
  const error = new Error(TOO_MANY_REQUESTS_MESSAGE);
  error.response = {
    status: 429,
    data: {
      success: false,
      error: TOO_MANY_REQUESTS_MESSAGE,
      message: TOO_MANY_REQUESTS_MESSAGE,
    },
  };
  return error;
};

const api = axios.create({
  baseURL,
  withCredentials: true, // send cookies if needed
});

api.interceptors.request.use(
  (config) => {
    const rateLimitUntil = getRateLimitUntil();

    if (rateLimitUntil <= Date.now()) {
      clearRateLimitUntil();
      return config;
    }

    return Promise.reject(createRateLimitError());
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 429) {
      setRateLimitUntil(Date.now() + RATE_LIMIT_COOLDOWN_MS);

      if (!error.response.data || typeof error.response.data !== "object") {
        error.response.data = {};
      }

      error.response.data.error = TOO_MANY_REQUESTS_MESSAGE;
      error.response.data.message = TOO_MANY_REQUESTS_MESSAGE;
    }

    return Promise.reject(error);
  },
);

export default api;
