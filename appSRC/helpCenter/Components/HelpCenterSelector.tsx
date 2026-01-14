import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES } from "@/appASSETS/theme";
import { LargeButton } from "@/appCOMP/button/LargeButton"; // Usando componente base
import { useHelpCenter } from "../Hooks/useHelpCenter";

export const HelpCenterSelector = () => {
  const [method, setMethod] = useState<"email" | "whatsapp">("email");
  const { contactEmail, copyEmail, openWhatsApp } = useHelpCenter();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Contactanos por:</Text>

      {/* Selectores Estilo Card */}
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.miniCard, method === "email" && styles.activeCard]}
          onPress={() => setMethod("email")}>
          <Ionicons
            name="mail"
            size={24}
            color={method === "email" ? COLORS.primary : COLORS.textSecondary}
          />
          <Text
            style={[styles.cardText, method === "email" && styles.activeText]}>
            Email
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.miniCard, method === "whatsapp" && styles.activeCard]}
          onPress={() => setMethod("whatsapp")}>
          <Ionicons
            name="logo-whatsapp"
            size={24}
            color={
              method === "whatsapp" ? COLORS.primary : COLORS.textSecondary
            }
          />
          <Text
            style={[
              styles.cardText,
              method === "whatsapp" && styles.activeText,
            ]}>
            WhatsApp
          </Text>
        </TouchableOpacity>
      </View>

      {/* Detalle y Acción inferior */}
      <View style={styles.actionContainer}>
        {method === "email" ? (
          <View style={styles.detailBox}>
            <Text style={styles.valueText}>{contactEmail}</Text>
            <TouchableOpacity onPress={copyEmail} style={styles.copyRow}>
              <Ionicons name="copy-outline" size={16} color={COLORS.primary} />
              <Text style={styles.copyText}>Copiar al portapapeles</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <LargeButton
            title="Ir a WhatsApp"
            onPress={openWhatsApp}
            backgroundColor={COLORS.tertiary}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: SIZES.base },
  sectionTitle: {
    ...FONTS.h3,
    marginBottom: 15,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  row: { flexDirection: "row", gap: 12, marginBottom: 10 },
  miniCard: {
    flex: 1,
    padding: 20,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  activeCard: { borderColor: COLORS.primary, backgroundColor: "#FFFBF0" },
  cardText: { ...FONTS.body4, marginTop: 8, color: COLORS.textSecondary },
  activeText: { color: COLORS.primary, fontWeight: "bold" },
  actionContainer: { marginTop: 5 },
  detailBox: {
    alignItems: "center",
    padding: 20,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  valueText: { ...FONTS.h3, color: COLORS.textPrimary, marginBottom: 10 },
  copyRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  copyText: { color: COLORS.primary, fontWeight: "600", fontSize: 14 },
});
