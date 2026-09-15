import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import ScreenKeyboardAwareScrollView from "@/components/ScreenKeyboardAwareScrollView";

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, isLoading, error, clearError } = useAuth();
  const { theme } = useTheme();
  const { language, setLanguage, t, isRTL } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    if (error) {
      Alert.alert(t("error"), error);
      clearError();
    }
  }, [error]);

  const validateEmail = (value: string) => {
    setEmail(value);
    if (value.length > 0 && !isValidEmail(value)) {
      setEmailError(t("invalidEmail"));
    } else {
      setEmailError("");
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t("error"), t("enterEmailPassword"));
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert(t("error"), t("invalidEmail"));
      return;
    }

    setLocalLoading(true);
    const success = await login(email, password);
    setLocalLoading(false);

    if (!success) {
      Alert.alert(t("error"), t("loginError"));
    }
  };

  const toggleLanguage = async () => {
    const newLang: Language = language === "en" ? "ar" : "en";
    await setLanguage(newLang);
  };

  const showLoading = isLoading || localLoading;

  return (
    <ScreenKeyboardAwareScrollView contentContainerStyle={styles.container}>
      <Pressable
        style={[
          styles.languageToggle,
          { backgroundColor: theme.backgroundSecondary },
        ]}
        onPress={toggleLanguage}
      >
        <ThemedText style={styles.languageToggleText}>
          {language === "en" ? "العربية" : "English"}
        </ThemedText>
      </Pressable>

      <View style={styles.header}>
        <Image source={require("@/assets2/images/1.png")} style={styles.logo} />
        <ThemedText style={styles.title}>{t("appName")}</ThemedText>
      </View>

      <View style={styles.form}>
        <ThemedText style={styles.formTitle}>{t("login")}</ThemedText>

        <Input
          label={t("email")}
          value={email}
          onChangeText={validateEmail}
          placeholder="your@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={emailError}
        />

        <Input
          label={t("password")}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />

        <Button
          title={showLoading ? t("loading") : t("loginButton")}
          onPress={handleLogin}
          disabled={showLoading}
        />

        {showLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        ) : null}
      </View>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing["2xl"],
    justifyContent: "center",
    paddingVertical: Spacing["2xl"],
  },
  languageToggle: {
    position: "absolute",
    top: Spacing["3xl"],
    right: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  languageToggleText: {
    fontSize: 14,
    fontWeight: "600",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  form: {
    marginBottom: Spacing["2xl"],
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  loadingContainer: {
    marginTop: Spacing.md,
    alignItems: "center",
  },
});
