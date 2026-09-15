import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useCart, Product as CartProduct } from "@/contexts/CartContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { productsApi, Product } from "@/services/api";
import { MOCK_PRODUCTS } from "@/data/products";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ProductDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ProductDetail"
>;
type ProductDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  "ProductDetail"
>;

export default function ProductDetailScreen() {
  const navigation = useNavigation<ProductDetailScreenNavigationProp>();
  const route = useRoute<ProductDetailScreenRouteProp>();
  const { theme } = useTheme();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const insets = useSafeAreaInsets();

  const [product, setProduct] = useState<Product | CartProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await productsApi.getProduct(route.params.productId);
        setProduct(data);
      } catch (error) {
        const mockProduct = MOCK_PRODUCTS.find(
          (p) => p.id === route.params.productId,
        );
        if (mockProduct) {
          setProduct(mockProduct);
        }
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [route.params.productId]);

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  if (!product) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <Feather name="alert-circle" size={48} color={theme.text} />
        <ThemedText style={styles.errorText}>Product not found</ThemedText>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </ThemedView>
    );
  }

  const handleAddToCart = () => {
    const cartProduct: CartProduct = {
      id: product.id,
      name: product.name,
      category: "category" in product ? product.category : "",
      price: product.price,
      description: "description" in product ? product.description || "" : "",
      image: product.image,
      specifications:
        "specifications" in product
          ? Array.isArray(product.specifications)
            ? product.specifications
            : Object.entries(product.specifications || {}).map(
                ([k, v]) => `${k}: ${v}`,
              )
          : [],
    };
    addToCart(cartProduct, quantity);
    Alert.alert("Success", `Added ${quantity} item(s) to cart`, [
      { text: "OK", onPress: () => navigation.goBack() },
    ]);
  };

  const handleQuantityChange = (text: string) => {
    const num = parseInt(text, 10);
    if (!isNaN(num) && num > 0) {
      setQuantity(num);
    } else if (text === "") {
      setQuantity(1);
    }
  };

  const specifications =
    "specifications" in product
      ? Array.isArray(product.specifications)
        ? product.specifications
        : Object.entries(product.specifications || {}).map(
            ([k, v]) => `${k}: ${v}`,
          )
      : [];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl + 80 },
        ]}
      >
        <View
          style={[
            styles.imageContainer,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          {product.image ? (
            <Image
              source={
                typeof product.image === "string"
                  ? { uri: product.image }
                  : product.image
              }
              style={styles.productImage}
              contentFit="contain"
            />
          ) : (
            <Feather name="image" size={64} color={theme.text} />
          )}
        </View>

        <View style={styles.infoSection}>
          <ThemedText style={styles.productName}>{product.name}</ThemedText>
          {"category" in product ? (
            <View
              style={[
                styles.categoryTag,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <ThemedText style={styles.categoryTagText}>
                {product.category}
              </ThemedText>
            </View>
          ) : null}
          <ThemedText style={[styles.price, { color: theme.primary }]}>
            DA {product.price.toFixed(2)}
          </ThemedText>
        </View>

        {"description" in product && product.description ? (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Description</ThemedText>
            <ThemedText style={styles.description}>
              {product.description}
            </ThemedText>
          </View>
        ) : null}

        {specifications.length > 0 ? (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Specifications</ThemedText>
            {specifications.map((spec, index) => (
              <View key={index} style={styles.specItem}>
                <Feather name="check" size={16} color={theme.success} />
                <ThemedText style={styles.specText}>{spec}</ThemedText>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.backgroundRoot,
            borderTopColor: theme.border,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
      >
        <View style={styles.quantityContainer}>
          <ThemedText style={styles.quantityLabel}>Quantity</ThemedText>
          <View style={styles.quantityControls}>
            <Pressable
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              style={[styles.quantityButton, { borderColor: theme.border }]}
            >
              <Feather name="minus" size={20} color={theme.text} />
            </Pressable>
            <TextInput
              style={[
                styles.quantityInput,
                { color: theme.textPrimary, borderColor: theme.border },
              ]}
              value={quantity.toString()}
              onChangeText={handleQuantityChange}
              keyboardType="number-pad"
              selectTextOnFocus
            />
            <Pressable
              onPress={() => setQuantity(quantity + 1)}
              style={[styles.quantityButton, { borderColor: theme.border }]}
            >
              <Feather name="plus" size={20} color={theme.text} />
            </Pressable>
          </View>
        </View>

        <Button
          title={`Add to Cart - DA ${(product.price * quantity).toFixed(2)}`}
          onPress={handleAddToCart}
          style={styles.addButton}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.lg,
  },
  errorText: {
    fontSize: 16,
    marginTop: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  infoSection: {
    marginBottom: Spacing.lg,
  },
  productName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  categoryTag: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  price: {
    fontSize: 28,
    fontWeight: "700",
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  specItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  specText: {
    fontSize: 14,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    padding: Spacing.lg,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityInput: {
    width: 60,
    height: 40,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  addButton: {
    width: "100%",
  },
});
