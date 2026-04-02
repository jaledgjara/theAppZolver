import AntDesign from "@expo/vector-icons/AntDesign";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  StatusBar,
} from "react-native";
import { FONTS, COLORS, SIZES } from "../../appASSETS/theme";

interface ToolBarTitleProps {
  titleText: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  isHybrid?: boolean;
  activeTab?: "instant" | "quote";
  onTabChange?: (tab: "instant" | "quote") => void;
}

export const ToolBarTitle: React.FC<ToolBarTitleProps> = ({
  titleText,
  showBackButton = false,
  onBackPress,
  isHybrid = false,
  activeTab,
  onTabChange,
}) => {
  const router = useRouter();

  const handleBackButton = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleSection}>
        {showBackButton && (
          <Pressable onPress={handleBackButton} hitSlop={10} style={styles.backBtn}>
            <AntDesign name="arrow-left" size={20} color={COLORS.white} />
          </Pressable>
        )}
        <Text style={styles.title} numberOfLines={1}>
          {isHybrid ? "Mi Panel" : titleText}
        </Text>
      </View>

      {isHybrid && onTabChange && (
        <View style={styles.switcherContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tab, activeTab === "instant" && styles.activeTab]}
            onPress={() => onTabChange("instant")}
          >
            <Text style={[styles.tabText, activeTab === "instant" && styles.activeTabText]}>
              RADAR
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tab, activeTab === "quote" && styles.activeTab]}
            onPress={() => onTabChange("quote")}
          >
            <Text style={[styles.tabText, activeTab === "quote" && styles.activeTabText]}>
              AGENDA
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const STATUS_BAR_HEIGHT = Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) : 44;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: SIZES.xl,
    paddingTop: STATUS_BAR_HEIGHT + SIZES.lg,
    paddingBottom: SIZES.lg,
    backgroundColor: COLORS.brandDeep,
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backBtn: {
    marginRight: SIZES.md,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.white,
  },
  switcherContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: SIZES.sm + 2,
    padding: 2,
    minWidth: 160,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    alignItems: "center",
    borderRadius: SIZES.sm,
  },
  activeTab: {
    backgroundColor: COLORS.white,
  },
  tabText: {
    ...FONTS.label,
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
  },
  activeTabText: {
    color: COLORS.brandDeep,
  },
});
