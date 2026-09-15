import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Card } from "@/components/Card";
import { useCart } from "@/contexts/CartContext";
import { useOrders } from "@/contexts/OrdersContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import ScreenKeyboardAwareScrollView from "@/components/ScreenKeyboardAwareScrollView";

type CheckoutScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Checkout"
>;

export default function CheckoutScreen() {
  const navigation = useNavigation<CheckoutScreenNavigationProp>();
  const { theme } = useTheme();
  const { items, totalAmount, clearCart } = useCart();
  const { placeOrder } = useOrders();
  const { user } = useAuth();
  const [address, setAddress] = useState(user?.address || "");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlaceOrder = async () => {
    if (!address) {
      Alert.alert("Error", "Please enter delivery address");
      return;
    }
    if (!acceptedTerms) {
      Alert.alert("Error", "Please accept terms and conditions");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await placeOrder(
        items,
        totalAmount,
        address,
        specialInstructions,
        {
          name: user?.name,
          company: user?.company,
          phone: user?.phone,
        },
      );

      if (result.success) {
        clearCart();

        Alert.alert(
          "Order Placed",
          `Your order ${result.order?.orderNumber || ""} has been placed successfully!`,
          [
            {
              text: "OK",
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: "WholesalerApp" }],
                });
              },
            },
          ],
        );
      } else {
        Alert.alert(
          "Error",
          result.error || "Failed to place order. Please try again.",
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={styles.container}>
        <Card style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Delivery Address</ThemedText>
          <Input
            value={address}
            onChangeText={setAddress}
            placeholder="Enter delivery address"
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
        </Card>

        <Card style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Order Summary</ThemedText>
          {items.map((item, index) => (
            <View
              key={item.product.id}
              style={[
                styles.itemRow,
                index < items.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                },
              ]}
            >
              <ThemedText style={styles.itemName} numberOfLines={1}>
                {item.product.name}
              </ThemedText>
              <ThemedText style={styles.itemQuantity}>
                x{item.quantity}
              </ThemedText>
              <ThemedText style={[styles.itemPrice, { color: theme.primary }]}>
                DA {(item.product.price * item.quantity).toFixed(2)}
              </ThemedText>
            </View>
          ))}
          <View style={styles.totalRow}>
            <ThemedText style={styles.totalLabel}>Total</ThemedText>
            <ThemedText style={styles.totalValue}>
              ${totalAmount.toFixed(2)}
            </ThemedText>
          </View>
        </Card>

        {/* <Card style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            Special Instructions
          </ThemedText>
          <Input
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            placeholder="Any special requests? (Optional)"
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
        </Card> */}

        {/* <Card style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Payment Method</ThemedText>
          <View style={styles.paymentRow}>
            <Feather name="dollar-sign" size={20} color={theme.text} />
            <ThemedText style={styles.paymentText}>Cash on Delivery</ThemedText>
          </View>
        </Card> */}

        {/* <Card style={styles.section}>
          <Pressable
            style={styles.termsRow}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: theme.border,
                  backgroundColor: acceptedTerms
                    ? theme.primary
                    : "transparent",
                },
              ]}
            >
              {acceptedTerms ? (
                <Feather name="check" size={14} color="#FFFFFF" />
              ) : null}
            </View>
            <ThemedText style={styles.termsText}>
              I agree to the terms and conditions and confirm this order
            </ThemedText>
          </Pressable>
        </Card> */}

        <Button
          title={isSubmitting ? "Placing Order..." : "Place Order"}
          onPress={handlePlaceOrder}
          disabled={isSubmitting}
        />
      </View>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: Spacing.md,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: "500",
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
    minWidth: 70,
    textAlign: "right",
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
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
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
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.xs,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  termsText: {
    flex: 1,
    fontSize: 14,
  },
});
