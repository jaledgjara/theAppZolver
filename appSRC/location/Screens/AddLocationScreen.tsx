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
import { COLORS, FONTS } from "@/appASSETS/theme";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { LargeButton } from "@/appCOMP/button/LargeButton";

// Imports de Lógica
import { useAddLocationForm } from "@/appSRC/location/Hooks/useAddLocationForm";
import { LOCATION_TYPES } from "../Type/LocationType";

interface Props {
  origin: "home" | "profile";
}

export const AddLocationScreen = ({ origin }: Props) => {
  // 🟢 INYECCIÓN DE DEPENDENCIAS (Con el origin correcto)
  const { form, setters, loading, handleTypeSelect, handleSave } =
    useAddLocationForm(origin);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}>
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
              placeholder="Referencias (Ej: Portón negro, tocar timbre 5)"
              value={form.instructions}
              onChangeText={setters.setInstructions}
              multiline
            />
          </View>
          <View>
            <LargeButton
              title={loading ? "Guardando..." : "Guardar Dirección"}
              onPress={handleSave}
            />
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  scrollContent: { padding: 20 },
  sectionTitle: {
    ...FONTS.h3,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 15,
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
    marginBottom: 10,
  },
});
