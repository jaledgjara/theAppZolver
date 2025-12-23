import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Componentes Reutilizables
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { COLORS, FONTS, SIZES } from "@/appASSETS/theme";
import { useClientProfile } from "@/appSRC/users/Client/Hooks/useClientProfile";

// Lógica de Negocio (Hook)

export default function PrivacyScreen() {
  // Inyección del Hook
  const {
    userData,
    setLegalName,
    handleSave,
    handleLockedFieldPress,
    loading,
  } = useClientProfile();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}>
      <ToolBarTitle titleText="Datos Personales" showBackButton={true} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* 1. SECCIÓN AVATAR DINÁMICO */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{userData.initials}</Text>
          </View>
        </View>

        {/* 2. SECCIÓN EDITABLE */}
        <Text style={styles.sectionTitle}>Información pública</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre Legal</Text>
          <View style={styles.editableInputContainer}>
            <TextInput
              style={styles.input}
              value={userData.displayName}
              onChangeText={setLegalName}
              placeholder="Tu nombre completo"
              autoCapitalize="words"
            />
            <Ionicons
              name="pencil"
              size={16}
              color={COLORS.primary}
              style={styles.editIcon}
            />
          </View>
          <Text style={styles.helperText}>
            Visible para los profesionales al reservar.
          </Text>
        </View>

        {/* 3. SECCIÓN BLOQUEADA */}
        <Text style={styles.sectionTitle}>Seguridad (No editable)</Text>

        {/* Email */}
        <TouchableOpacity
          onPress={() => handleLockedFieldPress("Email")}
          activeOpacity={0.7}>
          <View style={[styles.inputGroup, styles.lockedGroup]}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <View style={styles.lockedInput}>
              <Text style={styles.lockedText}>{userData.email}</Text>
              <Ionicons name="lock-closed" size={16} color="#999" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Teléfono */}
        <TouchableOpacity
          onPress={() => handleLockedFieldPress("Teléfono")}
          activeOpacity={0.7}>
          <View style={[styles.inputGroup, styles.lockedGroup]}>
            <Text style={styles.label}>Teléfono</Text>
            <View style={styles.lockedInput}>
              <Text style={styles.lockedText}>
                {userData.phone || "No verificado"}
              </Text>
              <Ionicons name="lock-closed" size={16} color="#999" />
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <LargeButton
          title={loading ? "Guardando..." : "Guardar Cambios"}
          onPress={handleSave}
          // disabled={loading} // Si el componente lo soporta
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  scroll: { padding: 20 },

  // Avatar
  avatarSection: { alignItems: "center", marginBottom: 30, marginTop: 10 },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    // Shadow
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
  avatarLabel: { fontSize: SIZES.body4, color: COLORS.textSecondary },

  // Forms
  sectionTitle: {
    fontSize: SIZES.h3,
    color: COLORS.textSecondary,
    marginBottom: 15,
    marginTop: 10,
    letterSpacing: 1,
    fontWeight: "600",
  },
  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: SIZES.h4,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },

  // Editable Input
  editableInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    backgroundColor: "#FFF",
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: "#333",
  },
  editIcon: { marginRight: 15 },
  helperText: {
    fontSize: SIZES.body4,
    color: COLORS.textSecondary,
    marginTop: 5,
    marginLeft: 5,
  },

  // Locked Input
  lockedGroup: { opacity: 0.8 },
  lockedInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  lockedText: { fontSize: 16, color: "#666" },

  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#EEE",
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
  },
});
