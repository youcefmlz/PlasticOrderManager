import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  ScrollView,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { useOrders, OrderStatus } from "@/contexts/OrdersContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useLanguage } from "@/contexts/LanguageContext";

type OrdersScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const STATUS_FILTERS: (OrderStatus | "All")[] = [
  "All",
  "Pending",
  "Confirmed",
  "Delivered",
];

export default function OrdersScreen() {
  const navigation = useNavigation<OrdersScreenNavigationProp>();
  const { theme } = useTheme();
  const { orders } = useOrders();
  const { t, isRTL } = useLanguage();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "All">(
    "All",
  );
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const filteredOrders =
    selectedStatus === "All"
      ? orders
      : orders.filter((order) => order.status === selectedStatus);

  const getStatusTranslation = (status: OrderStatus | "All") => {
    switch (status) {
      case "All":
        return t("all");
      case "Pending":
        return t("pending");
      case "Confirmed":
        return t("confirmed");
      case "Delivered":
        return t("delivered");
      default:
        return status;
    }
  };

  if (orders.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.xl }]}>
          <ThemedText style={styles.title}>{t("myOrders")}</ThemedText>
        </View>
        <View style={styles.emptyContainer}>
          <Feather name="list" size={64} color={theme.text} />
          <ThemedText style={styles.emptyText}>{t("noOrders")}</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            {t("noOrdersDesc")}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.xl }]}>
        <ThemedText style={styles.title}>{t("myOrders")}</ThemedText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {STATUS_FILTERS.map((status) => (
          <Pressable
            key={status}
            onPress={() => setSelectedStatus(status)}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedStatus === status
                    ? theme.primary
                    : theme.backgroundDefault,
                borderColor: theme.border,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.filterText,
                { color: selectedStatus === status ? "#FFFFFF" : theme.text },
              ]}
            >
              {getStatusTranslation(status)}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate("OrderDetail", { orderId: item.id })
            }
          >
            <Card style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <ThemedText style={styles.orderNumber}>
                    {item.orderNumber}
                  </ThemedText>
                  <ThemedText style={styles.orderDate}>
                    {item.date.toLocaleDateString()}
                  </ThemedText>
                </View>
                <StatusBadge status={item.status} />
              </View>
              <View style={styles.orderDetails}>
                <View style={styles.orderInfo}>
                  <Feather name="package" size={16} color={theme.text} />
                  <ThemedText style={styles.orderInfoText}>
                    {item.items.length} {t("items")}
                  </ThemedText>
                </View>
                <ThemedText
                  style={[styles.orderTotal, { color: theme.primary }]}
                >
                  DA {item.totalAmount.toFixed(2)}
                </ThemedText>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  filtersContainer: {
    marginHorizontal: -Spacing.lg,
    marginBottom: Spacing.md,
  },
  filtersContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  orderCard: {
    padding: Spacing.lg,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  orderDate: {
    fontSize: 12,
  },
  orderDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  orderInfoText: {
    fontSize: 14,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
});
