// app/(auth)/FormProfessionalOne.tsx
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";

// Componentes
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { LargeButton } from "@/appCOMP/button/LargeButton";

// Hooks y Theme
import { COLORS, FONTS } from "@/appASSETS/theme";
import { useImagePicker } from "@/appCOMP/images/Hooks/useImagePicker";
import { CustomPickerImageInput } from "@/appSRC/auth/Screen/CustomPickerImageInput";

const FormProfessionalOne = () => {
  const router = useRouter();

  // 1. Instancias independientes del hook para cada documento
  const pickerFrente = useImagePicker();
  const pickerDorso = useImagePicker();
  const pickerSelfie = useImagePicker();

  // 2. Validación: Todos deben tener una imagen cargada
  const isFormValid = !!pickerFrente && !!pickerDorso && !!pickerSelfie;

  // 3. Loading general si alguno está procesando
  const isLoading =
    pickerFrente.isLoading || pickerDorso.isLoading || pickerSelfie.isLoading;

  const handleContinue = () => {
    console.log("Datos validados:", {
      frente: pickerFrente,
      dorso: pickerDorso,
      selfie: pickerSelfie,
    });

    router.push("/(auth)/FormProfessionalTwo");
  };

  return (
    <View style={styles.container}>
      <ToolBarTitle
        titleText="Verificación de Identidad"
        showBackButton={true}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* SECCIÓN SUPERIOR: Textos e Inputs */}
        <View>
          <View style={styles.header}>
            <Text style={styles.sectionSubtitle}>
              Para garantizar la seguridad de la comunidad, necesitamos validar
              tu identidad.
            </Text>
          </View>

          {/* FRENTE DNI */}
          <CustomPickerImageInput
            title="Frente del DNI"
            subtitle="Asegúrate de que la foto sea nítida."
            iconTitle="id-card-outline"
            // CORRECCIÓN: Verificar .image
            isUploaded={!!pickerFrente.image}
            onPress={pickerFrente.pickImage}
          />

          {/* DORSO DNI */}
          <CustomPickerImageInput
            title="Dorso del DNI"
            subtitle="Necesitamos ver la parte trasera."
            iconTitle="card-outline"
            // CORRECCIÓN: Verificar .image
            isUploaded={!!pickerDorso.image}
            onPress={pickerDorso.pickImage}
          />

          {/* SELFIE */}
          <CustomPickerImageInput
            title="Selfie con DNI"
            subtitle="Sostén tu DNI al lado de tu cara."
            iconTitle="camera-outline"
            // CORRECCIÓN: Usar pickerSelfie y verificar .image
            isUploaded={!!pickerDorso.image}
            onPress={pickerDorso.pickImage}
          />
        </View>

        {/* SECCIÓN INFERIOR: Botón (Empujado al fondo) */}
        <View style={styles.footer}>
          <LargeButton
            title="CONTINUAR"
            onPress={handleContinue}
            iconName="shield-checkmark-outline"
            loading={isLoading}
            disabled={!isFormValid}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default FormProfessionalOne;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollContent: {
    flexGrow: 1, // Permite que el contenido ocupe todo el alto disponible
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  sectionSubtitle: {
    padding: 20,
    ...FONTS.h3,
    color: COLORS.textSecondary,
    lineHeight: 20,
    fontWeight: "600",
  },
  footer: {
    marginTop: "auto", // Esto empuja el botón hacia el final del ScrollView
    paddingTop: 20,
  },
});
