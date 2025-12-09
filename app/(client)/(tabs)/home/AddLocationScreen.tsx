import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "@/appASSETS/theme";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { LargeButton } from "@/appCOMP/button/LargeButton";

// Imports de Lógica
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { LocationService } from "@/appSRC/location/Service/LocationService";
import { useLocationStore } from "@/appSRC/location/Store/LocationStore";
import { useAddLocationForm } from "@/appSRC/location/Hooks/useAddLocationForm";

const LOCATION_TYPES = [
  { id: "home", label: "Casa", icon: "home-outline" },
  { id: "work", label: "Trabajo", icon: "briefcase-outline" },
  { id: "other", label: "Otro", icon: "location-outline" },
];

const AddLocationScreen = () => {
  // 🟢 INYECCIÓN DE DEPENDENCIAS (HOOK)
  const { form, setters, loading, handleTypeSelect, handleSave } =
    useAddLocationForm();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}>
      <View style={styles.container}>
        <ToolBarTitle titleText="Nueva Dirección" showBackButton={true} />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Selector de Tipos */}
          <View style={styles.typesContainer}>
            {LOCATION_TYPES.map((type) => {
              const isSelected = form.selectedType === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeButton,
                    isSelected && styles.typeButtonSelected,
                  ]}
                  onPress={() => handleTypeSelect(type.id)}>
                  <Ionicons
                    name={type.icon as any}
                    size={24}
                    color={isSelected ? COLORS.primary : "#666"}
                  />
                  <Text
                    style={[
                      styles.typeText,
                      isSelected && styles.typeTextSelected,
                    ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>Nombre de la ubicación</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Casa, Trabajo..."
            value={form.locationName}
            onChangeText={setters.setLocationName}
            placeholderTextColor="#999"
          />

          <Text style={styles.sectionTitle}>Dirección exacta</Text>
          <View style={{ gap: 10 }}>
            {/* Calle y Altura */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TextInput
                style={[styles.input, { flex: 2 }]}
                placeholder="Calle"
                value={form.street}
                onChangeText={setters.setStreet}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Altura"
                value={form.streetNumber}
                onChangeText={setters.setStreetNumber}
                keyboardType="numeric"
              />
            </View>

            {/* Piso y Depto */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Piso (Opc.)"
                value={form.floor}
                onChangeText={setters.setFloor}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Depto (Opc.)"
                value={form.apartment}
                onChangeText={setters.setApartment}
              />
            </View>

            {/* Referencias */}
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: "top" }]}
              placeholder="Referencias..."
              value={form.instructions}
              onChangeText={setters.setInstructions}
              multiline
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <LargeButton
            title={loading ? "Guardando..." : "Guardar Dirección"}
            onPress={handleSave}
            loading={loading}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};
export default AddLocationScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  scrollContent: { padding: 20 },
  sectionTitle: {
    ...FONTS.h3,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  typesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  typeButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    backgroundColor: "#FAFAFA",
  },
  typeButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#FFFBF0",
  },
  typeText: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  typeTextSelected: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
    color: "#333",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#F0F0F0",
  },
});
