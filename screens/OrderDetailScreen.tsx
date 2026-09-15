import React from "react";
import { View, StyleSheet, Image, ViewStyle } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { useOrders, OrderStatus } from "@/contexts/OrdersContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import ScreenScrollView from "@/components/ScreenScrollView";
import { useLanguage } from "@/contexts/LanguageContext";

type OrderDetailScreenRouteProp = RouteProp<RootStackParamList, "OrderDetail">;

export default function OrderDetailScreen() {
  const route = useRoute<OrderDetailScreenRouteProp>();
  const { theme } = useTheme();
  const { orders } = useOrders();
  const { t, isRTL } = useLanguage();

  const order = orders.find((o) => o.id === route.params.orderId);

  const getStatusTranslation = (status: OrderStatus) => {
    switch (status) {
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

  if (!order) {
    return (
      <ScreenScrollView>
        <ThemedText>{t("orderNotFound")}</ThemedText>
      </ScreenScrollView>
    );
  }

  const statusSteps: OrderStatus[] = ["Pending", "Confirmed", "Delivered"];
  const currentStepIndex = statusSteps.indexOf(order.status);

  return (
    <ScreenScrollView>
      <View style={[styles.container, isRTL ? styles.containerRTL : undefined]}>
        <Card style={styles.section}>
          <ThemedText style={[styles.sectionTitle, isRTL && styles.textRTL]}>
            {t("orderStatus")}
          </ThemedText>
          <View style={styles.statusTimeline}>
            {statusSteps.map((step, index) => (
              <View
                key={step}
                style={[styles.timelineItem, isRTL && styles.timelineItemRTL]}
              >
                <View
                  style={[
                    styles.timelineCircle,
                    isRTL && styles.timelineCircleRTL,
                    {
                      backgroundColor:
                        index <= currentStepIndex
                          ? theme.primary
                          : theme.border,
                    },
                  ]}
                >
                  {index <= currentStepIndex ? (
                    <Feather name="check" size={12} color="#FFFFFF" />
                  ) : null}
                </View>
                <ThemedText
                  style={[
                    styles.timelineLabel,
                    {
                      color:
                        index <= currentStepIndex
                          ? theme.textPrimary
                          : theme.text,
                      fontWeight: index === currentStepIndex ? "600" : "400",
                    },
                  ]}
                >
                  {getStatusTranslation(step)}
                </ThemedText>
                {index < statusSteps.length - 1 ? (
                  <View
                    style={[
                      styles.timelineLine,
                      isRTL && styles.timelineLineRTL,
                      {
                        backgroundColor:
                          index < currentStepIndex
                            ? theme.primary
                            : theme.border,
                      },
                    ]}
                  />
                ) : null}
              </View>
            ))}
          </View>
        </Card>

        <Card style={styles.section}>
          <ThemedText style={[styles.sectionTitle, isRTL && styles.textRTL]}>
            {t("orderInfo")}
          </ThemedText>
          <View style={[styles.infoRow, isRTL && styles.infoRowRTL]}>
            <ThemedText style={styles.infoLabel}>{t("orderNumber")}</ThemedText>
            <ThemedText style={styles.infoValue}>
              {order.orderNumber}
            </ThemedText>
          </View>
          <View style={[styles.infoRow, isRTL && styles.infoRowRTL]}>
            <ThemedText style={styles.infoLabel}>{t("date")}</ThemedText>
            <ThemedText style={styles.infoValue}>
              {order.date.toLocaleDateString()}
            </ThemedText>
          </View>
          <View style={[styles.infoRow, isRTL && styles.infoRowRTL]}>
            <ThemedText style={styles.infoLabel}>{t("orderStatus")}</ThemedText>
            <StatusBadge status={order.status} />
          </View>
        </Card>

        <Card style={styles.section}>
          <ThemedText style={[styles.sectionTitle, isRTL && styles.textRTL]}>
            {t("items")}
          </ThemedText>
          {order.items.map((item, index) => (
            <View
              key={index}
              style={[
                styles.itemRow,
                isRTL && styles.itemRowRTL,
                index < order.items.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                },
              ]}
            >
              <Image
                source={item.product.image}
                style={[styles.itemImage, isRTL && styles.itemImageRTL]}
              />
              <View style={styles.itemInfo}>
                <ThemedText
                  style={[styles.itemName, isRTL && styles.textRTL]}
                  numberOfLines={2}
                >
                  {item.product.name}
                </ThemedText>
                <ThemedText
                  style={[styles.itemQuantity, isRTL && styles.textRTL]}
                >
                  {t("qty")}: {item.quantity}
                </ThemedText>
              </View>
              <ThemedText style={[styles.itemPrice, { color: theme.primary }]}>
                DA {(item.product.price * item.quantity).toFixed(2)}
              </ThemedText>
            </View>
          ))}
          <View style={[styles.totalRow, isRTL && styles.totalRowRTL]}>
            <ThemedText style={styles.totalLabel}>{t("total")}</ThemedText>
            <ThemedText style={styles.totalValue}>
              DA {order.totalAmount.toFixed(2)}
            </ThemedText>
          </View>
        </Card>

        {/* <Card style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Delivery Address</ThemedText>
          <ThemedText style={styles.address}>
            {order.deliveryAddress}
          </ThemedText>
        </Card> */}

        {order.specialInstructions ? (
          <Card style={styles.section}>
            <ThemedText style={[styles.sectionTitle, isRTL && styles.textRTL]}>
              {t("specialInstructions")}
            </ThemedText>
            <ThemedText style={[styles.instructions, isRTL && styles.textRTL]}>
              {order.specialInstructions}
            </ThemedText>
          </Card>
        ) : null}

        {/* <Card style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Payment Method</ThemedText>
          <View style={styles.paymentRow}>
            <Feather name="dollar-sign" size={20} color={theme.text} />
            <ThemedText style={styles.paymentText}>Cash on Delivery</ThemedText>
          </View>
        </Card> */}
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  containerRTL: {
    writingDirection: "rtl",
  } as ViewStyle,
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  textRTL: {
    textAlign: "right",
  },
  statusTimeline: {
    gap: Spacing.sm,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  timelineItemRTL: {
    flexDirection: "row-reverse",
  },
  timelineCircle: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  timelineCircleRTL: {
    marginRight: 0,
    marginLeft: Spacing.md,
  },
  timelineLabel: {
    fontSize: 14,
  },
  timelineLine: {
    position: "absolute",
    left: 11,
    top: 24,
    width: 2,
    height: 24,
  },
  timelineLineRTL: {
    left: undefined,
    right: 11,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  infoRowRTL: {
    flexDirection: "row-reverse",
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  itemRowRTL: {
    flexDirection: "row-reverse",
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.xs,
    marginRight: Spacing.md,
  },
  itemImageRTL: {
    marginRight: 0,
    marginLeft: Spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  itemQuantity: {
    fontSize: 12,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
    borderTopWidth: 2,
    borderTopColor: "#000",
  },
  totalRowRTL: {
    flexDirection: "row-reverse",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  address: {
    fontSize: 14,
    lineHeight: 20,
  },
  instructions: {
    fontSize: 14,
    lineHeight: 20,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  paymentText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
