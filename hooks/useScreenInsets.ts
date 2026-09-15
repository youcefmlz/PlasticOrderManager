import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing } from "@/constants/theme";

interface ScreenInsetsOptions {
  hasTabBar?: boolean;
  hasHeader?: boolean;
  tabBarHeight?: number;
  headerHeight?: number;
}

export function useScreenInsets(options: ScreenInsetsOptions = {}) {
  const insets = useSafeAreaInsets();
  const {
    hasTabBar = false,
    hasHeader = false,
    tabBarHeight = 0,
    headerHeight = 0,
  } = options;

  const paddingTop = hasHeader
    ? headerHeight + Spacing.xl
    : insets.top + Spacing.xl;

  const paddingBottom = hasTabBar
    ? tabBarHeight + Spacing.xl
    : insets.bottom + Spacing.xl;

  return {
    paddingTop,
    paddingBottom,
    scrollInsetBottom: insets.bottom + 16,
    insets,
  };
}
