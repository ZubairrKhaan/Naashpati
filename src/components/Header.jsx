import { useState, useEffect, useMemo, useRef } from "react";
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
  createCategory,
  fetchCategories,
  selectCategories,
} from "../store/slices/productSlice";
import {
  MdShoppingCart,
  MdPerson,
  MdMenu,
  MdClose,
  MdSearch,
} from "react-icons/md";

const DEFAULT_CATEGORIES = [
  { name: "Male Collection", description: "" },
  { name: "Female Collection", description: "" },
];

const slugifyCategory = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const Header = () => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileMenuOpen]);

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
  const defaultCategoriesEnsured = useRef(false);

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

  useEffect(() => {
    if (defaultCategoriesEnsured.current) {
      return;
    }

    if (!user || user.role !== "admin") {
      return;
    }

    const existingValues = new Set(
      categories.map((category) => String(category.value || "").toLowerCase()),
    );
    const missingDefaults = DEFAULT_CATEGORIES.filter(
      (category) => !existingValues.has(slugifyCategory(category.name)),
    );

    if (missingDefaults.length === 0) {
      defaultCategoriesEnsured.current = true;
      return;
    }

    defaultCategoriesEnsured.current = true;
    missingDefaults.forEach((category) => {
      dispatch(createCategory(category)).catch(() => {});
    });
  }, [categories, dispatch, user]);

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

  const excludedCategoryValues = new Set(
    DEFAULT_CATEGORIES.map((category) => slugifyCategory(category.name)),
  );

  const categoryLinks = useMemo(() => {
    return categories
      .map((category) => ({
        value: String(category.value || "").toLowerCase(),
        label: category.name,
      }))
      .filter(
        (entry) => entry.value && !excludedCategoryValues.has(entry.value),
      )
      .map((entry) => ({
        to: `/products?category=${encodeURIComponent(entry.value)}`,
        label: entry.label,
      }));
  }, [categories]);

  const genderLinks = [
    {
      to: "/products?gender-category=male-collection",
      label: "Male Collection",
    },
    {
      to: "/products?gender-category=female-collection",
      label: "Female Collection",
    },
  ];

  const navLinks = [
    { to: "/", label: "Home" },
    ...genderLinks,
    ...categoryLinks,
    { to: "/about", label: "About Us" },
    { to: "/contact", label: "Contact" },
    ...(user?.role === "admin" ? [{ to: "/admin", label: "Admin" }] : []),
  ];

  const isNavActive = (to) => {
    if (to.startsWith("/products?")) {
      if (location.pathname !== "/products") {
        return false;
      }

      const locationParams = new URLSearchParams(location.search);
      const targetParams = new URLSearchParams(to.split("?")[1] || "");

      if (targetParams.has("category")) {
        const activeCategory = (locationParams.get("category") || "").toLowerCase();
        const targetCategory = (targetParams.get("category") || "").toLowerCase();
        return Boolean(activeCategory && activeCategory === targetCategory);
      }

      if (targetParams.has("gender-category")) {
        const activeGender = (
          locationParams.get("gender-category") ||
          locationParams.get("collection") ||
          ""
        )
          .toLowerCase();
        const targetGender = (targetParams.get("gender-category") || "").toLowerCase();
        return Boolean(activeGender && activeGender === targetGender);
      }
    }

    return location.pathname === to;
  };

  const renderNavItem = ({ to, label, compact = false }) => {
    const isActive = isNavActive(to);

    return (
      <NavLink
        key={`${compact ? "compact" : "default"}-${to}`}
        to={to}
        className={
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
        {/* ── Top row: logo + search + icons ── */}
        <div
          className={`flex h-16 items-center justify-between ${
            isProfileMenuOpen ? "overflow-visible" : "overflow-hidden"
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

        {/* ── Nav links row ── */}
        <div className="hidden md:block border-t border-gray-100">
          <nav className="flex h-11 items-center justify-center space-x-8">
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
