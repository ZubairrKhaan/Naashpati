import { useState, useEffect, useMemo } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  selectAuthChecked,
  selectAuthIsLoading,
  selectAuthUser,
  logoutUser,
} from "../store/slices/authSlice";
import { selectCartItemCount, resetCart } from "../store/slices/cartSlice";
import {
  fetchCategories,
  selectCategories,
} from "../store/slices/productSlice";
import {
  MdShoppingCart,
  MdPerson,
  MdMenu,
  MdClose,
  MdSearch,
  MdKeyboardArrowDown,
  MdChevronRight,
} from "react-icons/md";

const Header = () => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProductsMenuOpen, setIsProductsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : false,
  );
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    const onResize = () => setIsDesktop(window.innerWidth >= 768);

    onResize();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileMenuOpen]);

  const isScrolled = isDesktop && scrolled;

  const dispatch = useDispatch();
  const user = useSelector(selectAuthUser);
  const categories = useSelector(selectCategories);
  const accessToken = useSelector((state) => state.auth.accessToken);
  const authChecked = useSelector(selectAuthChecked);
  const authLoading = useSelector(selectAuthIsLoading);
  const cartItemCount = useSelector(selectCartItemCount);
  const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
  const showAuthPendingState =
    !!accessToken && (!authChecked || (authLoading && !user));

  const avatarCandidates = useMemo(() => {
    if (!user?.avatar) return [];

    if (
      user.avatar.startsWith("http://") ||
      user.avatar.startsWith("https://")
    ) {
      return [user.avatar];
    }

    if (user.avatar.startsWith("/uploads/")) {
      const sameOrigin =
        typeof window !== "undefined"
          ? `${window.location.origin}${user.avatar}`
          : user.avatar;
      return [`${API_URL}${user.avatar}`, sameOrigin, user.avatar];
    }

    return [user.avatar];
  }, [API_URL, user?.avatar]);

  const [avatarSrcIndex, setAvatarSrcIndex] = useState(0);

  useEffect(() => {
    setAvatarSrcIndex(0);
  }, [avatarCandidates.length, user?.avatar]);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logoutUser());
    dispatch(resetCart());
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate("/products", { state: { search: q } });
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    if (location.pathname === "/products") {
      navigate("/products", { replace: true, state: { search: "" } });
    }
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);

    if (location.pathname !== "/products") {
      return;
    }

    navigate("/products", { replace: true, state: { search: value } });
  };

  const handleCategoryNavigate = (categoryValue) => {
    navigate(
      categoryValue
        ? `/products?category=${encodeURIComponent(categoryValue)}`
        : "/products",
    );
    setIsProductsMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/products", label: "All Products" },
    { to: "/about", label: "About Us" },
    { to: "/contact", label: "Contact" },
    ...(user?.role === "admin" ? [{ to: "/admin", label: "Admin" }] : []),
  ];
  const visibleCategoryLinks = categories.slice(0, 7);

  const renderNavItem = ({ to, label, compact = false }) => {
    if (to !== "/products") {
      return (
        <NavLink
          key={`${compact ? "compact" : "default"}-${to}`}
          to={to}
          className={({ isActive }) =>
            compact
              ? `text-[14px] font-medium transition-colors ${
                  isActive
                    ? "text-[#68a300]"
                    : "text-gray-700 hover:text-[#68a300]"
                }`
              : `pb-0.5 transition-colors font-medium text-[14px] ${
                  isActive
                    ? "text-[#68a300] border-b-2 border-[#68a300]"
                    : "text-gray-700 hover:text-[#68a300]"
                }`
          }
        >
          {label}
        </NavLink>
      );
    }

    return (
      <div
        key={`${compact ? "compact" : "default"}-${to}`}
        className="relative"
        onMouseEnter={() => setIsProductsMenuOpen(true)}
        onMouseLeave={() => setIsProductsMenuOpen(false)}
      >
        <NavLink
          to={to}
          className={({ isActive }) =>
            compact
              ? `inline-flex items-center text-[14px] font-medium transition-colors ${
                  isActive || isProductsMenuOpen
                    ? "text-[#68a300]"
                    : "text-gray-700 hover:text-[#68a300]"
                }`
              : `inline-flex items-center pb-0.5 transition-colors font-medium text-[14px] ${
                  isActive || isProductsMenuOpen
                    ? "text-[#68a300] border-b-2 border-[#68a300]"
                    : "text-gray-700 hover:text-[#68a300]"
                }`
          }
        >
          {label}
          <MdKeyboardArrowDown className="ml-1 text-base" />
        </NavLink>

        <div
          className={`absolute left-0 top-full z-[80] mt-2 w-60 border border-gray-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.12)] transition-all duration-200 ${
            isProductsMenuOpen
              ? "pointer-events-auto visible opacity-100"
              : "pointer-events-none invisible opacity-0"
          }`}
        >
          <div className="bg-white">
            {visibleCategoryLinks.map((category) => (
              <button
                key={category._id || category.value}
                type="button"
                onClick={() => handleCategoryNavigate(category.value)}
                className="flex w-full items-center justify-between border-b border-gray-200 px-4 py-3 text-left text-[15px] text-gray-700 transition hover:bg-gray-50 hover:text-[#68a300]"
              >
                <span>{category.name}</span>
                <MdChevronRight className="text-lg text-gray-500" />
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleCategoryNavigate("")}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-[15px] text-gray-700 transition hover:bg-gray-50 hover:text-[#68a300]"
            >
              <span>More</span>
              <MdChevronRight className="text-lg text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const rightIcons = (
    <div className="flex items-center space-x-3">
      <Link to="/cart" className="relative">
        <MdShoppingCart className="text-xl text-[#68a300]" />
        {cartItemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
            {cartItemCount}
          </span>
        )}
      </Link>

      {showAuthPendingState ? (
        <div className="h-8 w-20 animate-pulse rounded-md bg-gray-100" />
      ) : user ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsProfileMenuOpen(!isProfileMenuOpen);
              setIsMobileMenuOpen(false);
            }}
            className="rounded-full border-0 bg-transparent p-1.5 hover:bg-transparent focus:outline-none focus:ring-0 focus-visible:outline-none"
          >
            {user?.avatar ? (
              <img
                src={avatarCandidates[avatarSrcIndex] || ""}
                alt={user?.name || "Profile"}
                className="h-7 w-7 rounded-full object-cover"
                onError={() => {
                  if (avatarSrcIndex < avatarCandidates.length - 1) {
                    setAvatarSrcIndex((prev) => prev + 1);
                  }
                }}
              />
            ) : (
              <MdPerson className="text-xl" />
            )}
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 z-[70] mt-2 min-w-[160px] overflow-hidden rounded-none border border-gray-200 bg-white shadow-lg">
              <Link
                to="/profile"
                onClick={() => setIsProfileMenuOpen(false)}
                className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                Profile
              </Link>
              <button
                type="button"
                onClick={() => {
                  handleLogout();
                  setIsProfileMenuOpen(false);
                }}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 focus:outline-none border-0"
                style={{ boxShadow: "none" }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex space-x-2 text-sm">
          <Link to="/login" className="text-gray-700 hover:text-[#68a300]">
            Login
          </Link>
          <Link to="/register" className="text-gray-700 hover:text-[#68a300]">
            Sign Up
          </Link>
        </div>
      )}

      <button
        type="button"
        className="md:hidden"
        onClick={() => {
          setIsMobileMenuOpen(!isMobileMenuOpen);
          setIsProfileMenuOpen(false);
        }}
      >
        {isMobileMenuOpen ? <MdClose /> : <MdMenu />}
      </button>
    </div>
  );

  return (
    <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        {/* ── Top row: logo + search + icons ── fades/shrinks away on scroll */}
        <div
          className={`flex justify-between items-center transition-all duration-300 ease-in-out ${
            isProfileMenuOpen ? "overflow-visible" : "overflow-hidden"
          } ${
            isScrolled
              ? "h-0 opacity-0 pointer-events-none"
              : "h-16 opacity-100"
          }`}
        >
          <Link
            to="/"
            className="flex items-center shrink-0 border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none"
          >
            <img
              src="/assets/logos/Logo.png"
              alt="Naashpati"
              className="h-6 w-auto border-0 outline-none"
            />
          </Link>

          <form
            onSubmit={handleSearch}
            className="hidden md:flex items-center w-[480px]"
          >
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-md border border-gray-300 bg-white py-1.5 pl-4 pr-16 text-sm outline-none focus:border-[#68a300] focus:ring-1 focus:ring-[#68a300]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-9 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  aria-label="Clear search"
                >
                  <MdClose className="text-base" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#68a300]"
                aria-label="Search"
              >
                <MdSearch className="text-lg" />
              </button>
            </div>
          </form>

          {rightIcons}
        </div>

        {/* ── Compact row: logo + nav + icons (only when scrolled) ── */}
        <div
          className={`flex items-center transition-all duration-300 ease-in-out ${
            isProfileMenuOpen || isProductsMenuOpen
              ? "overflow-visible"
              : "overflow-hidden"
          } ${
            isScrolled
              ? "h-12 opacity-100"
              : "h-0 opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex w-1/4 items-center justify-start">
            <Link
              to="/"
              className="flex items-center shrink-0 border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none"
            >
              <img
                src="/assets/logos/Logo.png"
                alt="Naashpati"
                className="h-5 w-auto border-0 outline-none"
              />
            </Link>
          </div>

          <nav className="hidden md:flex w-2/4 items-center justify-center space-x-6">
            {navLinks.map((link) => renderNavItem({ ...link, compact: true }))}
          </nav>

          <div className="flex w-1/4 items-center justify-end">
            {rightIcons}
          </div>
        </div>

        {/* ── Nav links row (shown at top, hidden when scrolled) ── */}
        <div
          className={`hidden md:block border-t border-gray-100 transition-all duration-300 ease-in-out ${
            isProductsMenuOpen ? "overflow-visible" : "overflow-hidden"
          } ${isScrolled ? "h-0 opacity-0" : "h-11 opacity-100"}`}
        >
          <nav className="flex justify-center items-center space-x-8 h-11">
            {navLinks.map((link) => renderNavItem(link))}
          </nav>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <div
        className={`md:hidden fixed inset-0 z-[120] transition-opacity duration-300 ${
          isMobileMenuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <button
          type="button"
          aria-label="Close menu overlay"
          className="absolute inset-0 bg-black/35"
          onClick={() => setIsMobileMenuOpen(false)}
        />

        <aside
          className={`absolute right-0 top-0 h-full w-[82%] max-w-[340px] bg-white shadow-2xl border-l border-gray-200 transition-transform duration-300 ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
            <span className="text-base font-semibold text-gray-900">Menu</span>
            <button
              type="button"
              className="rounded p-1 text-gray-700"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <MdClose className="text-xl" />
            </button>
          </div>

          <nav className="space-y-1 px-4 py-4">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block rounded px-2 py-2.5 font-medium transition-colors ${
                    isActive
                      ? "bg-[#f3f9e8] text-[#68a300]"
                      : "text-gray-700 hover:bg-gray-50 hover:text-[#68a300]"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
      </div>
    </header>
  );
};

export default Header;
