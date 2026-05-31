import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdEco, MdShield, MdLocalShipping, MdFavorite } from "react-icons/md";
import { FaSeedling, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import {
  fetchCategories,
  selectCategories,
} from "../store/slices/productSlice";
import {
  fetchHeroSlides,
  selectHeroSlides,
} from "../store/slices/heroSlideSlice";
import {
  fetchHeroBadges,
  selectHeroBadges,
} from "../store/slices/heroBadgeSlice";
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
  const heroSlides = useSelector(selectHeroSlides);
  const heroCertificateBadges = useSelector(selectHeroBadges);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);
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

  useEffect(() => {
    dispatch(fetchCategories({ force: true }));
    dispatch(fetchHeroSlides());
    dispatch(fetchHeroBadges());
  }, [dispatch]);

  const slides = useMemo(() => {
    if (heroSlides.length > 0) {
      return heroSlides.map((slide) => ({
        _id: slide._id,
        image: toHeroImageUrl(slide.image),
        title: slide.title || "Pure Health Pure Life",
        subtitle:
          slide.subtitle ||
          "Premium herbal products for a healthier lifestyle.",
      }));
    }

    return [];
  }, [heroSlides]);

  const loopedSlides = useMemo(() => {
    if (slides.length <= 1) {
      return slides;
    }

    return [...slides, slides[0]];
  }, [slides]);

  useEffect(() => {
    setCurrentSlide(0);
    setIsTransitionEnabled(true);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setCurrentSlide((prev) => prev + 1);
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) {
      return;
    }

    if (currentSlide > slides.length) {
      setIsTransitionEnabled(false);
      setCurrentSlide(0);
    }
  }, [currentSlide, slides.length]);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => prev + 1);
  };

  const handleHeroTransitionEnd = () => {
    if (slides.length <= 1) {
      return;
    }

    if (currentSlide === slides.length) {
      setIsTransitionEnabled(false);
      setCurrentSlide(0);
    }
  };

  useEffect(() => {
    if (isTransitionEnabled) {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      setIsTransitionEnabled(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isTransitionEnabled]);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative h-[320px] sm:h-[420px] lg:h-[720px]">
          <div
            className={`flex h-full ${isTransitionEnabled ? "transition-transform duration-700 ease-in-out" : ""}`}
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            onTransitionEnd={handleHeroTransitionEnd}
          >
            {loopedSlides.map((slide, index) => (
              <div
                key={`${slide._id}-${index}`}
                className="relative h-full min-w-full"
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>

          {slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevSlide}
                className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-gray-700 shadow transition hover:bg-white"
                aria-label="Previous hero slide"
              >
                <FaChevronLeft />
              </button>
              <button
                type="button"
                onClick={handleNextSlide}
                className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-gray-700 shadow transition hover:bg-white"
                aria-label="Next hero slide"
              >
                <FaChevronRight />
              </button>

              <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
                {slides.map((slide, index) => (
                  <button
                    key={slide._id}
                    type="button"
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full border border-black/70 transition p-0 m-0
                      ${
                        index === currentSlide % slides.length
                          ? "bg-[#232323]"
                          : "bg-none"
                      }
                    `}
                    aria-label={`Go to hero slide ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
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

      {/* Categories */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 flex items-center justify-center gap-6">
            <span className="hidden h-px flex-1 bg-[#1f2937] md:block" />
            <h2
              className="text-center font-extrabold uppercase tracking-[0.06em] text-[#232323] font-sans"
              style={{
                fontFamily: "Poppins, sans-serif, Inter, system-ui",
                fontSize: "16px",
              }}
            >
              Herbal Choice For Your Health
            </h2>
            <span className="hidden h-px flex-1 bg-[#1f2937] md:block" />
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
            {categories.map((category) => {
              return (
                <Link
                  key={category.value}
                  to={`/products?category=${category.value}`}
                  className="group rounded-xl bg-[#ffffff] px-3 py-4 text-center transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="mx-auto mb-4 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white transition-all">
                    {category.image ? (
                      <img
                        src={resolveMediaUrl(category.image)}
                        alt={category.name}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <FaSeedling className="text-3xl text-[#68a300]" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {category.name}
                  </h3>
                </Link>
              );
            })}
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

      {/* Trending Products */}
      <TrendingProducts />

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
