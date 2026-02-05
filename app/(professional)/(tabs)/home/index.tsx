import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
} from "react-native";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { COLORS, FONTS } from "@/appASSETS/theme";

// Pantallas
import IndexInstantScreen from "@/appSRC/reservations/Screens/Instant/IndexInstantScreen";
import IndexQuoteScreen from "@/appSRC/reservations/Screens/Quote/IndexQuoteScreen";
import { useWorkMode } from "@/appSRC/users/Professional/General/Hooks/useWorkMode";

const ProfessionalHomeScreen = () => {
  const { typeWork, activeTab, switchTab, isHybrid } = useWorkMode();

  return (
    <View style={styles.container}>
      {/* ToolBar con Switcher integrado */}
      <ToolBarTitle
        titleText={typeWork === "quote" ? "Presupuestos" : "Inicio"}
        isHybrid={isHybrid}
        activeTab={activeTab}
        onTabChange={switchTab}
      />

      <View style={styles.content}>
        {/* Renderizado Condicional */}
        {activeTab === "instant" ? (
          <IndexInstantScreen />
        ) : (
          <IndexQuoteScreen />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    backgroundColor: COLORS.white,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  switcherContainer: {
    flexDirection: "row",
    backgroundColor: "#F5F5F7",
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
    padding: 4,
    height: 48,
  },
  tab: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: COLORS.white,
    // Sombra suave para efecto de elevación "Apple-style"
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    ...FONTS.body4,
    color: COLORS.textSecondary,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  content: { flex: 1 },
});

export default ProfessionalHomeScreen;
