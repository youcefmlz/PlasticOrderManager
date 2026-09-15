import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  ViewStyle,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Card } from "@/components/Card";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import ScreenKeyboardAwareScrollView from "@/components/ScreenKeyboardAwareScrollView";

type ProfileScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { theme } = useTheme();
  const { user, logout, updateProfile, isLoading } = useAuth();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const [name, setName] = useState(user?.name || "");
  const [company, setCompany] = useState(user?.company || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setCompany(user.company || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    const success = await updateProfile({ name, company, phone });
    setSaving(false);

    if (success) {
      if (Platform.OS === "web") {
        window.alert(t("profileUpdated"));
      } else {
        Alert.alert(t("success"), t("profileUpdated"));
      }
    } else {
      if (Platform.OS === "web") {
        window.alert(t("profileUpdateFailed"));
      } else {
        Alert.alert(t("error"), t("profileUpdateFailed"));
      }
    }
  };

  const handleLogout = async () => {
    const doLogout = async () => {
      await logout();
    };

    if (Platform.OS === "web") {
      if (window.confirm(t("logoutConfirm"))) {
        await doLogout();
      }
    } else {
      Alert.alert(t("logout"), t("logoutConfirm"), [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("logout"),
          style: "destructive",
          onPress: doLogout,
        },
      ]);
    }
  };

  const handleLanguageChange = async (lang: Language) => {
    await setLanguage(lang);
    setShowLanguageModal(false);
  };

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={[styles.container, isRTL ? styles.containerRTL : undefined]}>
        <View style={styles.header}>
          <View
            style={[
              styles.avatarContainer,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <Feather name="user" size={48} color={theme.text} />
          </View>
          <ThemedText style={styles.email}>{user?.email}</ThemedText>
          <View
            style={[
              styles.roleBadge,
              {
                backgroundColor:
                  user?.role === "admin" ? theme.primary : theme.secondary,
              },
            ]}
          >
            <ThemedText style={styles.roleText}>
              {user?.role === "admin" ? t("administrator") : t("wholesaler")}
            </ThemedText>
          </View>
        </View>

        <Card style={styles.section}>
          <ThemedText style={[styles.sectionTitle, isRTL && styles.textRTL]}>
            {t("personalInfo")}
          </ThemedText>
          <Input label={t("fullName")} value={name} onChangeText={setName} />
          {user?.role === "wholesaler" ? (
            <>
              <Input
                label={t("companyName")}
                value={company}
                onChangeText={setCompany}
              />
              <Input
                label={t("phone")}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </>
          ) : null}
          <Button
            title={saving ? t("loading") : t("save")}
            onPress={handleSave}
            disabled={saving || isLoading}
          />
          {saving ? (
            <ActivityIndicator
              size="small"
              color={theme.primary}
              style={styles.loader}
            />
          ) : null}
        </Card>

        <Card style={styles.section}>
          <ThemedText style={[styles.sectionTitle, isRTL && styles.textRTL]}>
            {t("appSettings")}
          </ThemedText>
          <Pressable
            style={[styles.preferenceRow, isRTL && styles.preferenceRowRTL]}
            onPress={() => setShowLanguageModal(true)}
          >
            <View
              style={[styles.preferenceLeft, isRTL && styles.preferenceLeftRTL]}
            >
              <Feather name="globe" size={20} color={theme.text} />
              <ThemedText style={styles.preferenceText}>
                {t("language")}
              </ThemedText>
            </View>
            <View style={styles.preferenceRight}>
              <ThemedText
                style={[styles.preferenceValue, { color: theme.primary }]}
              >
                {language === "en" ? "English" : "العربية"}
              </ThemedText>
              <Feather
                name={isRTL ? "chevron-left" : "chevron-right"}
                size={20}
                color={theme.text}
              />
            </View>
          </Pressable>
        </Card>

        <Pressable
          onPress={handleLogout}
          style={[styles.logoutButton, { backgroundColor: theme.danger }]}
        >
          <Feather name="log-out" size={20} color="#FFFFFF" />
          <ThemedText style={styles.logoutText}>{t("logout")}</ThemedText>
        </Pressable>
      </View>

      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowLanguageModal(false)}
        >
          <ThemedView
            style={[
              styles.modalContent,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <ThemedText style={styles.modalTitle}>
              {t("selectLanguage")}
            </ThemedText>

            <Pressable
              style={[
                styles.languageOption,
                language === "en" && { backgroundColor: theme.primary + "20" },
                { borderColor: theme.border },
              ]}
              onPress={() => handleLanguageChange("en")}
            >
              <ThemedText
                style={[
                  styles.languageText,
                  language === "en" && {
                    color: theme.primary,
                    fontWeight: "700",
                  },
                ]}
              >
                English
              </ThemedText>
              {language === "en" ? (
                <Feather name="check" size={20} color={theme.primary} />
              ) : null}
            </Pressable>

            <Pressable
              style={[
                styles.languageOption,
                language === "ar" && { backgroundColor: theme.primary + "20" },
                { borderColor: theme.border },
              ]}
              onPress={() => handleLanguageChange("ar")}
            >
              <ThemedText
                style={[
                  styles.languageText,
                  language === "ar" && {
                    color: theme.primary,
                    fontWeight: "700",
                  },
                ]}
              >
                العربية (Arabic)
              </ThemedText>
              {language === "ar" ? (
                <Feather name="check" size={20} color={theme.primary} />
              ) : null}
            </Pressable>

            <Pressable
              style={[styles.cancelButton, { borderColor: theme.border }]}
              onPress={() => setShowLanguageModal(false)}
            >
              <ThemedText>{t("cancel")}</ThemedText>
            </Pressable>
          </ThemedView>
        </Pressable>
      </Modal>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  containerRTL: {
    writingDirection: "rtl",
  } as ViewStyle,
  header: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  email: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  roleBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  roleText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  textRTL: {
    textAlign: "right",
  },
  loader: {
    marginTop: Spacing.md,
  },
  preferenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  preferenceRowRTL: {
    flexDirection: "row-reverse",
  },
  preferenceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  preferenceLeftRTL: {
    flexDirection: "row-reverse",
  },
  preferenceRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  preferenceText: {
    fontSize: 14,
  },
  preferenceValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    height: 52,
    borderRadius: BorderRadius.sm,
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 320,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  languageOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  languageText: {
    fontSize: 16,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
});
