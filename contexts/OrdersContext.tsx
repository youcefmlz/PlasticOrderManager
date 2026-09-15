import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { CartItem } from "./CartContext";
import { ordersApi } from "@/services/api";
import { useAuth } from "./AuthContext";

export type OrderStatus = "Pending" | "Confirmed" | "Delivered";

export type Order = {
  id: string;
  orderNumber: string;
  date: Date;
  status: OrderStatus;
  items: CartItem[];
  totalAmount: number;
  deliveryAddress: string;
  specialInstructions?: string;
  wholesalerName?: string;
  wholesalerCompany?: string;
  wholesalerPhone?: string;
};

type PlaceOrderResult = {
  success: boolean;
  order?: Order;
  error?: string;
};

type OrdersContextType = {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
  placeOrder: (
    items: CartItem[],
    totalAmount: number,
    deliveryAddress: string,
    specialInstructions?: string,
    wholesalerInfo?: {
      name?: string;
      company?: string;
      phone?: string;
    },
  ) => Promise<PlaceOrderResult>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  refreshOrders: () => Promise<void>;
};

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const refreshOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setError(null);
      setIsOnline(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const fetchedOrders = await ordersApi.getOrders();
      setOrders(fetchedOrders);
      setIsOnline(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load orders";
      setOrders([]);
      setError(message);
      setIsOnline(false);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refreshOrders();
  }, [refreshOrders]);

  const placeOrder = async (
    items: CartItem[],
    _totalAmount: number,
    deliveryAddress: string,
    specialInstructions?: string,
    _wholesalerInfo?: {
      name?: string;
      company?: string;
      phone?: string;
    },
  ): Promise<PlaceOrderResult> => {
    try {
      const response = await ordersApi.placeOrder({
        items,
        deliveryAddress,
        specialInstructions,
      });

      if (response.order) {
        const newOrder: Order = {
          ...response.order,
          date: new Date(response.order.date),
        };
        setOrders((prev) => [newOrder, ...prev]);
        setIsOnline(true);
        return { success: true, order: newOrder };
      }

      return { success: false, error: "No order returned from server" };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to place order";
      setIsOnline(false);
      return {
        success: false,
        error: message,
      };
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      if (isOnline) {
        await ordersApi.updateOrderStatus(orderId, status);
      }
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status } : order,
        ),
      );
    } catch (err) {
      console.log("Failed to update order status on server, updating locally");
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status } : order,
        ),
      );
    }
  };

  return (
    <OrdersContext.Provider
      value={{
        orders,
        isLoading,
        error,
        isOnline,
        placeOrder,
        updateOrderStatus,
        refreshOrders,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error("useOrders must be used within OrdersProvider");
  }
  return context;
}
