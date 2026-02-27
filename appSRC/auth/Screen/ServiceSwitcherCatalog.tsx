import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/appASSETS/theme";
import { ProfessionalTypeWork } from "@/appSRC/auth/Type/ProfessionalAuthUser";

interface Props {
  typeWork: ProfessionalTypeWork;
  isDisabled?: boolean;
  allowHybrid?: boolean;
  onSelect: (mode: ProfessionalTypeWork) => void;
}

export const ServiceSwitcherCatalog: React.FC<Props> = ({
  typeWork,
  isDisabled,
  allowHybrid = false,
  onSelect,
}) => {
  const isInstant = typeWork === "instant" || typeWork === "hybrid";
  const isQuote = typeWork === "quote" || typeWork === "hybrid";

  const handleInstantPress = () => {
    if (isDisabled) return;
    if (allowHybrid) {
      // Toggle instant on/off. If quote is also on, result is hybrid or quote-only.
      if (isInstant && isQuote) onSelect("quote");       // was hybrid → remove instant
      else if (isInstant) return;                          // can't deselect both
      else onSelect(isQuote ? "hybrid" : "instant");       // add instant
    } else {
      onSelect("instant");
    }
  };

  const handleQuotePress = () => {
    if (allowHybrid) {
      // Toggle quote on/off. If instant is also on, result is hybrid or instant-only.
      if (isQuote && isInstant) onSelect("instant");      // was hybrid → remove quote
      else if (isQuote) return;                             // can't deselect both
      else onSelect(isInstant ? "hybrid" : "quote");       // add quote
    } else {
      onSelect("quote");
    }
  };

  const getModeDescriptionText = () => {
    if (typeWork === "hybrid") {
      return "Ideal para emergencias con tarifas base y proyectos a medida que requieren una cotización detallada previa.";
    }
    if (typeWork === "instant") {
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
            isInstant && styles.switchButtonActive,
            isDisabled && styles.switchButtonDisabled,
          ]}
          onPress={handleInstantPress}
          activeOpacity={isDisabled ? 1 : 0.8}>
          {isInstant && (
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
              isInstant && styles.switchTextActive,
              isDisabled && { color: "#CCC" },
            ]}>
            Zolver Ya
          </Text>
        </TouchableOpacity>

        {/* BOTÓN: PRESUPUESTO (QUOTE) */}
        <TouchableOpacity
          style={[
            styles.switchButton,
            isQuote && styles.switchButtonActive,
          ]}
          onPress={handleQuotePress}
          activeOpacity={0.8}>
          {isQuote && (
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
              isQuote && styles.switchTextActive,
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
    backgroundColor: "#FFFFFF",
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
