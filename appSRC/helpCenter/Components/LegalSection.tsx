import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES } from "@/appASSETS/theme"; // Importamos tokens de diseño
import { LEGAL_SECTION_TYPE } from "../Type/LegalSectionType";
import { HelpCenterProps } from "../Type/HelpCenterType";
import { router } from "expo-router";

export const LegalSection = ({ mode }: HelpCenterProps) => {
  const handlePress = (id: string) => {
    const subRoute = id === "terms" ? "terms-conditions" : "privacy-policy";

    const url = `(${mode})/(tabs)/profile/${subRoute}`;

    console.log(`[Zolver Navigation] Navigating to: ${url}`);

    router.push(url as any);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Legal</Text>

      {/* Mapeo de links usando el estilo de burbuja/card */}
      {LEGAL_SECTION_TYPE.links.map((link) => (
        <TouchableOpacity
          key={link.id}
          style={styles.cardBubble} // Estilo igual al FAQ
          onPress={() => handlePress(link.id)}
          activeOpacity={0.7}>
          <View style={styles.leftContent}>
            <Ionicons
              name={link.icon as any}
              size={20}
              color={COLORS.textSecondary} // Color estándar de texto OFF
            />
            <Text style={styles.linkText}>{link.title}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.border} />
        </TouchableOpacity>
      ))}

      {/* Footer de versión */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>
          Versión {LEGAL_SECTION_TYPE.version}
        </Text>
        <Text style={styles.buildText}>Build {LEGAL_SECTION_TYPE.build}</Text>
        <Text style={styles.copyrightText}>
          © 2026 Zolver. Todos los derechos reservados.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    ...FONTS.h3,
    marginBottom: 15,
    color: COLORS.textSecondary,
    fontWeight: "700",
  },
  cardBubble: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.backgroundLight, // Blanco roto
    borderRadius: SIZES.radius, // 12px
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border, // Borde sutil
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  linkText: {
    ...FONTS.body4, // Roboto-Regular 14px
    color: COLORS.textPrimary,
  },
  versionContainer: {
    marginTop: 30,
    alignItems: "center",
    paddingBottom: 40,
  },
  versionText: {
    ...FONTS.body4,
    color: COLORS.textSecondary,
    fontWeight: "bold",
  },
  buildText: {
    fontSize: 10,
    color: COLORS.border,
    marginTop: 2,
  },
  copyrightText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 10,
    opacity: 0.6,
  },
});
