import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { COLORS, SIZES } from "@/appASSETS/theme";
import { useUserProfile } from "@/appSRC/users/Client/Hooks/useClientProfile";
import { DataBox } from "@/appCOMP/inputs/Screens/DataBox";
import { TypeDataProps } from "../Model/UserDataType";

export default function PrivacyScreen() {
  const { userData, handleNameEditPress, handleLockedFieldPress } =
    useUserProfile();

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Datos Personales" showBackButton={true} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* 1. SECCIÓN AVATAR */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{userData.initials}</Text>
          </View>
        </View>

        {/* 2. SECCIÓN IDENTIDAD (Única sección) */}
        <Text style={styles.sectionTitle}>Identidad</Text>

        <DataBox
          label="Nombre Legal"
          value={userData.displayName}
          iconName="shield-checkmark"
          iconColor={COLORS.tertiary}
          onPress={handleNameEditPress}
        />

        <DataBox
          label="Correo Electrónico"
          value={userData.email || "No disponible"}
          iconName="shield-checkmark"
          iconColor={COLORS.tertiary}
          onPress={() => handleLockedFieldPress}
        />

        <DataBox
          label="Teléfono"
          value={userData.phone || "No disponible"}
          iconName="shield-checkmark"
          iconColor={COLORS.tertiary}
          onPress={() => handleLockedFieldPress}
        />
        <Text style={styles.footerNote}>
          Tu cuenta está protegida por políticas de seguridad de identidad.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  scroll: { paddingHorizontal: 20, marginTop: 20 },
  avatarSection: { alignItems: "center", marginBottom: 30, marginTop: 10 },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  avatarText: {
    fontSize: SIZES.h1,
    fontWeight: "bold",
    color: COLORS.tertiary,
  },
  sectionTitle: {
    fontSize: SIZES.h3,
    color: COLORS.textSecondary,
    marginBottom: 15,
    marginTop: 10,
    fontWeight: "600",
  },
  footer: {
    borderTopWidth: 1,
    borderColor: "#EEE",
    paddingBottom: 30,
  },
  footerNote: {
    fontSize: SIZES.radius,
    textAlign: "center",
    marginTop: 20,
    color: COLORS.textSecondary,
  },
});
