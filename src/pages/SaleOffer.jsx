import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  clearSaleOffer,
  fetchSaleOffer,
  selectCurrentSaleOffer,
  selectSaleOfferError,
  selectSaleOfferStatus,
} from "../store/slices/saleOfferSlice";
import ProductCard from "../components/ProductCard";
import Loader from "../components/Loader";

const SaleOffer = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const saleOffer = useSelector(selectCurrentSaleOffer);
  const isLoading = useSelector(selectSaleOfferStatus);
  const error = useSelector(selectSaleOfferError);
  const API_URL = import.meta.env.VITE_API_URL || "/api";
  const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

  const resolveMediaUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/uploads/")) return `${API_ORIGIN}${url}`;
    return url;
  };

  useEffect(() => {
    dispatch(fetchSaleOffer(id));

    return () => {
      dispatch(clearSaleOffer());
    };
  }, [dispatch, id]);

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-2xl font-bold text-gray-900">Sale not found</h1>
          <p className="mt-3 text-gray-500">{error}</p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center border border-[#232323] bg-[#232323] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-black"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (!saleOffer) {
    return null;
  }

  const products = Array.isArray(saleOffer.products) ? saleOffer.products : [];

  return (
    <div className="min-h-screen bg-white">
      <section className="px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-7xl">
          {saleOffer.banner && (
            <div className="h-[220px] overflow-hidden rounded-xl border border-gray-200 bg-gray-100 sm:h-[340px] lg:h-[480px]">
              <img
                src={resolveMediaUrl(saleOffer.banner)}
                alt={saleOffer.name}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-b border-gray-900 pb-4">
            <h1 className="text-xl font-semibold text-gray-900">
              {saleOffer.name}
            </h1>
            <Link
              to="/products"
              className="text-sm font-semibold text-gray-600 hover:text-gray-900"
            >
              View all products
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <p className="py-16 text-center text-gray-500">
              No products are available for this sale yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default SaleOffer;
