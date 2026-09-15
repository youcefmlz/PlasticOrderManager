import { CartItem } from "@/contexts/CartContext";
import { Order } from "@/contexts/OrdersContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "auth_token";

const LOCAL_API_URL = "http://localhost:3001/api";

function getApiBaseUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "EXPO_PUBLIC_API_URL must be configured for production builds.",
    );
  }

  return LOCAL_API_URL;
}

const API_BASE_URL = getApiBaseUrl();

let authToken: string | null = null;

export const tokenStorage = {
  getToken: async (): Promise<string | null> => {
    if (authToken) return authToken;
    try {
      authToken = await AsyncStorage.getItem(TOKEN_KEY);
      return authToken;
    } catch {
      return null;
    }
  },
  setToken: async (token: string): Promise<void> => {
    authToken = token;
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch {
      console.error("Failed to save token");
    }
  },
  removeToken: async (): Promise<void> => {
    authToken = null;
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch {
      console.error("Failed to remove token");
    }
  },
};

interface PlaceOrderParams {
  items: CartItem[];
  deliveryAddress: string;
  specialInstructions?: string;
}

interface OrdersResponse {
  orders: Order[];
}

interface OrderResponse {
  order: Order;
  message?: string;
  success?: boolean;
}

interface NotificationsResponse {
  notifications: AdminNotification[];
}

interface UnreadCountResponse {
  count: number;
}

export interface AdminNotification {
  id: string;
  order_id: string;
  type: string;
  title: string;
  message: string;
  data: {
    orderId: string;
    orderNumber: string;
    totalAmount: number;
    wholesalerName?: string;
    wholesalerCompany?: string;
    itemCount: number;
  };
  is_read: boolean;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  role: "wholesaler" | "admin";
  name?: string;
  company?: string;
  phone?: string;
  address?: string;
}

export interface Customer {
  id: string;
  email: string;
  name?: string;
  company?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  image?: string;
  specifications?: Record<string, string>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductsResponse {
  products: Product[];
}

interface ProductResponse {
  product: Product;
  success?: boolean;
}

interface AdminStatsResponse {
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  totalWholesalers: number;
}

interface CustomersResponse {
  customers: Customer[];
}

interface CustomerResponse {
  customer: Customer;
  success?: boolean;
}

const REQUEST_TIMEOUT = 60000;
const MAX_RETRIES = 2;

async function fetchWithTimeout(
  url: string,
  config: RequestInit,
  timeout: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...config,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  requireAuth: boolean = false,
  retryCount: number = 0,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (requireAuth || authToken) {
    const token = await tokenStorage.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else if (requireAuth) {
      throw new Error("Authentication required");
    }
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetchWithTimeout(url, config, REQUEST_TIMEOUT);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "API request failed");
    }

    return data as T;
  } catch (error) {
    if (
      retryCount < MAX_RETRIES &&
      (error instanceof TypeError || (error as Error).name === "AbortError")
    ) {
      console.log(
        `API request failed, retrying... (attempt ${retryCount + 2}/${MAX_RETRIES + 1})`,
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return apiRequest<T>(endpoint, options, requireAuth, retryCount + 1);
    }
    console.error("API Error:", error);
    throw error;
  }
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (response.token) {
      await tokenStorage.setToken(response.token);
    }
    return response;
  },

  logout: async (): Promise<void> => {
    await tokenStorage.removeToken();
  },

  getProfile: async (): Promise<User> => {
    const response = await apiRequest<{ user: User }>("/auth/me", {}, true);
    return response.user;
  },

  updateProfile: async (params: {
    name?: string;
    company?: string;
    phone?: string;
    address?: string;
  }): Promise<User> => {
    const response = await apiRequest<{ user: User }>(
      "/auth/profile",
      {
        method: "PATCH",
        body: JSON.stringify(params),
      },
      true,
    );
    return response.user;
  },
};

export const productsApi = {
  getProducts: async (
    category?: string,
    includeInactive?: boolean,
  ): Promise<Product[]> => {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (includeInactive) params.append("active", "all");
    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await apiRequest<ProductsResponse>(`/products${query}`);
    return response.products;
  },

  getProduct: async (productId: string): Promise<Product> => {
    const response = await apiRequest<ProductResponse>(
      `/products/${productId}`,
    );
    return response.product;
  },

  createProduct: async (product: {
    name: string;
    category: string;
    price: number;
    description?: string;
    image?: string;
    specifications?: Record<string, string>;
  }): Promise<Product> => {
    const response = await apiRequest<ProductResponse>(
      "/products",
      {
        method: "POST",
        body: JSON.stringify(product),
      },
      true,
    );
    return response.product;
  },

  updateProduct: async (
    productId: string,
    product: {
      name: string;
      category: string;
      price: number;
      description?: string;
      image?: string;
      specifications?: Record<string, string>;
      isActive?: boolean;
    },
  ): Promise<Product> => {
    const response = await apiRequest<ProductResponse>(
      `/products/${productId}`,
      {
        method: "PUT",
        body: JSON.stringify(product),
      },
      true,
    );
    return response.product;
  },

  deleteProduct: async (productId: string): Promise<void> => {
    await apiRequest(
      `/products/${productId}`,
      {
        method: "DELETE",
      },
      true,
    );
  },

  getCategories: async (): Promise<string[]> => {
    const response = await apiRequest<{ categories: string[] }>(
      "/products/categories/list",
    );
    return response.categories;
  },
};

export const ordersApi = {
  placeOrder: async (params: PlaceOrderParams): Promise<OrderResponse> => {
    return apiRequest<OrderResponse>(
      "/orders",
      {
        method: "POST",
        body: JSON.stringify({
          items: params.items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          deliveryAddress: params.deliveryAddress,
          specialInstructions: params.specialInstructions,
        }),
      },
      true,
    );
  },

  getOrders: async (userId?: string, all?: boolean): Promise<Order[]> => {
    const params = new URLSearchParams();
    if (userId) params.append("userId", userId);
    if (all) params.append("all", "true");
    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await apiRequest<OrdersResponse>(
      `/orders${query}`,
      {},
      true,
    );
    return response.orders.map((order) => ({
      ...order,
      date: new Date(order.date),
    }));
  },

  getOrder: async (orderId: string): Promise<Order> => {
    const response = await apiRequest<OrderResponse>(
      `/orders/${orderId}`,
      {},
      true,
    );
    return {
      ...response.order,
      date: new Date(response.order.date),
    };
  },

  updateOrderStatus: async (orderId: string, status: string): Promise<void> => {
    await apiRequest(
      `/orders/${orderId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      },
      true,
    );
  },
};

export const adminApi = {
  getNotifications: async (): Promise<AdminNotification[]> => {
    const response = await apiRequest<NotificationsResponse>(
      "/admin/notifications",
      {},
      true,
    );
    return response.notifications;
  },

  markNotificationRead: async (notificationId: string): Promise<void> => {
    await apiRequest(
      `/admin/notifications/${notificationId}/read`,
      {
        method: "PATCH",
      },
      true,
    );
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiRequest<UnreadCountResponse>(
      "/admin/notifications/unread-count",
      {},
      true,
    );
    return response.count;
  },

  getStats: async (): Promise<AdminStatsResponse> => {
    return apiRequest<AdminStatsResponse>("/admin/stats", {}, true);
  },
};

export const customersApi = {
  getCustomers: async (): Promise<Customer[]> => {
    const response = await apiRequest<CustomersResponse>(
      "/admin/customers",
      {},
      true,
    );
    return response.customers;
  },

  getCustomer: async (customerId: string): Promise<Customer> => {
    const response = await apiRequest<CustomerResponse>(
      `/admin/customers/${customerId}`,
      {},
      true,
    );
    return response.customer;
  },

  createCustomer: async (customer: {
    email: string;
    password: string;
    name?: string;
    company?: string;
    phone?: string;
    address?: string;
  }): Promise<Customer> => {
    const response = await apiRequest<CustomerResponse>(
      "/admin/customers",
      {
        method: "POST",
        body: JSON.stringify(customer),
      },
      true,
    );
    return response.customer;
  },

  updateCustomer: async (
    customerId: string,
    customer: {
      name?: string;
      company?: string;
      phone?: string;
      address?: string;
    },
  ): Promise<Customer> => {
    const response = await apiRequest<CustomerResponse>(
      `/admin/customers/${customerId}`,
      {
        method: "PUT",
        body: JSON.stringify(customer),
      },
      true,
    );
    return response.customer;
  },

  resetCustomerPassword: async (
    customerId: string,
    newPassword: string,
  ): Promise<void> => {
    await apiRequest(
      `/admin/customers/${customerId}/reset-password`,
      {
        method: "POST",
        body: JSON.stringify({ password: newPassword }),
      },
      true,
    );
  },

  deleteCustomer: async (customerId: string): Promise<void> => {
    await apiRequest(
      `/admin/customers/${customerId}`,
      {
        method: "DELETE",
      },
      true,
    );
  },
};

export const healthCheck = async (): Promise<boolean> => {
  try {
    await apiRequest("/health");
    return true;
  } catch {
    return false;
  }
};
