import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import ScreenScrollView from "@/components/ScreenScrollView";
import { Card } from "@/components/Card";
import { ordersApi, adminApi } from "@/services/api";
import { Order } from "@/contexts/OrdersContext";

type StatCardProps = {
  title: string;
  value: string | number;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  theme: any;
};

function StatCard({ title, value, icon, color, theme }: StatCardProps) {
  return (
    <Card style={styles.statCard}>
      <View
        style={[styles.statIconContainer, { backgroundColor: color + "20" }]}
      >
        <Feather name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.textPrimary }]}>
        {value}
      </Text>
      <Text style={[styles.statTitle, { color: theme.text }]}>{title}</Text>
    </Card>
  );
}

function getStatusColor(status: string, theme: any): string {
  switch (status.toLowerCase()) {
    case "pending":
      return theme.warning;
    case "processing":
      return theme.primary;
    case "shipped":
      return theme.accent;
    case "delivered":
      return theme.success;
    case "cancelled":
      return theme.danger;
    default:
      return theme.text;
  }
}

export default function AdminDashboardScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [fetchedOrders, count] = await Promise.all([
        // Pass all=true to get all customer orders
        ordersApi.getOrders(undefined, true),
        adminApi.getUnreadCount(),
      ]);
      setOrders(fetchedOrders);
      setUnreadCount(count);
    } catch (error) {
      console.log("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const pendingOrders = orders.filter((o) => o.status === "Pending").length;
  const confirmedOrders = orders.filter((o) => o.status === "Confirmed").length;
  const recentOrders = orders.slice(0, 5);

  return (
    <ScreenScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: theme.text }]}>
            Welcome back,
          </Text>
          <Text style={[styles.userName, { color: theme.textPrimary }]}>
            {user?.name || "Admin"}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            title="Pending Orders"
            value={pendingOrders}
            icon="clock"
            color={theme.warning}
            theme={theme}
          />
          <StatCard
            title="Confirmed"
            value={confirmedOrders}
            icon="check-circle"
            color={theme.primary}
            theme={theme}
          />
          <StatCard
            title="Total Orders"
            value={orders.length}
            icon="clipboard"
            color={theme.success}
            theme={theme}
          />
          <StatCard
            title="New Alerts"
            value={unreadCount}
            icon="bell"
            color={theme.danger}
            theme={theme}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Recent Orders
          </Text>

          {recentOrders.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Feather name="inbox" size={40} color={theme.text} />
              <Text style={[styles.emptyText, { color: theme.text }]}>
                No orders yet
              </Text>
            </Card>
          ) : (
            recentOrders.map((order) => (
              <Card key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={[styles.orderId, { color: theme.textPrimary }]}>
                    #{order.id.slice(-8).toUpperCase()}
                  </Text>
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
                </View>
                <View style={styles.orderDetails}>
                  <Text style={[styles.orderCustomer, { color: theme.text }]}>
                    {order.wholesalerName ||
                      order.wholesalerCompany ||
                      "Customer"}
                  </Text>
                  <Text
                    style={[styles.orderAmount, { color: theme.textPrimary }]}
                  >
                    ${order.totalAmount.toFixed(2)}
                  </Text>
                </View>
                <Text style={[styles.orderDate, { color: theme.secondary }]}>
                  {order.date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </Card>
            ))
          )}
        </View>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing["5xl"],
  },
  header: {
    marginBottom: Spacing.xl,
  },
  greeting: {
    ...Typography.body,
  },
  userName: {
    ...Typography.h2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    padding: Spacing.lg,
    alignItems: "flex-start",
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  statValue: {
    ...Typography.h2,
    marginBottom: Spacing.xs,
  },
  statTitle: {
    ...Typography.small,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md,
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
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  orderId: {
    ...Typography.label,
    fontWeight: "700",
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
  orderDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  orderCustomer: {
    ...Typography.body,
  },
  orderAmount: {
    ...Typography.label,
    fontWeight: "700",
  },
  orderDate: {
    ...Typography.caption,
  },
});
