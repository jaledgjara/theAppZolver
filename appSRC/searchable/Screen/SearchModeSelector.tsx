import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/appASSETS/theme";
import { ProfessionalTypeWork } from "@/appSRC/users/Model/ProfessionalTypeWork";

interface Props {
  currentMode: ProfessionalTypeWork;
  onModeChange: (mode: ProfessionalTypeWork) => void;
}

const SearchModeSelector: React.FC<Props> = ({ currentMode, onModeChange }) => {
  return (
    <View style={styles.container}>
      {/* Botón Zolver Ya (Instant) */}
      <TouchableOpacity
        style={[
          styles.button,
          currentMode === "instant" && styles.activeInstant,
        ]}
        onPress={() => onModeChange("instant")}
        activeOpacity={0.8}>
        <Ionicons
          name="flash"
          size={16}
          color={currentMode === "instant" ? "white" : COLORS.textSecondary}
        />
        <Text
          style={[styles.text, currentMode === "instant" && styles.activeText]}>
          Zolver Ya
        </Text>
      </TouchableOpacity>

      {/* Botón Presupuesto (Quote) */}
      <TouchableOpacity
        style={[styles.button, currentMode === "quote" && styles.activeQuote]}
        onPress={() => onModeChange("quote")}
        activeOpacity={0.8}>
        <Ionicons
          name="document-text"
          size={16}
          color={currentMode === "quote" ? "white" : COLORS.textSecondary}
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
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
    marginTop: 15,
    width: "100%",
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  text: {
    fontWeight: "600",
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  activeText: {
    color: "white",
  },
  // Estilos activos
  activeInstant: {
    backgroundColor: COLORS.primary, // Amarillo Zolver
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeQuote: {
    backgroundColor: COLORS.tertiary, // Verde azulado
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
