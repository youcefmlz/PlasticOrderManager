import React, { useState, useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View, Text } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import AdminDashboardScreen from "@/screens/AdminDashboardScreen";
import AdminOrdersScreen from "@/screens/AdminOrdersScreen";
import AdminProductsScreen from "@/screens/AdminProductsScreen";
import AdminCustomersScreen from "@/screens/AdminCustomersScreen";
import AdminNotificationsScreen from "@/screens/AdminNotificationsScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import { adminApi } from "@/services/api";
import { BorderRadius, Spacing } from "@/constants/theme";

export type AdminTabParamList = {
  Dashboard: undefined;
  AdminOrders: undefined;
  Products: undefined;
  Customers: undefined;
  Notifications: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();

function NotificationBadge({ count, theme }: { count: number; theme: any }) {
  if (count === 0) return null;

  return (
    <View style={[styles.badge, { backgroundColor: theme.danger }]}>
      <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
}

export default function AdminTabNavigator() {
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await adminApi.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.log("Failed to fetch notification count");
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{
          title: t("dashboard"),
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AdminOrders"
        component={AdminOrdersScreen}
        options={{
          title: t("orders"),
          tabBarIcon: ({ color, size }) => (
            <Feather name="clipboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Products"
        component={AdminProductsScreen}
        options={{
          title: t("products"),
          tabBarIcon: ({ color, size }) => (
            <Feather name="package" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Customers"
        component={AdminCustomersScreen}
        options={{
          title: t("customers"),
          tabBarIcon: ({ color, size }) => (
            <Feather name="users" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={AdminNotificationsScreen}
        options={{
          title: t("alerts"),
          tabBarIcon: ({ color, size }) => (
            <View>
              <Feather name="bell" size={size} color={color} />
              <NotificationBadge count={unreadCount} theme={theme} />
            </View>
          ),
        }}
        listeners={{
          focus: () => {
            adminApi
              .getUnreadCount()
              .then(setUnreadCount)
              .catch(() => {});
          },
        }}
      />
      <Tab.Screen
        name="Settings"
        component={ProfileScreen}
        options={{
          title: t("settings"),
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xs,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
});
