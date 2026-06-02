import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { MdChevronRight } from "react-icons/md";
import api from "../api/axios";
import {
  fetchTrendingProducts,
  selectTrendingProducts,
  selectTrendingIsLoading,
  selectTrendingError,
} from "../store/slices/trendingSlice";
import ProductCard from "./ProductCard";
import Carousel from "./Carousel";
import "../styles/TrendingProducts.css";

const TrendingProducts = () => {
  const dispatch = useDispatch();
  const trendingProducts = useSelector(selectTrendingProducts);
  const isLoading = useSelector(selectTrendingIsLoading);
  const error = useSelector(selectTrendingError);
  const [activeTab, setActiveTab] = useState("best-sellings");
  const [newArrivals, setNewArrivals] = useState([]);
  const [isNewArrivalsLoading, setIsNewArrivalsLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchTrendingProducts({ limit: 8 }));
  }, [dispatch]);

  useEffect(() => {
    let isMounted = true;

    const loadNewArrivals = async () => {
      setIsNewArrivalsLoading(true);

      try {
        const response = await api.get("/products?sort=newest&limit=50&page=1");
        const cutoffDate = Date.now() - 14 * 24 * 60 * 60 * 1000;
        const recentProducts = (response.data?.data || []).filter((product) => {
          const createdAt = new Date(product.createdAt).getTime();
          return Number.isFinite(createdAt) && createdAt >= cutoffDate;
        });

        if (isMounted) {
          setNewArrivals(recentProducts);
        }
      } catch (fetchError) {
        if (isMounted) {
          setNewArrivals([]);
        }
      } finally {
        if (isMounted) {
          setIsNewArrivalsLoading(false);
        }
      }
    };

    loadNewArrivals();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleProducts = useMemo(
    () => (activeTab === "new-arrivals" ? newArrivals : trendingProducts),
    [activeTab, newArrivals, trendingProducts],
  );
  const showLoader =
    isLoading || (activeTab === "new-arrivals" && isNewArrivalsLoading);
  const hasProducts = visibleProducts.length > 0;
  const showEmptyState = !showLoader && !error && !hasProducts;
  const trendingAvailable = trendingProducts.length > 0;

  return (
    <section className="trending-section">
      <div className="trending-container">
        {/* Header */}
        <div className="trending-header">
          <div className="trending-heading-row">
            <span className="trending-line" aria-hidden="true" />
            <h2 className="trending-title">TRENDING NOW</h2>
            <span className="trending-line" aria-hidden="true" />
          </div>
          <div className="trending-tabs" aria-label="Trending categories">
            <button
              type="button"
              className={`trending-tab ${activeTab === "best-sellings" ? "trending-tab-active" : ""}`}
              onClick={() => setActiveTab("best-sellings")}
            >
              BEST SELLINGS
            </button>
            <span className="trending-tab-divider">/</span>
            <button
              type="button"
              className={`trending-tab ${activeTab === "new-arrivals" ? "trending-tab-active" : ""}`}
              onClick={() => setActiveTab("new-arrivals")}
            >
              NEW ARRIVALS
            </button>
          </div>
        </div>

        {/* Products */}
        {showLoader ? (
          <div className="trending-products-grid">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={`trending-skeleton-${index}`}
                className="h-full animate-pulse rounded-2xl border border-gray-100 bg-white shadow-sm"
              >
                <div className="aspect-square w-full bg-gray-100" />
                <div className="space-y-3 p-4">
                  <div className="h-3 w-24 rounded-full bg-gray-100" />
                  <div className="h-4 w-3/4 rounded-full bg-gray-100" />
                  <div className="h-4 w-1/2 rounded-full bg-gray-100" />
                  <div className="h-9 w-full rounded-full bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-5 text-center text-sm text-red-700">
            <p>Unable to load trending products right now.</p>
            <button
              type="button"
              onClick={() =>
                dispatch(fetchTrendingProducts({ limit: 8, cache: false }))
              }
              className="mt-3 inline-flex items-center justify-center rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700 transition hover:border-red-300"
            >
              Try again
            </button>
          </div>
        ) : showEmptyState ? (
          <p className="trending-empty-state">
            {activeTab === "new-arrivals"
              ? "No new arrivals from the last 14 days yet."
              : "No trending products yet. Mark items as trending to show them here."}
          </p>
        ) : (
          <Carousel
            items={visibleProducts}
            ariaLabel="Trending products"
            itemClassName="min-w-[230px] sm:min-w-[260px] md:min-w-[280px] lg:min-w-[300px] xl:min-w-[320px]"
            renderItem={(product) => (
              <ProductCard product={product} viewMode="trending" />
            )}
          />
        )}

        {/* View All Link */}
        <div className="trending-footer">
          <Link
            to={
              activeTab === "new-arrivals"
                ? "/products?sort=newest"
                : "/products"
            }
            className="inline-flex items-center justify-center bg-[#232323] border border-[#232323] text-white px-4 py-2 text-[14px] font-semibold text-black transition hover:bg-[#ffffff] hover:text-black hover:border hover:border-[#232323]"
          >
            {activeTab === "new-arrivals" || !trendingAvailable
              ? "View All Products"
              : "View Trending Products"}
            <MdChevronRight className="trending-chevron" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TrendingProducts;
