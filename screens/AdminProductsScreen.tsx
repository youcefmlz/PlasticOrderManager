import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  RefreshControl,
  Alert,
  Platform,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import ScreenScrollView from "@/components/ScreenScrollView";
import { Card } from "@/components/Card";
import { productsApi, Product } from "@/services/api";

type ProductFormData = {
  name: string;
  category: string;
  price: string;
  description: string;
  imageUri: string | null;
};

const emptyFormData: ProductFormData = {
  name: "",
  category: "",
  price: "",
  description: "",
  imageUri: null,
};

export default function AdminProductsScreen() {
  const { theme } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyFormData);
  const [searchQuery, setSearchQuery] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setApiError(null);
      const data = await productsApi.getProducts(undefined, true);
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products:", error);
      setApiError(
        "Unable to load products from server. Please check your connection.",
      );
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

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData(emptyFormData);
    setModalVisible(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      description: product.description || "",
      imageUri: product.image || null,
    });
    setModalVisible(true);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      if (Platform.OS === "web") {
        window.alert("Permission to access gallery is required");
      } else {
        Alert.alert(
          "Permission Required",
          "Permission to access gallery is required",
        );
      }
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        const mimeType = asset.mimeType || "image/jpeg";
        const base64Image = `data:${mimeType};base64,${asset.base64}`;
        setFormData((prev) => ({ ...prev, imageUri: base64Image }));
      } else if (asset.uri) {
        setFormData((prev) => ({ ...prev, imageUri: asset.uri }));
      }
    }
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    const doDelete = async () => {
      try {
        await productsApi.deleteProduct(productId);
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        if (Platform.OS === "web") {
          window.alert("Product deleted successfully");
        } else {
          Alert.alert("Success", "Product deleted successfully");
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to delete product";
        if (Platform.OS === "web") {
          window.alert(message);
        } else {
          Alert.alert("Error", message);
        }
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Are you sure you want to delete "${productName}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        "Delete Product",
        `Are you sure you want to delete "${productName}"?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: doDelete },
        ],
      );
    }
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.category || !formData.price) {
      if (Platform.OS === "web") {
        window.alert("Please fill in all required fields");
      } else {
        Alert.alert("Error", "Please fill in all required fields");
      }
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      if (Platform.OS === "web") {
        window.alert("Please enter a valid price");
      } else {
        Alert.alert("Error", "Please enter a valid price");
      }
      return;
    }

    setSaving(true);
    try {
      const productData = {
        name: formData.name,
        category: formData.category,
        price: price,
        description: formData.description || undefined,
        image: formData.imageUri || undefined,
      };

      let savedProduct: Product;
      if (editingProduct) {
        savedProduct = await productsApi.updateProduct(editingProduct.id, {
          ...productData,
          isActive: editingProduct.isActive,
        });
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? savedProduct : p)),
        );
      } else {
        savedProduct = await productsApi.createProduct(productData);
        setProducts((prev) => [savedProduct, ...prev]);
      }

      setModalVisible(false);
      setFormData(emptyFormData);
      setEditingProduct(null);

      const successMessage = editingProduct
        ? "Product updated successfully"
        : "Product added successfully";
      if (Platform.OS === "web") {
        window.alert(successMessage);
      } else {
        Alert.alert("Success", successMessage);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save product";
      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert("Error", message);
      }
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const categories = [...new Set(products.map((p) => p.category))];

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.backgroundRoot },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Loading products...
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScreenScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              Product Management
            </Text>
            <Pressable
              style={[styles.addButton, { backgroundColor: theme.primary }]}
              onPress={handleAddProduct}
            >
              <Feather name="plus" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Product</Text>
            </Pressable>
          </View>

          {apiError ? (
            <Card style={styles.errorCard}>
              <Feather name="alert-circle" size={24} color={theme.danger} />
              <Text style={[styles.errorText, { color: theme.danger }]}>
                {apiError}
              </Text>
              <Pressable
                style={[styles.retryButton, { backgroundColor: theme.primary }]}
                onPress={loadProducts}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            </Card>
          ) : null}

          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor: theme.backgroundSecondary,
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

          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                {products.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text }]}>
                Products
              </Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                {categories.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text }]}>
                Categories
              </Text>
            </Card>
          </View>

          {filteredProducts.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Feather name="package" size={48} color={theme.text} />
              <Text style={[styles.emptyText, { color: theme.text }]}>
                {searchQuery
                  ? "No products found"
                  : "No products yet. Add your first product!"}
              </Text>
            </Card>
          ) : (
            filteredProducts.map((product) => (
              <Card key={product.id} style={styles.productCard}>
                {product.image ? (
                  <Image
                    source={{ uri: product.image }}
                    style={styles.productImage}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.productImagePlaceholder,
                      { backgroundColor: theme.backgroundSecondary },
                    ]}
                  >
                    <Feather name="image" size={24} color={theme.text} />
                  </View>
                )}
                <View style={styles.productInfo}>
                  <Text
                    style={[styles.productName, { color: theme.textPrimary }]}
                  >
                    {product.name}
                  </Text>
                  <Text style={[styles.productCategory, { color: theme.text }]}>
                    {product.category}
                  </Text>
                  <View style={styles.productMeta}>
                    <Text
                      style={[styles.productPrice, { color: theme.primary }]}
                    >
                      DA {product.price.toFixed(2)}
                    </Text>
                    {!product.isActive ? (
                      <View
                        style={[
                          styles.inactiveBadge,
                          { backgroundColor: theme.danger + "20" },
                        ]}
                      >
                        <Text
                          style={[styles.inactiveText, { color: theme.danger }]}
                        >
                          Inactive
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <View style={styles.productActions}>
                  <Pressable
                    style={[
                      styles.iconButton,
                      { backgroundColor: theme.backgroundSecondary },
                    ]}
                    onPress={() => handleEditProduct(product)}
                  >
                    <Feather name="edit-2" size={18} color={theme.primary} />
                  </Pressable>
                  <Pressable
                    style={[
                      styles.iconButton,
                      { backgroundColor: theme.danger + "15" },
                    ]}
                    onPress={() =>
                      handleDeleteProduct(product.id, product.name)
                    }
                  >
                    <Feather name="trash-2" size={18} color={theme.danger} />
                  </Pressable>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScreenScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
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
                {editingProduct ? "Edit Product" : "Add New Product"}
              </Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>
                  Product Image
                </Text>
                <Pressable
                  style={[
                    styles.imagePicker,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={pickImage}
                  disabled={saving}
                >
                  {formData.imageUri ? (
                    <Image
                      source={{ uri: formData.imageUri }}
                      style={styles.imagePreview}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Feather name="image" size={32} color={theme.text} />
                      <Text
                        style={[
                          styles.imagePlaceholderText,
                          { color: theme.text },
                        ]}
                      >
                        Tap to add image
                      </Text>
                    </View>
                  )}
                </Pressable>
                {formData.imageUri ? (
                  <Pressable
                    style={styles.removeImageButton}
                    onPress={() =>
                      setFormData((prev) => ({ ...prev, imageUri: null }))
                    }
                    disabled={saving}
                  >
                    <Text
                      style={[styles.removeImageText, { color: theme.danger }]}
                    >
                      Remove Image
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>
                  Product Name *
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      borderColor: theme.border,
                      color: theme.textPrimary,
                    },
                  ]}
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, name: text }))
                  }
                  placeholder="Enter product name"
                  placeholderTextColor={theme.text}
                  editable={!saving}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>
                    Category *
                  </Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      {
                        backgroundColor: theme.backgroundSecondary,
                        borderColor: theme.border,
                        color: theme.textPrimary,
                      },
                    ]}
                    value={formData.category}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, category: text }))
                    }
                    placeholder="e.g., Containers"
                    placeholderTextColor={theme.text}
                    editable={!saving}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>
                    Price *
                  </Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      {
                        backgroundColor: theme.backgroundSecondary,
                        borderColor: theme.border,
                        color: theme.textPrimary,
                      },
                    ]}
                    value={formData.price}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, price: text }))
                    }
                    placeholder="0.00"
                    placeholderTextColor={theme.text}
                    keyboardType="decimal-pad"
                    editable={!saving}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>
                  Description
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    styles.textArea,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      borderColor: theme.border,
                      color: theme.textPrimary,
                    },
                  ]}
                  value={formData.description}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, description: text }))
                  }
                  placeholder="Product description..."
                  placeholderTextColor={theme.text}
                  multiline
                  numberOfLines={3}
                  editable={!saving}
                />
              </View>

              <View style={styles.modalActions}>
                <Pressable
                  style={[
                    styles.cancelModalButton,
                    { borderColor: theme.border },
                  ]}
                  onPress={() => setModalVisible(false)}
                  disabled={saving}
                >
                  <Text style={[styles.cancelModalText, { color: theme.text }]}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.saveButton,
                    { backgroundColor: saving ? theme.border : theme.primary },
                  ]}
                  onPress={handleSaveProduct}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {editingProduct ? "Update Product" : "Add Product"}
                    </Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h2,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  addButtonText: {
    color: "#FFFFFF",
    ...Typography.label,
    fontWeight: "600",
  },
  errorCard: {
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    ...Typography.body,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: "#FFFFFF",
    ...Typography.label,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    paddingVertical: Spacing.xs,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    alignItems: "center",
  },
  statValue: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
  },
  emptyCard: {
    padding: Spacing["3xl"],
    alignItems: "center",
  },
  emptyText: {
    ...Typography.body,
    marginTop: Spacing.md,
    textAlign: "center",
  },
  productCard: {
    flexDirection: "row",
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: "center",
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    ...Typography.label,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  productCategory: {
    ...Typography.caption,
    marginBottom: Spacing.sm,
  },
  productMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  productPrice: {
    ...Typography.label,
    fontWeight: "600",
  },
  inactiveBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  inactiveText: {
    ...Typography.caption,
    fontWeight: "600",
  },
  productActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
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
    maxHeight: "90%",
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
  formGroup: {
    marginBottom: Spacing.lg,
  },
  formRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  formLabel: {
    ...Typography.label,
    marginBottom: Spacing.sm,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.body,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  cancelModalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelModalText: {
    ...Typography.label,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    ...Typography.label,
    fontWeight: "600",
  },
  modalScrollContent: {
    maxHeight: 400,
  },
  imagePicker: {
    width: "100%",
    height: 150,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  imagePlaceholderText: {
    ...Typography.caption,
  },
  removeImageButton: {
    marginTop: Spacing.sm,
    alignSelf: "flex-start",
  },
  removeImageText: {
    ...Typography.caption,
    fontWeight: "600",
  },
});
