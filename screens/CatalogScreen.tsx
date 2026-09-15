import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useCart, Product as CartProduct } from "@/contexts/CartContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { productsApi, Product } from "@/services/api";
import { MOCK_PRODUCTS } from "@/data/products";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

type CatalogScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

export default function CatalogScreen() {
  const navigation = useNavigation<CatalogScreenNavigationProp>();
  const { theme } = useTheme();
  const { addToCart } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      const data = await productsApi.getProducts();
      setProducts(data);
      setUsingMockData(false);
    } catch (error) {
      console.log("Using mock products - backend not available");
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const displayProducts = usingMockData
    ? MOCK_PRODUCTS.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          p.isActive !== false,
      );

  const handleAddToCart = (product: Product | CartProduct) => {
    const cartProduct: CartProduct = {
      id: product.id,
      name: product.name,
      category: "category" in product ? product.category : "",
      price: product.price,
      description: "description" in product ? product.description || "" : "",
      image: "image" in product ? product.image : undefined,
      specifications: [],
    };
    addToCart(cartProduct, 1);
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={styles.loadingText}>Loading products...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.xl }]}>
        <View style={styles.headerContent}>
          <Image
            source={require("@/assets2/images/1.png")}
            style={styles.logo}
          />
          {/* <ThemedText style={styles.headerTitle}>B2B Orders</ThemedText> */}
        </View>

        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.border,
            },
          ]}
        >
          <Feather name="search" size={20} color={theme.text} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search products..."
            placeholderTextColor={theme.text}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color={theme.text} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.productsGrid,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {displayProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="package" size={48} color={theme.text} />
            <ThemedText style={styles.emptyText}>
              {searchQuery ? "No products found" : "No products available"}
            </ThemedText>
          </View>
        ) : (
          displayProducts.map((product) => (
            <Card key={product.id} style={styles.productCard}>
              <Pressable
                onPress={() =>
                  navigation.navigate("ProductDetail", {
                    productId: product.id,
                  })
                }
                style={styles.productContent}
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
                      contentFit="cover"
                    />
                  ) : (
                    <Feather name="image" size={32} color={theme.text} />
                  )}
                </View>

                <View style={styles.productInfo}>
                  <ThemedText style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </ThemedText>
                  <ThemedText
                    style={[styles.productPrice, { color: theme.primary }]}
                  >
                    DA {product.price.toFixed(2)}
                  </ThemedText>
                </View>

                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    handleAddToCart(product);
                  }}
                  style={[styles.addButton, { backgroundColor: theme.primary }]}
                >
                  <Feather name="plus" size={18} color="#FFFFFF" />
                </Pressable>
              </Pressable>
            </Card>
          ))
        )}
      </ScrollView>
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
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerContent: {
    // flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  logo: {
    width: 64,
    height: 64,
    // marginRight: Spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  productsGrid: {
    padding: Spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.lg,
  },
  emptyContainer: {
    width: "100%",
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
  productCard: {
    width: `${(100 - 6) / 2}%`,
    padding: 0,
    overflow: "hidden",
  },
  productContent: {
    flex: 1,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  productInfo: {
    padding: Spacing.md,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.xs,
    minHeight: 40,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "700",
  },
  addButton: {
    position: "absolute",
    bottom: Spacing.md,
    right: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
});
