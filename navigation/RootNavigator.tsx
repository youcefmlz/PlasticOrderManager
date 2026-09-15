import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "@/contexts/AuthContext";
import LoginScreen from "@/screens/LoginScreen";
import WholesalerTabNavigator from "./WholesalerTabNavigator";
import AdminTabNavigator from "./AdminTabNavigator";
import ProductDetailScreen from "@/screens/ProductDetailScreen";
import OrderDetailScreen from "@/screens/OrderDetailScreen";
import CheckoutScreen from "@/screens/CheckoutScreen";

export type RootStackParamList = {
  Login: undefined;
  WholesalerApp: undefined;
  AdminApp: undefined;
  ProductDetail: { productId: string };
  OrderDetail: { orderId: string };
  Checkout: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : isAdmin ? (
        <Stack.Screen name="AdminApp" component={AdminTabNavigator} />
      ) : (
        <>
          <Stack.Screen
            name="WholesalerApp"
            component={WholesalerTabNavigator}
          />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{
              presentation: "modal",
              headerShown: true,
              title: "Product Details",
            }}
          />
          <Stack.Screen
            name="OrderDetail"
            component={OrderDetailScreen}
            options={{
              headerShown: true,
              title: "Order Details",
            }}
          />
          <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={{
              presentation: "modal",
              headerShown: true,
              title: "Review Order",
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
