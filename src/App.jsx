import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentUser, setAuthChecked } from "./store/slices/authSlice";
import Layout from "./components/Layout";
import Loader from "./components/Loader";

const Home = lazy(() => import("./pages/Home"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Profile = lazy(() => import("./pages/Profile"));
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const EditProduct = lazy(() => import("./pages/admin/EditProduct"));

const OrderDetail = lazy(() => import("./pages/admin/OrderDetail"));
const UserDetail = lazy(() => import("./pages/admin/UserDetail"));

const NotFound = lazy(() => import("./pages/NotFound"));

function App() {
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state.auth.accessToken);

  useEffect(() => {
    if (accessToken) {
      dispatch(getCurrentUser());
      return;
    }

    dispatch(setAuthChecked(true));
  }, [accessToken, dispatch]);

  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route
            path="female-collection"
            element={
              <Navigate
                to="/products?gender-category=female-collection"
                replace
              />
            }
          />
          <Route
            path="male-collection"
            element={
              <Navigate
                to="/products?gender-category=male-collection"
                replace
              />
            }
          />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password/:token" element={<ResetPassword />} />
          <Route path="profile" element={<Profile />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="contact" element={<Contact />} />
          <Route path="about" element={<About />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/orders/:id" element={<OrderDetail />} />
          <Route path="admin/products/:id" element={<EditProduct />} />
          <Route path="admin/users/:id" element={<UserDetail />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
