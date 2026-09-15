import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "./ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { OrderStatus } from "@/contexts/OrdersContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface StatusBadgeProps {
  status: OrderStatus;
  size?: "small" | "medium";
}

export function StatusBadge({ status, size = "small" }: StatusBadgeProps) {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();

  const getStatusColor = () => {
    switch (status) {
      case "Delivered":
        return theme.success;
      case "Confirmed":
        return theme.primary;
      case "Pending":
      default:
        return theme.secondary;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "Delivered":
        return t("delivered");
      case "Confirmed":
        return t("confirmed");
      case "Pending":
      default:
        return t("pending");
    }
  };

  return (
    <View
      style={[
        styles.badge,
        size === "medium" && styles.badgeMedium,
        { backgroundColor: getStatusColor() },
      ]}
    >
      <ThemedText
        style={[
          styles.text,
          size === "medium" && styles.textMedium,
          isRTL && styles.textRTL,
        ]}
      >
        {getStatusText()}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 80,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeMedium: {
    minWidth: 90,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  textMedium: {
    fontSize: 14,
  },
  textRTL: {
    textAlign: "center",
  },
});
