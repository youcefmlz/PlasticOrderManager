import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from "react-native";

export type Language = "en" | "ar";

type TranslationKey = keyof typeof translations.en;

const translations = {
  en: {
    // Common
    appName: "B2B Orders",
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    confirm: "Confirm",
    success: "Success",
    error: "Error",
    ok: "OK",
    yes: "Yes",
    no: "No",
    search: "Search",
    noResults: "No results found",
    retry: "Retry",

    // Auth
    login: "Login",
    logout: "Logout",
    email: "Email",
    password: "Password",
    loginButton: "Sign In",
    loginError: "Invalid email or password",
    logoutConfirm: "Are you sure you want to logout?",
    enterEmailPassword: "Please enter email and password",
    invalidEmail: "Please enter a valid email address",

    // Navigation Tabs
    catalog: "Catalog",
    orders: "Orders",
    cart: "Cart",
    profile: "Profile",
    dashboard: "Dashboard",
    products: "Products",
    customers: "Customers",
    alerts: "Alerts",
    settings: "Settings",

    // Product Catalog
    allProducts: "All Products",
    categories: "Categories",
    addToCart: "Add to Cart",
    outOfStock: "Out of Stock",
    productDetails: "Product Details",
    specifications: "Specifications",
    price: "Price",
    quantity: "Quantity",

    // Cart
    myCart: "My Cart",
    emptyCart: "Your cart is empty",
    emptyCartDesc: "Add products to get started",
    subtotal: "Subtotal",
    total: "Total",
    checkout: "Checkout",
    removeFromCart: "Remove",
    clearCart: "Clear Cart",
    clearAll: "Clear All",
    clearCartConfirm:
      "Are you sure you want to remove all items from your cart?",
    clear: "Clear",

    // Orders
    myOrders: "My Orders",
    orderHistory: "Order History",
    noOrders: "No orders yet",
    noOrdersDesc: "Your order history will appear here",
    orderNumber: "Order Number",
    orderDate: "Order Date",
    orderStatus: "Status",
    orderTotal: "Total",
    orderDetails: "Order Details",
    orderItems: "Order Items",
    deliveryAddress: "Delivery Address",
    specialInstructions: "Special Instructions",
    placeOrder: "Place Order",
    orderPlaced: "Order Placed",
    orderPlacedDesc: "Your order has been placed successfully!",
    orderNotFound: "Order not found",
    orderInfo: "Order Information",
    date: "Date",
    qty: "Qty",

    // Order Statuses
    all: "All",
    pending: "Pending",
    confirmed: "Confirmed",
    delivered: "Delivered",

    // Checkout
    checkoutTitle: "Checkout",
    enterDeliveryAddress: "Enter delivery address",
    orderSummary: "Order Summary",
    paymentMethod: "Payment Method",
    cashOnDelivery: "Cash on Delivery",
    cashOnDeliveryDesc: "Pay when your order arrives",
    termsAndConditions: "Terms & Conditions",
    acceptTerms: "I accept the terms and conditions",
    acceptTermsError: "Please accept terms and conditions",
    addressRequired: "Please enter delivery address",

    // Profile
    personalInfo: "Personal Information",
    fullName: "Full Name",
    companyName: "Company Name",
    phone: "Phone",
    address: "Address",
    profileUpdated: "Profile updated successfully",
    profileUpdateFailed: "Failed to update profile",
    administrator: "Administrator",
    wholesaler: "Wholesaler",

    // Settings
    language: "Language",
    selectLanguage: "Select Language",
    english: "English",
    arabic: "Arabic",
    appSettings: "App Settings",
    account: "Account",

    // Admin Dashboard
    welcomeBack: "Welcome back,",
    admin: "Admin",
    pendingOrders: "Pending Orders",
    confirmedOrders: "Confirmed",
    totalOrders: "Total Orders",
    newAlerts: "New Alerts",
    recentOrders: "Recent Orders",
    noOrdersYet: "No orders yet",
    viewAll: "View All",

    // Admin Orders
    allOrders: "All Orders",
    updateStatus: "Update Status",
    customer: "Customer",
    company: "Company",
    items: "Items",

    // Admin Products
    manageProducts: "Manage Products",
    addProduct: "Add Product",
    editProduct: "Edit Product",
    productName: "Product Name",
    category: "Category",
    description: "Description",
    productImage: "Product Image",
    selectImage: "Select Image",
    productAdded: "Product added successfully",
    productUpdated: "Product updated successfully",
    productDeleted: "Product deleted successfully",
    deleteProductConfirm: "Are you sure you want to delete this product?",

    // Admin Customers
    manageCustomers: "Manage Customers",
    addCustomer: "Add Customer",
    editCustomer: "Edit Customer",
    customerDetails: "Customer Details",
    resetPassword: "Reset Password",
    newPassword: "New Password",
    customerAdded: "Customer added successfully",
    customerUpdated: "Customer updated successfully",
    customerDeleted: "Customer deleted successfully",
    passwordReset: "Password reset successfully",
    deleteCustomerConfirm: "Are you sure you want to delete this customer?",

    // Admin Alerts
    notifications: "Notifications",
    noNotifications: "No notifications",
    noNotificationsDesc: "You're all caught up!",
    markAsRead: "Mark as Read",
    newOrder: "New Order",
  },
  ar: {
    // Common
    appName: "طلبات B2B",
    loading: "جاري التحميل...",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    confirm: "تأكيد",
    success: "نجاح",
    error: "خطأ",
    ok: "موافق",
    yes: "نعم",
    no: "لا",
    search: "بحث",
    noResults: "لا توجد نتائج",
    retry: "إعادة المحاولة",

    // Auth
    login: "تسجيل الدخول",
    logout: "تسجيل الخروج",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    loginButton: "دخول",
    loginError: "بريد إلكتروني أو كلمة مرور غير صحيحة",
    logoutConfirm: "هل أنت متأكد من تسجيل الخروج؟",
    enterEmailPassword: "يرجى إدخال البريد الإلكتروني وكلمة المرور",
    invalidEmail: "يرجى إدخال بريد إلكتروني صالح",

    // Navigation Tabs
    catalog: "المنتجات",
    orders: "الطلبات",
    cart: "السلة",
    profile: "الملف الشخصي",
    dashboard: "لوحة التحكم",
    products: "المنتجات",
    customers: "العملاء",
    alerts: "التنبيهات",
    settings: "الإعدادات",

    // Product Catalog
    allProducts: "جميع المنتجات",
    categories: "الفئات",
    addToCart: "أضف للسلة",
    outOfStock: "غير متوفر",
    productDetails: "تفاصيل المنتج",
    specifications: "المواصفات",
    price: "السعر",
    quantity: "الكمية",

    // Cart
    myCart: "سلة التسوق",
    emptyCart: "السلة فارغة",
    emptyCartDesc: "أضف منتجات للبدء",
    subtotal: "المجموع الفرعي",
    total: "الإجمالي",
    checkout: "إتمام الطلب",
    removeFromCart: "إزالة",
    clearCart: "إفراغ السلة",
    clearAll: "مسح الكل",
    clearCartConfirm: "هل أنت متأكد من إزالة جميع العناصر من السلة؟",
    clear: "مسح",

    // Orders
    myOrders: "طلباتي",
    orderHistory: "سجل الطلبات",
    noOrders: "لا توجد طلبات",
    noOrdersDesc: "سيظهر سجل طلباتك هنا",
    orderNumber: "رقم الطلب",
    orderDate: "تاريخ الطلب",
    orderStatus: "الحالة",
    orderTotal: "الإجمالي",
    orderDetails: "تفاصيل الطلب",
    orderItems: "عناصر الطلب",
    deliveryAddress: "عنوان التوصيل",
    specialInstructions: "تعليمات خاصة",
    placeOrder: "تأكيد الطلب",
    orderPlaced: "تم الطلب",
    orderPlacedDesc: "تم تقديم طلبك بنجاح!",
    orderNotFound: "الطلب غير موجود",
    orderInfo: "معلومات الطلب",
    date: "التاريخ",
    qty: "الكمية",

    // Order Statuses
    all: "الكل",
    pending: "قيد الانتظار",
    confirmed: "مؤكد",
    delivered: "تم التوصيل",

    // Checkout
    checkoutTitle: "إتمام الطلب",
    enterDeliveryAddress: "أدخل عنوان التوصيل",
    orderSummary: "ملخص الطلب",
    paymentMethod: "طريقة الدفع",
    cashOnDelivery: "الدفع عند الاستلام",
    cashOnDeliveryDesc: "ادفع عند وصول طلبك",
    termsAndConditions: "الشروط والأحكام",
    acceptTerms: "أوافق على الشروط والأحكام",
    acceptTermsError: "يرجى الموافقة على الشروط والأحكام",
    addressRequired: "يرجى إدخال عنوان التوصيل",

    // Profile
    personalInfo: "المعلومات الشخصية",
    fullName: "الاسم الكامل",
    companyName: "اسم الشركة",
    phone: "الهاتف",
    address: "العنوان",
    profileUpdated: "تم تحديث الملف الشخصي بنجاح",
    profileUpdateFailed: "فشل تحديث الملف الشخصي",
    administrator: "مدير",
    wholesaler: "تاجر جملة",

    // Settings
    language: "اللغة",
    selectLanguage: "اختر اللغة",
    english: "English",
    arabic: "العربية",
    appSettings: "إعدادات التطبيق",
    account: "الحساب",

    // Admin Dashboard
    welcomeBack: "مرحباً بعودتك،",
    admin: "مدير",
    pendingOrders: "طلبات قيد الانتظار",
    confirmedOrders: "مؤكدة",
    totalOrders: "إجمالي الطلبات",
    newAlerts: "تنبيهات جديدة",
    recentOrders: "الطلبات الأخيرة",
    noOrdersYet: "لا توجد طلبات بعد",
    viewAll: "عرض الكل",

    // Admin Orders
    allOrders: "جميع الطلبات",
    updateStatus: "تحديث الحالة",
    customer: "العميل",
    company: "الشركة",
    items: "عناصر",

    // Admin Products
    manageProducts: "إدارة المنتجات",
    addProduct: "إضافة منتج",
    editProduct: "تعديل المنتج",
    productName: "اسم المنتج",
    category: "الفئة",
    description: "الوصف",
    productImage: "صورة المنتج",
    selectImage: "اختر صورة",
    productAdded: "تمت إضافة المنتج بنجاح",
    productUpdated: "تم تحديث المنتج بنجاح",
    productDeleted: "تم حذف المنتج بنجاح",
    deleteProductConfirm: "هل أنت متأكد من حذف هذا المنتج؟",

    // Admin Customers
    manageCustomers: "إدارة العملاء",
    addCustomer: "إضافة عميل",
    editCustomer: "تعديل العميل",
    customerDetails: "تفاصيل العميل",
    resetPassword: "إعادة تعيين كلمة المرور",
    newPassword: "كلمة المرور الجديدة",
    customerAdded: "تمت إضافة العميل بنجاح",
    customerUpdated: "تم تحديث العميل بنجاح",
    customerDeleted: "تم حذف العميل بنجاح",
    passwordReset: "تم إعادة تعيين كلمة المرور بنجاح",
    deleteCustomerConfirm: "هل أنت متأكد من حذف هذا العميل؟",

    // Admin Alerts
    notifications: "الإشعارات",
    noNotifications: "لا توجد إشعارات",
    noNotificationsDesc: "أنت محدث بالكامل!",
    markAsRead: "تحديد كمقروء",
    newOrder: "طلب جديد",
  },
};

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

const LANGUAGE_KEY = "app_language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage === "ar" || savedLanguage === "en") {
        setLanguageState(savedLanguage);
      }
    } catch (error) {
      console.log("Failed to load language preference");
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      setLanguageState(lang);
    } catch (error) {
      console.log("Failed to save language preference");
    }
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  const isRTL = language === "ar";

  if (isLoading) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
