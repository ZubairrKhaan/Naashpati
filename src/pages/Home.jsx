import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdEco, MdShield, MdLocalShipping, MdFavorite } from "react-icons/md";
import { FaSeedling } from "react-icons/fa";
import {
  fetchCategories,
  fetchProducts,
  selectCategories,
  selectProducts,
} from "../store/slices/productSlice";
import {
  fetchHeroSlides,
  selectHeroSlides,
} from "../store/slices/heroSlideSlice";
import {
  fetchHeroBadges,
  selectHeroBadges,
  selectHeroGenderImages,
} from "../store/slices/heroBadgeSlice";
import ProductCard from "../components/ProductCard";
import TrendingProducts from "../components/TrendingProducts";

const BADGE_MARQUEE_STYLE = `
@keyframes heroBadgesMarquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.hero-badge-marquee-track {
  display: flex;
  width: max-content;
  will-change: transform;
  animation: heroBadgesMarquee 24s linear infinite;
}
`;

const Home = () => {
  const dispatch = useDispatch();
  const categories = useSelector(selectCategories);
  const products = useSelector(selectProducts);
  const heroSlides = useSelector(selectHeroSlides);
  const heroCertificateBadges = useSelector(selectHeroBadges);
  const heroGenderImages = useSelector(selectHeroGenderImages);
  const [showBannerProducts, setShowBannerProducts] = useState(false);
  const bannerProductsRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL || "/api";
  const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

  const toHeroImageUrl = (image) => {
    if (!image) {
      return "";
    }

    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    return `${API_ORIGIN}${image}`;
  };

  const resolveMediaUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/uploads/")) return `${API_ORIGIN}${url}`;
    return url;
  };

  const femaleCollectionImage =
    resolveMediaUrl(heroGenderImages?.female) ||
    "/images/banners/hero_banner1.jpg";
  const maleCollectionImage =
    resolveMediaUrl(heroGenderImages?.male) ||
    "/images/banners/hero_banner1.jpg";

  useEffect(() => {
    dispatch(fetchCategories({ force: true }));
    dispatch(
      fetchProducts({
        page: 1,
        limit: 500,
        search: "",
        category: "all",
        minPrice: "",
        maxPrice: "",
        sort: "newest",
        showOnHomeBanner: true,
      }),
    );
    dispatch(fetchHeroSlides());
    dispatch(fetchHeroBadges());
  }, [dispatch]);

  const sortedProducts = useMemo(
    () =>
      [...products]
        .filter((product) => product.showOnHomeBanner)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [products],
  );

  const handleBannerClick = () => {
    setShowBannerProducts(true);

    window.requestAnimationFrame(() => {
      bannerProductsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const homeBanner = useMemo(() => {
    if (!heroSlides.length) {
      return null;
    }

    const firstBanner = heroSlides[0];
    const image = toHeroImageUrl(firstBanner.image);

    return {
      _id: firstBanner._id,
      image,
    };
  }, [heroSlides]);

  return (
    <div className="min-h-screen">
      {/* Clickable Home Banner */}
      {homeBanner && (
        <section className="relative overflow-hidden bg-[#ffffff] px-4 py-6 sm:px-6">
          <button
            type="button"
            onClick={handleBannerClick}
            className="group mx-auto block w-full max-w-7xl"
            aria-label="Show products from featured banner"
          >
            <div className="relative h-[220px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm sm:h-[340px] lg:h-[560px]">
              <img
                src={homeBanner.image}
                alt="Featured collection banner"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.01]"
              />
            </div>
          </button>
        </section>
      )}

      {showBannerProducts && homeBanner && (
        <section ref={bannerProductsRef} className="bg-[#ffffff] px-6 py-10">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-center text-2xl font-bold text-[#232323]">
              Banner Collection Products
            </h2>

            {sortedProducts.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {sortedProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            ) : (
              <p className="mt-6 text-center text-gray-500">
                No products found yet.
              </p>
            )}
          </div>
        </section>
      )}

      <section className="bg-white px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-left text-2xl font-bold text-[#232323]">
            Shop By Gender
          </h2>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <Link
              to="/products?gender-category=male-collection"
              className="group relative block overflow-hidden rounded-xl border border-gray-200"
              aria-label="Open male collection"
            >
              <img
                src={maleCollectionImage}
                alt="Male collection"
                className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
                    Men
                  </p>
                  <h3 className="mt-1 text-2xl font-bold text-white">
                    Male Collection
                  </h3>
                </div>
                <span className="rounded bg-white/90 px-3 py-1 text-xs font-semibold text-[#232323]">
                  Explore
                </span>
              </div>
            </Link>

            <Link
              to="/products?gender-category=female-collection"
              className="group relative block overflow-hidden rounded-xl border border-gray-200"
              aria-label="Open female collection"
            >
              <img
                src={femaleCollectionImage}
                alt="Female collection"
                className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
                    Women
                  </p>
                  <h3 className="mt-1 text-2xl font-bold text-white">
                    Female Collection
                  </h3>
                </div>
                <span className="rounded bg-white/90 px-3 py-1 text-xs font-semibold text-[#232323]">
                  Explore
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Products */}
      <TrendingProducts />

      {/* Categories */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 flex items-center justify-between border-b border-gray-900 pb-4">
            <h2
              className="text-xl font-semibold text-gray-900"
              style={{ fontFamily: "Poppins, sans-serif, Inter, system-ui" }}
            >
              Shop by Category
            </h2>
            <Link
              to="/products"
              className="text-sm font-semibold text-gray-600 hover:text-gray-900"
            >
              View all
            </Link>
          </div>

          <div className="flex gap-5 overflow-x-auto pb-4">
            {categories
              .filter((category) => {
                const value = String(category.value || "")
                  .trim()
                  .toLowerCase();
                return (
                  value !== "male-collection" && value !== "female-collection"
                );
              })
              .map((category) => (
                <Link
                  key={category.value}
                  to={`/products?category=${category.value}`}
                  className="group min-w-[220px] shrink-0"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
                    {category.image ? (
                      <img
                        src={resolveMediaUrl(category.image)}
                        alt={category.name}
                        loading="lazy"
                        className="h-[224px] w-[224px] object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <FaSeedling className="text-4xl text-[#68a300]" />
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-center text-sm font-medium text-gray-700">
                    {category.name}
                  </p>
                </Link>
              ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/products"
              className="inline-flex items-center justify-center bg-[#232323] border border-[#232323] text-white px-4 py-2 text-[14px] font-semibold text-black transition hover:bg-[#ffffff] hover:text-black hover:border hover:border-[#232323]"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Certificates Strip */}
      {heroCertificateBadges.length > 0 && (
        <section className="bg-[#ffffff] py-8">
          <style>{BADGE_MARQUEE_STYLE}</style>
          <div className="flex w-full flex-col-reverse items-center gap-6 px-4 lg:flex-row lg:items-center">
            <div className="w-full rounded-2xl bg-gradient-to-r from-[#2f80ed] to-[#1f63d8] px-6 py-5 text-white lg:max-w-[34rem]">
              <h3 className="text-center text-3xl font-extrabold leading-tight lg:text-left">
                20+ Certificates
              </h3>
              <p className="mt-1 text-center text-xl font-medium lg:text-left">
                From Global Regulatory Authorities
              </p>
            </div>

            <div className="relative w-full overflow-hidden pb-2 lg:pl-2">
              <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-14 bg-gradient-to-r from-white via-white/90 to-transparent" />
              <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-14 bg-gradient-to-l from-white via-white/90 to-transparent" />
              {(() => {
                const MIN_PER_HALF = 10;
                const repeatCount = Math.max(
                  1,
                  Math.ceil(MIN_PER_HALF / heroCertificateBadges.length),
                );
                const half = Array.from(
                  { length: heroCertificateBadges.length * repeatCount },
                  (_, i) =>
                    heroCertificateBadges[i % heroCertificateBadges.length],
                );
                const marqueeItems = [...half, ...half];
                return (
                  <div className="hero-badge-marquee-track items-start gap-5 pr-2">
                    {marqueeItems.map((badgeImage, index) => (
                      <div
                        key={`${badgeImage}-${index}`}
                        className="flex w-24 flex-col items-center"
                      >
                        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-[#ccb8d9] bg-white shadow-sm">
                          <img
                            src={resolveMediaUrl(badgeImage)}
                            alt={`Certificate badge ${(index % heroCertificateBadges.length) + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-16 bg-white grid grid-cols-2 md:grid-cols-4 gap-8 text-center px-6">
        <div>
          <MdEco className="text-5xl mx-auto text-[#68a300] my-3" />
          <h3
            style={{
              fontFamily: "Poppins, sans-serif, Inter, system-ui",
              fontSize: "16px",
            }}
          >
            100% Organic
          </h3>
        </div>

        <div>
          <MdShield className="text-5xl mx-auto text-[#68a300] my-3" />
          <h3
            style={{
              fontFamily: "Poppins, sans-serif, Inter, system-ui",
              fontSize: "16px",
            }}
          >
            Quality Assured
          </h3>
        </div>

        <div>
          <MdLocalShipping className="text-5xl mx-auto text-[#68a300] my-3" />
          <h3
            style={{
              fontFamily: "Poppins, sans-serif, Inter, system-ui",
              fontSize: "16px",
            }}
          >
            Fast Shipping
          </h3>
        </div>

        <div>
          <MdFavorite className="text-5xl mx-auto text-[#68a300] my-3" />
          <h3
            style={{
              fontFamily: "Poppins, sans-serif, Inter, system-ui",
              fontSize: "16px",
            }}
          >
            Customer Care
          </h3>
        </div>
      </section>
    </div>
  );
};

export default Home;
