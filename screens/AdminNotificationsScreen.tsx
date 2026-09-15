import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  RefreshControl,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import ScreenScrollView from "@/components/ScreenScrollView";
import { Card } from "@/components/Card";
import { adminApi, ordersApi, AdminNotification } from "@/services/api";
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

export default function AdminNotificationsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] =
    useState<AdminNotification | null>(null);
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [orderLoadError, setOrderLoadError] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await adminApi.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.log("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await adminApi.markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n,
        ),
      );
    } catch (error) {
      console.log("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    try {
      await Promise.all(
        unreadIds.map((id) => adminApi.markNotificationRead(id)),
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.log("Failed to mark all as read");
    }
  };

  const handleNotificationPress = async (notification: AdminNotification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    if (notification.order_id) {
      setSelectedNotification(notification);
      setLoadingOrder(true);
      setOrderDetails(null);
      setOrderLoadError(false);

      try {
        // Pass all=true to get all orders including customer orders
        const orders = await ordersApi.getOrders(undefined, true);
        const order = orders.find((o) => o.id === notification.order_id);
        if (order) {
          setOrderDetails(order);
        } else {
          setOrderLoadError(true);
        }
      } catch (error) {
        console.log("Failed to load order details");
        setOrderLoadError(true);
      } finally {
        setLoadingOrder(false);
      }
    }
  };

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!orderDetails) return;

    setUpdatingStatus(true);
    setOrderLoadError(false); // Clear any previous error state
    try {
      await ordersApi.updateOrderStatus(orderDetails.id, newStatus);

      // Update local order details to show new status
      setOrderDetails((prev) => (prev ? { ...prev, status: newStatus } : null));
      setUpdatingStatus(false);

      // Close modal after a brief delay to show the updated status
      setTimeout(() => {
        closeOrderModal();

        // Refetch notifications to keep data in sync
        fetchNotifications().catch(() => {});

        // Show success message
        if (Platform.OS === "web") {
          window.alert(`Order status updated to ${newStatus}`);
        } else {
          Alert.alert("Success", `Order status updated to ${newStatus}`);
        }
      }, 300);
    } catch (error) {
      if (Platform.OS === "web") {
        window.alert("Failed to update order status");
      } else {
        Alert.alert("Error", "Failed to update order status");
      }
      setUpdatingStatus(false);
    }
  };

  const closeOrderModal = () => {
    setSelectedNotification(null);
    setOrderDetails(null);
    setUpdatingStatus(false);
    setLoadingOrder(false);
    setOrderLoadError(false);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getNotificationIcon = (type: string): keyof typeof Feather.glyphMap => {
    switch (type) {
      case "new_order":
        return "shopping-cart";
      case "order_update":
        return "refresh-cw";
      case "low_stock":
        return "alert-triangle";
      default:
        return "bell";
    }
  };

  const getNotificationColor = (type: string, theme: any): string => {
    switch (type) {
      case "new_order":
        return theme.success;
      case "order_update":
        return theme.primary;
      case "low_stock":
        return theme.warning;
      default:
        return theme.text;
    }
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <>
      <ScreenScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                Notifications
              </Text>
              <Text style={[styles.subtitle, { color: theme.text }]}>
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </Text>
            </View>
            {unreadCount > 0 ? (
              <Pressable
                style={[styles.markAllButton, { borderColor: theme.primary }]}
                onPress={handleMarkAllAsRead}
              >
                <Feather name="check-circle" size={16} color={theme.primary} />
                <Text style={[styles.markAllText, { color: theme.primary }]}>
                  Mark all read
                </Text>
              </Pressable>
            ) : null}
          </View>

          {notifications.length === 0 ? (
            <Card style={styles.emptyCard}>
              <View
                style={[
                  styles.emptyIconContainer,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
              >
                <Feather name="bell-off" size={48} color={theme.text} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                No notifications yet
              </Text>
              <Text style={[styles.emptyText, { color: theme.text }]}>
                When new orders come in, you will see them here
              </Text>
            </Card>
          ) : (
            notifications.map((notification) => {
              const iconName = getNotificationIcon(notification.type);
              const iconColor = getNotificationColor(notification.type, theme);

              return (
                <Pressable
                  key={notification.id}
                  onPress={() => handleNotificationPress(notification)}
                >
                  <Card
                    style={[
                      styles.notificationCard,
                      !notification.is_read && {
                        borderLeftWidth: 3,
                        borderLeftColor: theme.primary,
                      },
                    ]}
                  >
                    <View style={styles.notificationContent}>
                      <View
                        style={[
                          styles.iconContainer,
                          { backgroundColor: iconColor + "20" },
                        ]}
                      >
                        <Feather name={iconName} size={20} color={iconColor} />
                      </View>
                      <View style={styles.textContainer}>
                        <Text
                          style={[
                            styles.notificationTitle,
                            { color: theme.textPrimary },
                            !notification.is_read && { fontWeight: "700" },
                          ]}
                        >
                          {notification.title}
                        </Text>
                        <Text
                          style={[
                            styles.notificationMessage,
                            { color: theme.text },
                          ]}
                        >
                          {notification.message}
                        </Text>
                        {notification.order_id ? (
                          <View style={styles.orderLinkRow}>
                            <Feather
                              name="external-link"
                              size={12}
                              color={theme.primary}
                            />
                            <Text
                              style={[
                                styles.orderLink,
                                { color: theme.primary },
                              ]}
                            >
                              Tap to view order details
                            </Text>
                          </View>
                        ) : null}
                        <Text
                          style={[
                            styles.notificationTime,
                            { color: theme.secondary },
                          ]}
                        >
                          {formatTime(notification.created_at)}
                        </Text>
                      </View>
                      {!notification.is_read ? (
                        <View
                          style={[
                            styles.unreadDot,
                            { backgroundColor: theme.primary },
                          ]}
                        />
                      ) : null}
                    </View>
                  </Card>
                </Pressable>
              );
            })
          )}
        </View>
      </ScreenScrollView>

      <Modal
        visible={selectedNotification !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={closeOrderModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.backgroundRoot },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Order Details
              </Text>
              <Pressable onPress={closeOrderModal}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            {loadingOrder ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.text }]}>
                  Loading order...
                </Text>
              </View>
            ) : orderLoadError ? (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={48} color={theme.danger} />
                <Text style={[styles.errorTitle, { color: theme.textPrimary }]}>
                  Order Not Found
                </Text>
                <Text style={[styles.errorText, { color: theme.text }]}>
                  This order may have been deleted or is no longer available.
                </Text>
                <Pressable
                  style={[
                    styles.closeErrorButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={closeOrderModal}
                >
                  <Text style={styles.closeErrorButtonText}>Close</Text>
                </Pressable>
              </View>
            ) : orderDetails ? (
              <View style={styles.orderDetailsContainer}>
                <View style={styles.orderHeaderRow}>
                  <Text
                    style={[styles.orderNumber, { color: theme.textPrimary }]}
                  >
                    #
                    {orderDetails.orderNumber ||
                      orderDetails.id.slice(-8).toUpperCase()}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          getStatusColor(orderDetails.status, theme) + "20",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(orderDetails.status, theme) },
                      ]}
                    >
                      {orderDetails.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderInfoRow}>
                  <Text style={[styles.orderLabel, { color: theme.text }]}>
                    Customer:
                  </Text>
                  <Text
                    style={[styles.orderValue, { color: theme.textPrimary }]}
                  >
                    {orderDetails.wholesalerName ||
                      orderDetails.wholesalerCompany ||
                      "Unknown"}
                  </Text>
                </View>

                <View style={styles.orderInfoRow}>
                  <Text style={[styles.orderLabel, { color: theme.text }]}>
                    Total:
                  </Text>
                  <Text
                    style={[styles.orderValue, { color: theme.textPrimary }]}
                  >
                    ${orderDetails.totalAmount.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.orderInfoRow}>
                  <Text style={[styles.orderLabel, { color: theme.text }]}>
                    Date:
                  </Text>
                  <Text
                    style={[styles.orderValue, { color: theme.textPrimary }]}
                  >
                    {orderDetails.date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>

                {orderDetails.items && orderDetails.items.length > 0 ? (
                  <View style={styles.itemsSection}>
                    <Text style={[styles.sectionLabel, { color: theme.text }]}>
                      Items:
                    </Text>
                    {orderDetails.items.map((item, index) => (
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
                  </View>
                ) : null}

                {orderDetails.deliveryAddress ? (
                  <View style={styles.addressSection}>
                    <Text style={[styles.sectionLabel, { color: theme.text }]}>
                      Delivery Address:
                    </Text>
                    <Text
                      style={[styles.addressText, { color: theme.textPrimary }]}
                    >
                      {orderDetails.deliveryAddress}
                    </Text>
                  </View>
                ) : null}

                {orderDetails.status !== "Delivered" ? (
                  <View style={styles.statusUpdateSection}>
                    <Text style={[styles.sectionLabel, { color: theme.text }]}>
                      Update Status:
                    </Text>
                    <View style={styles.statusButtonsContainer}>
                      {ORDER_STATUSES.map((status) => {
                        const isCurrentStatus = orderDetails.status === status;
                        const statusIndex = ORDER_STATUSES.indexOf(status);
                        const currentIndex = ORDER_STATUSES.indexOf(
                          orderDetails.status,
                        );
                        const isNextStatus = statusIndex === currentIndex + 1;

                        return (
                          <Pressable
                            key={status}
                            style={[
                              styles.statusButton,
                              {
                                backgroundColor: isCurrentStatus
                                  ? getStatusColor(status, theme)
                                  : isNextStatus
                                    ? getStatusColor(status, theme) + "30"
                                    : theme.backgroundSecondary,
                                borderColor:
                                  isCurrentStatus || isNextStatus
                                    ? getStatusColor(status, theme)
                                    : theme.border,
                              },
                            ]}
                            onPress={() =>
                              !isCurrentStatus && handleUpdateStatus(status)
                            }
                            disabled={isCurrentStatus || updatingStatus}
                          >
                            {updatingStatus && isNextStatus ? (
                              <ActivityIndicator
                                size="small"
                                color={getStatusColor(status, theme)}
                              />
                            ) : (
                              <Text
                                style={[
                                  styles.statusButtonText,
                                  {
                                    color: isCurrentStatus
                                      ? "#FFFFFF"
                                      : getStatusColor(status, theme),
                                  },
                                ]}
                              >
                                {status}
                              </Text>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ) : (
                  <View style={styles.deliveredBanner}>
                    <Feather
                      name="check-circle"
                      size={24}
                      color={theme.success}
                    />
                    <Text
                      style={[styles.deliveredText, { color: theme.success }]}
                    >
                      This order has been delivered
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={48} color={theme.danger} />
                <Text style={[styles.errorText, { color: theme.danger }]}>
                  Could not load order details
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing["5xl"],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h2,
  },
  subtitle: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  markAllText: {
    ...Typography.small,
    fontWeight: "600",
  },
  emptyCard: {
    padding: Spacing["3xl"],
    alignItems: "center",
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.h4,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    textAlign: "center",
  },
  notificationCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  notificationTitle: {
    ...Typography.label,
    marginBottom: Spacing.xs,
  },
  notificationMessage: {
    ...Typography.body,
    marginBottom: Spacing.sm,
  },
  orderLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  orderLink: {
    ...Typography.small,
    fontWeight: "500",
  },
  notificationTime: {
    ...Typography.caption,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
    padding: Spacing.xl,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    ...Typography.h3,
  },
  loadingContainer: {
    padding: Spacing["3xl"],
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
  },
  orderDetailsContainer: {
    paddingBottom: Spacing.xl,
  },
  orderHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  orderNumber: {
    ...Typography.h4,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    ...Typography.label,
    fontWeight: "600",
  },
  orderInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  orderLabel: {
    ...Typography.body,
  },
  orderValue: {
    ...Typography.body,
    fontWeight: "600",
  },
  itemsSection: {
    marginTop: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.caption,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
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
  addressSection: {
    marginTop: Spacing.lg,
  },
  addressText: {
    ...Typography.body,
  },
  statusUpdateSection: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  statusButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  statusButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minWidth: 90,
    alignItems: "center",
  },
  statusButtonText: {
    ...Typography.small,
    fontWeight: "600",
  },
  deliveredBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
  },
  deliveredText: {
    ...Typography.label,
    fontWeight: "600",
  },
  errorContainer: {
    padding: Spacing["3xl"],
    alignItems: "center",
    gap: Spacing.md,
  },
  errorTitle: {
    ...Typography.h4,
    textAlign: "center",
  },
  errorText: {
    ...Typography.body,
    textAlign: "center",
  },
  closeErrorButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  closeErrorButtonText: {
    color: "#FFFFFF",
    ...Typography.label,
    fontWeight: "600",
  },
});
