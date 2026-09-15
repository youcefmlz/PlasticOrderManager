import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import ScreenScrollView from "@/components/ScreenScrollView";
import { Card } from "@/components/Card";
import { ordersApi } from "@/services/api";
import { Order, OrderStatus } from "@/contexts/OrdersContext";

const ORDER_STATUSES: OrderStatus[] = ["Pending", "Confirmed", "Delivered"];

function getStatusColor(status: string, theme: any): string {
  switch (status) {
    case "Pending":
      return theme.warning;
    case "Confirmed":
      return theme.primary;
    case "Delivered":
      return theme.success;
    default:
      return theme.text;
  }
}

function getNextStatus(currentStatus: OrderStatus): OrderStatus | null {
  const index = ORDER_STATUSES.indexOf(currentStatus);
  if (index === -1 || index >= ORDER_STATUSES.length - 1) return null;
  return ORDER_STATUSES[index + 1];
}

function getStatusAction(status: OrderStatus): string {
  switch (status) {
    case "Pending":
      return "Confirm Order";
    case "Confirmed":
      return "Mark as Delivered";
    default:
      return "";
  }
}

export default function AdminOrdersScreen() {
  const { theme } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      // Pass all=true to get all customer orders
      const fetchedOrders = await ordersApi.getOrders(undefined, true);
      setOrders(fetchedOrders);
    } catch (error) {
      console.log("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: OrderStatus,
  ) => {
    try {
      await ordersApi.updateOrderStatus(orderId, newStatus);
      await fetchOrders();
    } catch (error) {
      if (Platform.OS === "web") {
        window.alert("Failed to update order status");
      } else {
        Alert.alert("Error", "Failed to update order status");
      }
    }
  };

  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const filterCounts: Record<string, number> = {
    all: orders.length,
    Pending: orders.filter((o) => o.status === "Pending").length,
    Confirmed: orders.filter((o) => o.status === "Confirmed").length,
    Delivered: orders.filter((o) => o.status === "Delivered").length,
  };

  return (
    <ScreenScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          Orders Management
        </Text>

        <View style={styles.filterContainer}>
          {["all", ...ORDER_STATUSES].map((status) => (
            <Pressable
              key={status}
              style={[
                styles.filterButton,
                {
                  backgroundColor:
                    filter === status
                      ? theme.primary
                      : theme.backgroundSecondary,
                  borderColor: filter === status ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setFilter(status)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === status ? "#FFFFFF" : theme.text },
                ]}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} (
                {filterCounts[status]})
              </Text>
            </Pressable>
          ))}
        </View>

        {filteredOrders.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Feather name="inbox" size={48} color={theme.text} />
            <Text style={[styles.emptyText, { color: theme.text }]}>
              No {filter === "all" ? "" : filter} orders found
            </Text>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const isExpanded = expandedOrder === order.id;
            const nextStatus = getNextStatus(order.status);
            const actionText = getStatusAction(order.status);

            return (
              <Card key={order.id} style={styles.orderCard}>
                <Pressable
                  style={styles.orderHeader}
                  onPress={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <View style={styles.orderInfo}>
                    <Text
                      style={[styles.orderId, { color: theme.textPrimary }]}
                    >
                      #{order.orderNumber || order.id.slice(-8).toUpperCase()}
                    </Text>
                    <Text style={[styles.orderCustomer, { color: theme.text }]}>
                      {order.wholesalerName ||
                        order.wholesalerCompany ||
                        "Unknown Customer"}
                    </Text>
                  </View>
                  <View style={styles.orderMeta}>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            getStatusColor(order.status, theme) + "20",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(order.status, theme) },
                        ]}
                      >
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </Text>
                    </View>
                    <Feather
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={theme.text}
                    />
                  </View>
                </Pressable>

                <View style={styles.orderSummary}>
                  <Text
                    style={[styles.orderAmount, { color: theme.textPrimary }]}
                  >
                    ${order.totalAmount.toFixed(2)}
                  </Text>
                  <Text style={[styles.orderDate, { color: theme.secondary }]}>
                    {order.date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>

                {isExpanded ? (
                  <View style={styles.expandedContent}>
                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: theme.border },
                      ]}
                    />

                    <Text style={[styles.sectionLabel, { color: theme.text }]}>
                      Order Items
                    </Text>
                    {order.items?.map((item, index) => (
                      <View key={index} style={styles.itemRow}>
                        <Text
                          style={[
                            styles.itemName,
                            { color: theme.textPrimary },
                          ]}
                        >
                          {item.product.name} x{item.quantity}
                        </Text>
                        <Text style={[styles.itemPrice, { color: theme.text }]}>
                          DA {(item.product.price * item.quantity).toFixed(2)}
                        </Text>
                      </View>
                    ))}

                    {order.deliveryAddress ? (
                      <>
                        <Text
                          style={[
                            styles.sectionLabel,
                            { color: theme.text, marginTop: Spacing.md },
                          ]}
                        >
                          Delivery Address
                        </Text>
                        <Text
                          style={[
                            styles.addressText,
                            { color: theme.textPrimary },
                          ]}
                        >
                          {order.deliveryAddress}
                        </Text>
                      </>
                    ) : null}

                    {order.specialInstructions ? (
                      <>
                        <Text
                          style={[
                            styles.sectionLabel,
                            { color: theme.text, marginTop: Spacing.md },
                          ]}
                        >
                          Special Instructions
                        </Text>
                        <Text
                          style={[
                            styles.notesText,
                            { color: theme.textPrimary },
                          ]}
                        >
                          {order.specialInstructions}
                        </Text>
                      </>
                    ) : null}

                    {order.status !== "Delivered" ? (
                      <View style={styles.actionButtons}>
                        {nextStatus ? (
                          <Pressable
                            style={[
                              styles.actionButton,
                              { backgroundColor: theme.primary },
                            ]}
                            onPress={() =>
                              handleUpdateStatus(order.id, nextStatus)
                            }
                          >
                            <Feather name="check" size={18} color="#FFFFFF" />
                            <Text style={styles.actionButtonText}>
                              {actionText}
                            </Text>
                          </Pressable>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </Card>
            );
          })
        )}
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing["5xl"],
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.lg,
  },
  filterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterText: {
    ...Typography.caption,
    fontWeight: "600",
  },
  emptyCard: {
    padding: Spacing["3xl"],
    alignItems: "center",
  },
  emptyText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
  orderCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    ...Typography.label,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  orderCustomer: {
    ...Typography.small,
  },
  orderMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: "600",
  },
  orderSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  orderAmount: {
    ...Typography.h4,
  },
  orderDate: {
    ...Typography.caption,
  },
  expandedContent: {
    marginTop: Spacing.md,
  },
  divider: {
    height: 1,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    ...Typography.caption,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  itemName: {
    ...Typography.body,
    flex: 1,
  },
  itemPrice: {
    ...Typography.body,
  },
  addressText: {
    ...Typography.body,
  },
  notesText: {
    ...Typography.body,
    fontStyle: "italic",
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  actionButtonText: {
    color: "#FFFFFF",
    ...Typography.label,
    fontWeight: "600",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  cancelButtonText: {
    ...Typography.label,
    fontWeight: "600",
  },
});
