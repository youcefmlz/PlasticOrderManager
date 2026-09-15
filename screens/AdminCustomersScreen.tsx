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
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import ScreenScrollView from "@/components/ScreenScrollView";
import { Card } from "@/components/Card";
import { customersApi, Customer } from "@/services/api";

type CustomerFormData = {
  email: string;
  password: string;
  name: string;
  company: string;
  phone: string;
  address: string;
};

type ModalMode = "add" | "edit" | "reset-password" | null;

const emptyFormData: CustomerFormData = {
  email: "",
  password: "",
  name: "",
  company: "",
  phone: "",
  address: "",
};

export default function AdminCustomersScreen() {
  const { theme } = useTheme();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>(emptyFormData);
  const [newPassword, setNewPassword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    try {
      setApiError(null);
      const data = await customersApi.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Failed to load customers:", error);
      setApiError(
        "Unable to load customers from server. Please check your connection.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCustomers();
    setRefreshing(false);
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setFormData(emptyFormData);
    setModalMode("add");
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      email: customer.email,
      password: "",
      name: customer.name || "",
      company: customer.company || "",
      phone: customer.phone || "",
      address: customer.address || "",
    });
    setModalMode("edit");
  };

  const handleResetPassword = (customer: Customer) => {
    setEditingCustomer(customer);
    setNewPassword("");
    setModalMode("reset-password");
  };

  const handleDeleteCustomer = (customerId: string, customerName: string) => {
    const displayName = customerName || "this customer";
    const doDelete = async () => {
      try {
        await customersApi.deleteCustomer(customerId);
        setCustomers((prev) => prev.filter((c) => c.id !== customerId));
        if (Platform.OS === "web") {
          window.alert("Customer deleted successfully");
        } else {
          Alert.alert("Success", "Customer deleted successfully");
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to delete customer";
        if (Platform.OS === "web") {
          window.alert(message);
        } else {
          Alert.alert("Error", message);
        }
      }
    };

    if (Platform.OS === "web") {
      if (
        window.confirm(
          `Are you sure you want to delete ${displayName}? This action cannot be undone.`,
        )
      ) {
        doDelete();
      }
    } else {
      Alert.alert(
        "Delete Customer",
        `Are you sure you want to delete ${displayName}? This action cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: doDelete },
        ],
      );
    }
  };

  const handleSaveCustomer = async () => {
    if (modalMode === "add") {
      if (!formData.email || !formData.password) {
        if (Platform.OS === "web") {
          window.alert("Email and password are required");
        } else {
          Alert.alert("Error", "Email and password are required");
        }
        return;
      }

      if (formData.password.length < 6) {
        if (Platform.OS === "web") {
          window.alert("Password must be at least 6 characters");
        } else {
          Alert.alert("Error", "Password must be at least 6 characters");
        }
        return;
      }
    }

    setSaving(true);
    try {
      if (modalMode === "add") {
        const newCustomer = await customersApi.createCustomer({
          email: formData.email,
          password: formData.password,
          name: formData.name || undefined,
          company: formData.company || undefined,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
        });
        setCustomers((prev) => [newCustomer, ...prev]);

        if (Platform.OS === "web") {
          window.alert("Customer created successfully");
        } else {
          Alert.alert("Success", "Customer created successfully");
        }
      } else if (modalMode === "edit" && editingCustomer) {
        const updatedCustomer = await customersApi.updateCustomer(
          editingCustomer.id,
          {
            name: formData.name || undefined,
            company: formData.company || undefined,
            phone: formData.phone || undefined,
            address: formData.address || undefined,
          },
        );
        setCustomers((prev) =>
          prev.map((c) => (c.id === editingCustomer.id ? updatedCustomer : c)),
        );

        if (Platform.OS === "web") {
          window.alert("Customer updated successfully");
        } else {
          Alert.alert("Success", "Customer updated successfully");
        }
      }

      closeModal();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save customer";
      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert("Error", message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleResetPasswordSubmit = async () => {
    if (!newPassword || newPassword.length < 6) {
      if (Platform.OS === "web") {
        window.alert("Password must be at least 6 characters");
      } else {
        Alert.alert("Error", "Password must be at least 6 characters");
      }
      return;
    }

    if (!editingCustomer) return;

    setSaving(true);
    try {
      await customersApi.resetCustomerPassword(editingCustomer.id, newPassword);

      if (Platform.OS === "web") {
        window.alert("Password reset successfully");
      } else {
        Alert.alert("Success", "Password reset successfully");
      }
      closeModal();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reset password";
      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert("Error", message);
      }
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setFormData(emptyFormData);
    setEditingCustomer(null);
    setNewPassword("");
  };

  const filteredCustomers = customers.filter(
    (c) =>
      (c.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (c.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (c.company?.toLowerCase() || "").includes(searchQuery.toLowerCase()),
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

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
          Loading customers...
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
              Customer Management
            </Text>
            <Pressable
              style={[styles.addButton, { backgroundColor: theme.primary }]}
              onPress={handleAddCustomer}
            >
              <Feather name="plus" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Customer</Text>
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
                onPress={loadCustomers}
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
              placeholder="Search customers..."
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

          <Card style={styles.statCard}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                  {customers.length}
                </Text>
                <Text style={[styles.statLabel, { color: theme.text }]}>
                  Total Customers
                </Text>
              </View>
            </View>
          </Card>

          {filteredCustomers.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Feather name="users" size={48} color={theme.text} />
              <Text style={[styles.emptyText, { color: theme.text }]}>
                {searchQuery
                  ? "No customers found"
                  : "No customers yet. Add your first customer!"}
              </Text>
            </Card>
          ) : (
            filteredCustomers.map((customer) => (
              <Card key={customer.id} style={styles.customerCard}>
                <View
                  style={[
                    styles.customerAvatar,
                    { backgroundColor: theme.primary + "20" },
                  ]}
                >
                  <Feather name="user" size={24} color={theme.primary} />
                </View>
                <View style={styles.customerInfo}>
                  <Text
                    style={[styles.customerName, { color: theme.textPrimary }]}
                  >
                    {customer.name || "No Name"}
                  </Text>
                  <Text style={[styles.customerEmail, { color: theme.text }]}>
                    {customer.email}
                  </Text>
                  {customer.company ? (
                    <Text
                      style={[styles.customerCompany, { color: theme.text }]}
                    >
                      {customer.company}
                    </Text>
                  ) : null}
                  <Text style={[styles.customerDate, { color: theme.text }]}>
                    Joined: {formatDate(customer.createdAt)}
                  </Text>
                </View>
                <View style={styles.customerActions}>
                  <Pressable
                    style={[
                      styles.iconButton,
                      { backgroundColor: theme.backgroundSecondary },
                    ]}
                    onPress={() => handleEditCustomer(customer)}
                  >
                    <Feather name="edit-2" size={16} color={theme.primary} />
                  </Pressable>
                  <Pressable
                    style={[
                      styles.iconButton,
                      { backgroundColor: theme.warning + "15" },
                    ]}
                    onPress={() => handleResetPassword(customer)}
                  >
                    <Feather name="key" size={16} color={theme.warning} />
                  </Pressable>
                  <Pressable
                    style={[
                      styles.iconButton,
                      { backgroundColor: theme.danger + "15" },
                    ]}
                    onPress={() =>
                      handleDeleteCustomer(
                        customer.id,
                        customer.name || customer.email,
                      )
                    }
                  >
                    <Feather name="trash-2" size={16} color={theme.danger} />
                  </Pressable>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScreenScrollView>

      <Modal
        visible={modalMode === "add" || modalMode === "edit"}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
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
                {modalMode === "add" ? "Add New Customer" : "Edit Customer"}
              </Text>
              <Pressable onPress={closeModal} disabled={saving}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>
                  Email *
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
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, email: text }))
                  }
                  placeholder="customer@email.com"
                  placeholderTextColor={theme.text}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={modalMode === "add" && !saving}
                />
              </View>

              {modalMode === "add" ? (
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>
                    Password *
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
                    value={formData.password}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, password: text }))
                    }
                    placeholder="Min 6 characters"
                    placeholderTextColor={theme.text}
                    secureTextEntry
                    editable={!saving}
                  />
                </View>
              ) : null}

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>
                  Full Name
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
                  placeholder="Customer name"
                  placeholderTextColor={theme.text}
                  editable={!saving}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>
                  Company
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
                  value={formData.company}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, company: text }))
                  }
                  placeholder="Company name"
                  placeholderTextColor={theme.text}
                  editable={!saving}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>
                  Phone
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
                  value={formData.phone}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, phone: text }))
                  }
                  placeholder="+1 (555) 123-4567"
                  placeholderTextColor={theme.text}
                  keyboardType="phone-pad"
                  editable={!saving}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>
                  Delivery Address
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
                  value={formData.address}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, address: text }))
                  }
                  placeholder="Business address"
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
                  onPress={closeModal}
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
                  onPress={handleSaveCustomer}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {modalMode === "add"
                        ? "Create Customer"
                        : "Update Customer"}
                    </Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalMode === "reset-password"}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              styles.smallModal,
              { backgroundColor: theme.backgroundRoot },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Reset Password
              </Text>
              <Pressable onPress={closeModal} disabled={saving}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.modalScrollContent}>
              <Text style={[styles.resetPasswordInfo, { color: theme.text }]}>
                Setting new password for: {editingCustomer?.email}
              </Text>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>
                  New Password *
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
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Min 6 characters"
                  placeholderTextColor={theme.text}
                  secureTextEntry
                  editable={!saving}
                />
              </View>

              <View style={styles.modalActions}>
                <Pressable
                  style={[
                    styles.cancelModalButton,
                    { borderColor: theme.border },
                  ]}
                  onPress={closeModal}
                  disabled={saving}
                >
                  <Text style={[styles.cancelModalText, { color: theme.text }]}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.saveButton,
                    { backgroundColor: saving ? theme.border : theme.warning },
                  ]}
                  onPress={handleResetPasswordSubmit}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Reset Password</Text>
                  )}
                </Pressable>
              </View>
            </View>
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
  statCard: {
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  statItem: {
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
  customerCard: {
    flexDirection: "row",
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: "center",
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    ...Typography.label,
    fontWeight: "700",
    marginBottom: 2,
  },
  customerEmail: {
    ...Typography.small,
    marginBottom: 2,
  },
  customerCompany: {
    ...Typography.caption,
    marginBottom: 2,
  },
  customerDate: {
    ...Typography.caption,
    fontSize: 11,
  },
  customerActions: {
    flexDirection: "column",
    gap: Spacing.xs,
  },
  iconButton: {
    width: 36,
    height: 36,
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
  smallModal: {
    maxHeight: "50%",
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
  modalScrollContent: {
    flexGrow: 1,
  },
  resetPasswordInfo: {
    ...Typography.body,
    marginBottom: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    ...Typography.label,
    marginBottom: Spacing.sm,
  },
  formInput: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    ...Typography.body,
  },
  textArea: {
    height: 100,
    paddingTop: Spacing.md,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  cancelModalButton: {
    flex: 1,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelModalText: {
    ...Typography.label,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    ...Typography.label,
    fontWeight: "600",
  },
});
