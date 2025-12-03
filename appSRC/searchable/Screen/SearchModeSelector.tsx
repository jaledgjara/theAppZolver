import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, SIZES } from "@/appASSETS/theme";
import { Ionicons } from "@expo/vector-icons";

type SearchMode = "instant" | "quote";

interface SearchModeSelectorProps {
  currentMode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
}

const SearchModeSelector: React.FC<SearchModeSelectorProps> = ({
  currentMode,
  onModeChange,
}) => {
  return (
    <View style={styles.container}>
      {/* Botón Zolver Ya */}
      <TouchableOpacity
        style={[
          styles.button,
          currentMode === "instant" && styles.activeButton,
        ]}
        onPress={() => onModeChange("instant")}
        activeOpacity={0.8}>
        <Ionicons
          name="flash"
          size={16}
          color={currentMode === "instant" ? "#FFF" : COLORS.primary}
          style={{ marginRight: 6 }}
        />
        <Text
          style={[styles.text, currentMode === "instant" && styles.activeText]}>
          Zolver Ya
        </Text>
      </TouchableOpacity>

      {/* Botón Presupuesto */}
      <TouchableOpacity
        style={[styles.button, currentMode === "quote" && styles.activeButton]}
        onPress={() => onModeChange("quote")}
        activeOpacity={0.8}>
        <Ionicons
          name="document-text"
          size={16}
          color={currentMode === "quote" ? "#FFF" : "#666"}
          style={{ marginRight: 6 }}
        />
        <Text
          style={[styles.text, currentMode === "quote" && styles.activeText]}>
          Presupuesto
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SearchModeSelector;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
    borderRadius: 25,
    padding: 4,
    marginTop: 15,
    marginHorizontal: 20,
    height: 45,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  activeButton: {
    backgroundColor: COLORS.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  activeText: {
    color: "#FFF",
    fontWeight: "700",
  },
});
