import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// Initial state
const initialState = {
  products: [],
  product: null,
  categories: [],
  categoriesStatus: "idle",
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  },
  filters: {
    search: "",
    category: "all",
    minPrice: "",
    maxPrice: "",
    sort: "newest",
  },
};

// Async thunks
export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { products: productState } = getState();
      const queryParams = {
        page: params.page || productState.pagination.page,
        limit: params.limit || productState.pagination.limit,
        search: params.search || productState.filters.search,
        category: params.category || productState.filters.category,
        minPrice: params.minPrice || productState.filters.minPrice,
        maxPrice: params.maxPrice || productState.filters.maxPrice,
        sort: params.sort || productState.filters.sort,
      };

      const queryString = new URLSearchParams(queryParams).toString();
      const response = await api.get(`/products?${queryString}`);

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch products",
      );
    }
  },
);

export const fetchProduct = createAsyncThunk(
  "products/fetchProduct",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch product",
      );
    }
  },
);

export const fetchCategories = createAsyncThunk(
  "products/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`/categories`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch categories",
      );
    }
  },
  {
    condition: (arg, { getState }) => {
      const { products } = getState();
      const force = arg?.force === true;

      if (force) {
        return true;
      }

      if (products.categoriesStatus === "loading") {
        return false;
      }

      if (products.categories.length > 0) {
        return false;
      }

      return true;
    },
  },
);

export const createCategory = createAsyncThunk(
  "products/createCategory",
  async (categoryData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await api.post(`/categories`, categoryData, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to create category",
      );
    }
  },
);

export const deleteCategory = createAsyncThunk(
  "products/deleteCategory",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      await api.delete(`/categories/${id}`, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to delete category",
      );
    }
  },
);

export const createProduct = createAsyncThunk(
  "products/createProduct",
  async (productData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await api.post(`/products`, productData, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to create product",
      );
    }
  },
);

export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async ({ id, productData }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await api.put(`/products/${id}`, productData, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to update product",
      );
    }
  },
);

export const deleteProduct = createAsyncThunk(
  "products/deleteProduct",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      await api.delete(`/products/${id}`, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to delete product",
      );
    }
  },
);

export const createReview = createAsyncThunk(
  "products/createReview",
  async ({ productId, reviewData }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await api.post(
        `/products/${productId}/reviews`,
        reviewData,
        {
          headers: {
            Authorization: `Bearer ${auth.accessToken}`,
          },
        },
      );
      return { productId, review: response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to create review",
      );
    }
  },
);

// Product slice
const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearProduct: (state) => {
      state.product = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch products
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch single product
      .addCase(fetchProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.product = action.payload;
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch categories
      .addCase(fetchCategories.pending, (state) => {
        state.categoriesStatus = "loading";
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categoriesStatus = "succeeded";
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.categoriesStatus = "failed";
        state.error = action.payload;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
        state.categories.sort((a, b) => a.name.localeCompare(b.name));
        state.categoriesStatus = "succeeded";
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(
          (category) => category._id !== action.payload,
        );
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Create product
      .addCase(createProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products.unshift(action.payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update product
      .addCase(updateProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.products.findIndex(
          (p) => p._id === action.payload._id,
        );
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        if (state.product && state.product._id === action.payload._id) {
          state.product = action.payload;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete product
      .addCase(deleteProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = state.products.filter((p) => p._id !== action.payload);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create review
      .addCase(createReview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.product && state.product._id === action.payload.productId) {
          state.product.reviews.push(action.payload.review);
          state.product.calculateAverageRating();
        }
      })
      .addCase(createReview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setFilters, clearFilters, clearProduct } =
  productSlice.actions;
export const selectProducts = (state) => state.products.products;
export const selectCategories = (state) => state.products.categories;
export const selectCategoriesStatus = (state) =>
  state.products.categoriesStatus;
export const selectProductsError = (state) => state.products.error;
export const selectProductsStatus = (state) => state.products.isLoading;
export const selectProduct = (state) => state.products.product;
export default productSlice.reducer;
