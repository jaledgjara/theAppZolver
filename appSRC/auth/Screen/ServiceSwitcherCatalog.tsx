import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/appASSETS/theme"; // Asegúrate que la ruta sea correcta
import { ServiceMode } from "@/appSRC/users/Model/ServiceMode";

interface Props {
  modes: string[];
  isDisabled: boolean;
  onToggle: (mode: ServiceMode) => void;
}

export const ServiceSwitcherCatalog: React.FC<Props> = ({
  modes,
  isDisabled,
  onToggle,
}) => {
  const getModeDescriptionText = () => {
    // 1. CORRECCIÓN: Usamos 'isDisabled' y 'modes' (las props)
    const hasZolverYa = !isDisabled && modes.includes("zolver_ya");
    const hasPresupuesto = modes.includes("presupuesto");

    if (hasZolverYa && hasPresupuesto) {
      return "Ideal para emergencias y trabajos rápidos con tarifas base predefinidas. También para proyectos a medida que requieren evaluación y cotización detallada.";
    }

    if (hasZolverYa) {
      return "Ideal para emergencias y trabajos rápidos. Los clientes te contratan al instante con tarifas base predefinidas.";
    }

    return "Para proyectos a medida que requieren evaluación. Tú envías una cotización detallada al cliente antes de comenzar.";
  };

  return (
    <View>
      <View style={styles.switcherContainer}>
        {/* --- BOTÓN 1: ZOLVER YA --- */}
        <TouchableOpacity
          style={[
            styles.switchButton,
            modes.includes("zolver_ya") && styles.switchButtonActive,
            isDisabled && styles.switchButtonDisabled,
          ]}
          onPress={() => onToggle("zolver_ya")}
          activeOpacity={isDisabled ? 1 : 0.8}>
          {modes.includes("zolver_ya") && (
            <Ionicons
              name="flash"
              size={16}
              color={COLORS.primary}
              style={{ marginRight: 6 }}
            />
          )}
          <Text
            style={[
              styles.switchText,
              modes.includes("zolver_ya") && styles.switchTextActive,
              isDisabled && { color: "#CCC" },
            ]}>
            Zolver Ya
          </Text>
        </TouchableOpacity>

        {/* --- BOTÓN 2: PRESUPUESTO --- */}
        <TouchableOpacity
          style={[
            styles.switchButton,
            modes.includes("presupuesto") && styles.switchButtonActive,
          ]}
          onPress={() => onToggle("presupuesto")}
          activeOpacity={0.8}>
          {modes.includes("presupuesto") && (
            <Ionicons
              name="document-text"
              size={16}
              color={COLORS.primary}
              style={{ marginRight: 6 }}
            />
          )}
          <Text
            style={[
              styles.switchText,
              modes.includes("presupuesto") && styles.switchTextActive,
            ]}>
            Presupuesto
          </Text>
        </TouchableOpacity>
      </View>

      {/* --- DESCRIPCIÓN --- */}
      <View style={styles.infoBox}>
        <Ionicons
          name="information-circle-outline"
          size={22}
          color={COLORS.primary}
        />
        <Text style={styles.infoText}>{getModeDescriptionText()}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  switcherContainer: {
    flexDirection: "row",
    backgroundColor: "#EFEFEF",
    borderRadius: 10,
    padding: 10,
    height: 55,
    marginBottom: 12,
  },
  switchButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
    padding: 10,
  },
  switchButtonActive: {
    marginHorizontal: 5,
    backgroundColor: "#FFFFFF", // O COLORS.white
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  switchButtonDisabled: {
    opacity: 0.5,
  },
  switchText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  switchTextActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#FFFDF5",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 193, 7, 0.2)",
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: "#555",
    lineHeight: 19,
  },
});
