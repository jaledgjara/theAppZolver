import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/appASSETS/theme"; // Asegúrate que la ruta sea correcta
import { ServiceMode } from "@/appSRC/users/Model/ServiceMode";

interface Props {
  modes: string[]; // ['instant'] | ['quote'] | ['instant', 'quote']
  isDisabled?: boolean;
  onToggle: (mode: "instant" | "quote") => void;
}

export const ServiceSwitcherCatalog: React.FC<Props> = ({
  modes,
  isDisabled,
  onToggle,
}) => {
  const getModeDescriptionText = () => {
    const hasInstant = modes.includes("instant");
    const hasQuote = modes.includes("quote");

    if (hasInstant && hasQuote) {
      return "Ideal para emergencias con tarifas base y proyectos a medida que requieren una cotización detallada previa.";
    }
    if (hasInstant) {
      return "Los clientes te contratan al instante para emergencias o tareas rápidas con tarifas predefinidas.";
    }
    return "Recibes solicitudes detalladas, evalúas el trabajo y envías tu presupuesto antes de ser contratado.";
  };

  return (
    <View>
      <View style={styles.switcherContainer}>
        {/* BOTÓN: ZOLVER YA (INSTANT) */}
        <TouchableOpacity
          style={[
            styles.switchButton,
            modes.includes("instant") && styles.switchButtonActive,
            isDisabled && styles.switchButtonDisabled,
          ]}
          onPress={() => !isDisabled && onToggle("instant")}
          activeOpacity={isDisabled ? 1 : 0.8}>
          {modes.includes("instant") && (
            <Ionicons
              name="flash"
              size={16}
              color={COLORS.primary}
              style={styles.icon}
            />
          )}
          <Text
            style={[
              styles.switchText,
              modes.includes("instant") && styles.switchTextActive,
              isDisabled && { color: "#CCC" },
            ]}>
            Zolver Ya
          </Text>
        </TouchableOpacity>

        {/* BOTÓN: PRESUPUESTO (QUOTE) */}
        <TouchableOpacity
          style={[
            styles.switchButton,
            modes.includes("quote") && styles.switchButtonActive,
          ]}
          onPress={() => onToggle("quote")}
          activeOpacity={0.8}>
          {modes.includes("quote") && (
            <Ionicons
              name="document-text"
              size={16}
              color={COLORS.primary}
              style={styles.icon}
            />
          )}
          <Text
            style={[
              styles.switchText,
              modes.includes("quote") && styles.switchTextActive,
            ]}>
            Presupuesto
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Ionicons
          name="information-circle-outline"
          size={20}
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
    marginBottom: 20,
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
  icon: { marginRight: 6 },
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
