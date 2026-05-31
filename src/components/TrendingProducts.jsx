import { useEffect, useState } from "react";
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
import Loader from "./Loader";
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
    dispatch(fetchTrendingProducts());
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

  const visibleProducts =
    activeTab === "new-arrivals" ? newArrivals : trendingProducts;
  const showLoader =
    isLoading || (activeTab === "new-arrivals" && isNewArrivalsLoading);

  if (showLoader) {
    return (
      <section className="trending-section">
        <div className="trending-container">
          <Loader />
        </div>
      </section>
    );
  }

  if (error) {
    console.error("Error fetching trending products:", error);
    return null;
  }

  if (!trendingProducts || trendingProducts.length === 0) {
    return null;
  }

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

        {/* Products Grid */}
        <div className="trending-products-grid">
          {visibleProducts.map((product) => (
            <div key={product._id} className="trending-product-wrapper">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {activeTab === "new-arrivals" &&
          !isNewArrivalsLoading &&
          visibleProducts.length === 0 && (
            <p className="trending-empty-state">
              No new arrivals from the last 14 days yet.
            </p>
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
            View All Products
            <MdChevronRight className="trending-chevron" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TrendingProducts;
