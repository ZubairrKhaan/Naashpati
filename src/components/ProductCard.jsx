// Helper to resolve image/media URLs (handles absolute and relative paths)
const resolveMediaUrl = (url, serverUrl) => {
  if (!url) return "/placeholder-product.jpg";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/uploads/")) return `${serverUrl}${url}`;
  return url;
};
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../store/slices/cartSlice";
import { selectAuthUser } from "../store/slices/authSlice";
import toast from "react-hot-toast";
import {
  MdStar,
  MdShoppingCart,
  MdFavoriteBorder,
  MdVisibility,
} from "react-icons/md";

const ProductCard = ({ product, viewMode = "grid" }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectAuthUser);
  const isAdmin = user?.role === "admin";
  const ratingValue = product.averageRating ?? product.rating ?? 0;
  const reviewCount = product.numReviews ?? product.reviewCount ?? 0;
  const API_URL = import.meta.env.VITE_API_URL || "/api";
  const SERVER_URL = API_URL.replace(/\/api\/?$/, "");
  const productUrl = `/products/${product.slug || product._id}`;
  const salePrice = Number(product.salePrice ?? product.price ?? 0);
  const originalPrice = Number(product.originalPrice ?? product.price ?? 0);
  const stockCount = Number(product.stock ?? 0);
  const isOutOfStock = stockCount <= 0;
  const hasDiscount =
    Number.isFinite(originalPrice) &&
    Number.isFinite(salePrice) &&
    originalPrice > salePrice;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
    : 0;
  const productImage = product.image
    ? resolveMediaUrl(product.image, SERVER_URL)
    : resolveMediaUrl(
        product.images?.[0]?.url || product.images?.[0],
        SERVER_URL,
      );
  const summaryText =
    product.shortDescription ||
    product.briefDescriptionPoints?.[0] ||
    product.briefDescription ||
    "";

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAdmin) {
      toast.error("Admin accounts cannot add products to cart");
      return;
    }

    if (isOutOfStock) {
      toast.error("Product is out of stock");
      return;
    }

    dispatch(addToCart({ product, quantity: 1 }));
    toast.success("Added to cart!");
  };

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleQuickViewClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <MdStar
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : "text-secondary-300"
        }`}
      />
    ));
  };

  if (viewMode === "list") {
    return (
      <Link
        to={productUrl}
        className="group flex flex-col overflow-hidden rounded-lg bg-white shadow-soft transition-shadow duration-300 hover:shadow-large sm:flex-row"
      >
        <div className="h-52 w-full overflow-hidden sm:h-auto sm:w-56">
          <img
            src={productImage}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <div className="flex flex-1 flex-col justify-between p-4">
          <div>
            <h3 className="mb-2 text-lg font-semibold text-secondary-900 transition-colors group-hover:text-primary-600">
              {product.name}
            </h3>

            <div className="mb-2 flex items-center">
              <div className="flex items-center">
                {renderStars(ratingValue)}
              </div>
              <span className="ml-2 text-sm text-secondary-600">
                ({reviewCount})
              </span>
            </div>

            <p className="mb-2 line-clamp-2 text-sm text-secondary-600">
              {summaryText}
            </p>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
              {product.category ? (
                <span className="rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
                  {product.category}
                </span>
              ) : null}
              <span
                className={`rounded-full px-2 py-1 font-medium ${
                  !isOutOfStock
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {!isOutOfStock ? `Stock: ${stockCount}` : "Out of stock"}
              </span>
              {hasDiscount ? (
                <span className="rounded-full bg-orange-50 px-2 py-1 font-semibold text-orange-700">
                  -{discountPercent}%
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-lg">
              <span className="mr-1 text-xs align-super text-black-100">
                PKR
              </span>
              {salePrice.toFixed(2)}
            </span>
            {hasDiscount ? (
              <span className="text-sm text-gray-400 line-through">
                PKR {originalPrice.toFixed(2)}
              </span>
            ) : null}

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAdmin}
              className="bg-transparent border-0 p-0 text-[#68a300] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Add to cart"
            >
              <MdShoppingCart className="h-5 w-5 transition-transform duration-150 hover:scale-125" />
            </button>
          </div>

          {isOutOfStock && (
            <p className="mt-2 text-sm text-accent-600">Out of stock</p>
          )}
        </div>
      </Link>
    );
  }

  if (viewMode === "trending") {
    return (
      <Link
        to={productUrl}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      >
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <img
            src={productImage}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {hasDiscount ? (
              <span className="rounded-full bg-orange-500/90 px-2 py-1 text-xs font-semibold text-white">
                -{discountPercent}%
              </span>
            ) : null}
            <span
              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                !isOutOfStock
                  ? "bg-emerald-500/90 text-white"
                  : "bg-red-500/90 text-white"
              }`}
            >
              {!isOutOfStock ? `Stock: ${stockCount}` : "Out of stock"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleWishlistClick}
            aria-label="Add to wishlist"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm transition hover:scale-105"
          >
            <MdFavoriteBorder className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col p-4">
          {product.category ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              {product.category}
            </p>
          ) : null}
          <h3 className="mt-2 line-clamp-2 text-base font-semibold text-gray-900">
            {product.name}
          </h3>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-lg font-semibold text-gray-900">
              <span className="mr-1 text-xs align-super text-black-100">
                PKR
              </span>
              {salePrice.toFixed(2)}
            </span>
            {hasDiscount ? (
              <span className="text-sm text-gray-400 line-through">
                PKR {originalPrice.toFixed(2)}
              </span>
            ) : null}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAdmin}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#68a300] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#5f9600] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <MdShoppingCart className="h-4 w-4" />
              Add to Cart
            </button>
            <button
              type="button"
              onClick={handleQuickViewClick}
              className="inline-flex items-center justify-center rounded-full border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-gray-300"
            >
              <MdVisibility className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Link>
    );
  }

  if (viewMode === "compact") {
    return (
      <Link
        to={productUrl}
        className="group overflow-hidden rounded-lg bg-white shadow-soft transition-shadow duration-300 hover:shadow-large"
      >
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={productImage}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <div className="p-3">
          <h3 className="mb-1 line-clamp-1 text-sm font-semibold text-secondary-900 transition-colors group-hover:text-primary-600">
            {product.name}
          </h3>

          <p className="mb-2 line-clamp-2 text-xs text-secondary-600">
            {summaryText}
          </p>

          <div className="mb-2 flex items-center">
            <div className="flex items-center">{renderStars(ratingValue)}</div>
            <span className="ml-1 text-xs text-secondary-600">
              ({reviewCount})
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">
              <span className="mr-1 text-[10px] align-super text-black-100">
                PKR
              </span>
              {salePrice.toFixed(2)}
            </span>
            {hasDiscount ? (
              <span className="text-[11px] text-gray-400 line-through">
                {originalPrice.toFixed(2)}
              </span>
            ) : null}

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAdmin}
              className="bg-transparent border-0 p-0 text-[#68a300] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Add to cart"
            >
              <MdShoppingCart className="h-5 w-5 transition-transform duration-150 hover:scale-125" />
            </button>
          </div>

          {isOutOfStock && (
            <p className="mt-1 text-xs text-accent-600">Out of stock</p>
          )}
        </div>
      </Link>
    );
  }

  if (viewMode === "tiny") {
    return (
      <Link
        to={productUrl}
        className="group overflow-hidden rounded-md bg-white shadow-soft transition-shadow duration-300 hover:shadow-large"
      >
        <div className="aspect-square overflow-hidden">
          <img
            src={productImage}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <div className="p-2">
          <h3 className="mb-1 line-clamp-1 text-xs font-semibold text-secondary-900 transition-colors group-hover:text-primary-600">
            {product.name}
          </h3>

          <p className="mb-2 line-clamp-2 text-[11px] text-secondary-600">
            {summaryText}
          </p>

          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-medium">
              <span className="mr-1 text-[9px] align-super text-black-100">
                PKR
              </span>
              {salePrice.toFixed(2)}
            </span>

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAdmin}
              className="bg-transparent border-0 p-0 text-[#68a300] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Add to cart"
            >
              <MdShoppingCart className="h-4 w-4 transition-transform duration-150 hover:scale-125" />
            </button>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={productUrl}
      className="group bg-white rounded-lg shadow-soft overflow-hidden hover:shadow-large transition-shadow duration-300"
    >
      <div className="aspect-square overflow-hidden">
        <img
          src={productImage}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-secondary-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {product.name}
        </h3>

        <div className="flex items-center mb-2">
          <div className="flex items-center">{renderStars(ratingValue)}</div>
          <span className="text-sm text-secondary-600 ml-2">
            ({reviewCount})
          </span>
        </div>

        <p className="text-secondary-600 text-sm mb-3 line-clamp-2">
          {summaryText}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-lg">
            <span className="text-xs align-super mr-1 text-black-100">PKR</span>
            {salePrice.toFixed(2)}
          </span>
          {hasDiscount ? (
            <span className="text-sm text-gray-400 line-through">
              PKR {originalPrice.toFixed(2)}
            </span>
          ) : null}

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdmin}
            className="bg-transparent border-0 p-0 text-[#68a300] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Add to cart"
          >
            <MdShoppingCart className="h-5 w-5 transition-transform duration-150 hover:scale-125" />
          </button>
        </div>

        {isOutOfStock && (
          <p className="text-accent-600 text-sm mt-2">Out of stock</p>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
