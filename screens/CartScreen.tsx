import React from "react";
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  Image,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useCart } from "@/contexts/CartContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useLanguage } from "@/contexts/LanguageContext";

type CartScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CartScreen() {
  const navigation = useNavigation<CartScreenNavigationProp>();
  const { theme } = useTheme();
  const { items, removeFromCart, updateQuantity, clearCart, totalAmount } =
    useCart();
  const { t, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const handleClearCart = () => {
    if (Platform.OS === "web") {
      if (window.confirm(t("clearCartConfirm"))) {
        clearCart();
      }
    } else {
      Alert.alert(t("clearCart"), t("clearCartConfirm"), [
        { text: t("cancel"), style: "cancel" },
        { text: t("clear"), style: "destructive", onPress: clearCart },
      ]);
    }
  };

  if (items.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.xl }]}>
          <ThemedText style={styles.title}>{t("myCart")}</ThemedText>
        </View>
        <View style={styles.emptyContainer}>
          <Feather name="shopping-bag" size={64} color={theme.text} />
          <ThemedText style={styles.emptyText}>{t("emptyCart")}</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            {t("emptyCartDesc")}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + Spacing.xl },
          isRTL && styles.headerRTL,
        ]}
      >
        <ThemedText style={styles.title}>{t("myCart")}</ThemedText>
        <Pressable onPress={handleClearCart}>
          <ThemedText style={[styles.clearButton, { color: theme.danger }]}>
            {t("clearAll")}
          </ThemedText>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.product.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.xl + 80 },
        ]}
        renderItem={({ item }) => (
          <Card style={styles.cartItem}>
            <Image source={item.product.image} style={styles.itemImage} />
            <View style={styles.itemInfo}>
              <ThemedText style={styles.itemName} numberOfLines={2}>
                {item.product.name}
              </ThemedText>
              <ThemedText style={[styles.itemPrice, { color: theme.primary }]}>
                DA {item.product.price.toFixed(2)}
              </ThemedText>
            </View>
            <View style={styles.quantityContainer}>
              <Pressable
                onPress={() =>
                  updateQuantity(item.product.id, item.quantity - 1)
                }
                style={[styles.quantityButton, { borderColor: theme.border }]}
              >
                <Feather name="minus" size={16} color={theme.text} />
              </Pressable>
              <TextInput
                style={[
                  styles.quantityInput,
                  {
                    color: theme.textPrimary,
                    borderColor: theme.border,
                    backgroundColor: theme.backgroundDefault,
                  },
                ]}
                value={String(item.quantity)}
                onChangeText={(text) => {
                  const num = parseInt(text, 10);
                  if (!isNaN(num) && num >= 1) {
                    updateQuantity(item.product.id, num);
                  } else if (text === "" || num === 0) {
                    updateQuantity(item.product.id, 1);
                  }
                }}
                keyboardType="number-pad"
                selectTextOnFocus
                maxLength={4}
              />
              <Pressable
                onPress={() =>
                  updateQuantity(item.product.id, item.quantity + 1)
                }
                style={[styles.quantityButton, { borderColor: theme.border }]}
              >
                <Feather name="plus" size={16} color={theme.text} />
              </Pressable>
            </View>
            <Pressable
              onPress={() => removeFromCart(item.product.id)}
              style={styles.removeButton}
            >
              <Feather name="trash-2" size={20} color={theme.danger} />
            </Pressable>
          </Card>
        )}
      />

      <View
        style={[
          styles.summaryBar,
          {
            backgroundColor: theme.backgroundRoot,
            borderTopColor: theme.border,
            bottom: tabBarHeight,
          },
        ]}
      >
        <View
          style={[styles.summaryContent, isRTL && styles.summaryContentRTL]}
        >
          <ThemedText style={styles.summaryLabel}>{t("total")}</ThemedText>
          <ThemedText style={styles.summaryAmount}>
            DA {totalAmount.toFixed(2)}
          </ThemedText>
        </View>
        <Button
          title={t("placeOrder")}
          onPress={() => navigation.navigate("Checkout")}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerRTL: {
    flexDirection: "row-reverse",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  clearButton: {
    fontSize: 14,
    fontWeight: "600",
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.xs,
    marginRight: Spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityInput: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: Spacing.xs,
    minWidth: 50,
    textAlign: "center",
    height: 32,
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.xs,
  },
  removeButton: {
    padding: Spacing.xs,
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
  summaryBar: {
    position: "absolute",
    left: 0,
    right: 0,
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  summaryContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  summaryContentRTL: {
    flexDirection: "row-reverse",
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: "700",
  },
});
