import AntDesign from "@expo/vector-icons/AntDesign";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { FONTS, COLORS } from "../../appASSETS/theme";

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
      {/* LADO IZQUIERDO: Back Button + Título */}
      <View style={styles.titleSection}>
        {showBackButton && (
          <Pressable
            onPress={handleBackButton}
            hitSlop={10}
            style={styles.backBtn}>
            <AntDesign name="arrow-left" size={20} color="white" />
          </Pressable>
        )}
        <Text style={styles.title} numberOfLines={1}>
          {isHybrid ? "Mi Panel" : titleText}
        </Text>
      </View>

      {/* LADO DERECHO: Switcher Compacto */}
      {isHybrid && onTabChange && (
        <View style={styles.switcherContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tab, activeTab === "instant" && styles.activeTab]}
            onPress={() => onTabChange("instant")}>
            <Text
              style={[
                styles.tabText,
                activeTab === "instant" && styles.activeTabText,
              ]}>
              RADAR
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tab, activeTab === "quote" && styles.activeTab]}
            onPress={() => onTabChange("quote")}>
            <Text
              style={[
                styles.tabText,
                activeTab === "quote" && styles.activeTabText,
              ]}>
              AGENDA
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Empuja el switcher a la derecha
    width: "100%",
    height: 130, // Altura estándar solicitada
    paddingHorizontal: 20,
    paddingTop: 70, // Espacio para el Notch/StatusBar
    paddingBottom: 10,
    backgroundColor: COLORS.tertiary,
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1, // Permite que el título ocupe el espacio necesario
  },
  backBtn: {
    marginRight: 10,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.white,
    fontWeight: "500",
  },
  switcherContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    padding: 2,
    minWidth: 160, // Tamaño controlado
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: COLORS.white,
  },
  tabText: {
    fontSize: 12, // Texto más pequeño y minimalista
    color: "rgba(255,255,255,0.8)",
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  activeTabText: {
    color: COLORS.tertiary,
  },
});
