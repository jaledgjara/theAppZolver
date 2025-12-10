import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React, { useState } from "react";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { useRouter } from "expo-router";
import { COLORS, FONTS } from "@/appASSETS/theme";
import AuthInput from "@/appSRC/auth/Screen/AuthInput";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { useSignOut } from "@/appSRC/auth/Hooks/useSignOut";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { CustomPhoneInput } from "@/appSRC/auth/Screen/CustomPhoneInput";
import { usePhoneVerification } from "@/appSRC/auth/Hooks/usePhoneVerification";
import { auth } from "@/APIconfig/firebaseAPIConfig";
// 👇 IMPORTANTE: Traemos el servicio para guardar el nombre
import { updateUserLegalName } from "@/appSRC/auth/Service/SupabaseAuthService";

const UserBasicInfoScreen = () => {
  const router = useRouter();

  // Global state
  const user = useAuthStore((state) => state.user);
  const setTempPhoneNumber = useAuthStore((state) => state.setTempPhoneNumber);

  // 1. 👇 REVISAR SI YA TIENE NOMBRE
  // Si user.legalName existe y no está vacío, asumimos que ya lo tenemos.
  const hasLegalName = !!user?.legalName && user.legalName.trim().length > 0;

  // Local state
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Services
  const { sendCode } = usePhoneVerification();
  const { handleSignOut } = useSignOut();

  // ------------------------------------------------------
  // 🟢 VALIDACIÓN DINÁMICA
  // ------------------------------------------------------
  // Si YA tiene nombre, solo validamos el teléfono.
  // Si NO tiene nombre, validamos nombre Y teléfono.
  const isFormValid = hasLegalName
    ? phone.trim().length > 0
    : name.trim().length > 0 && phone.trim().length > 0;

  // -------------------------------
  // HANDLE GO BACK
  // -------------------------------
  const handleGoBack = async () => {
    await handleSignOut();
  };

  // -------------------------------
  // LOGIC: CONDITIONALLY UPDATE NAME -> SEND SMS
  // -------------------------------
  const handleContinue = async () => {
    Keyboard.dismiss();

    if (!isFormValid) return;

    try {
      setIsSubmitting(true);

      // 2. 👇 SOLO GUARDAR NOMBRE SI NO LO TIENE
      if (!hasLegalName) {
        console.log("📝 Guardando nombre legal nuevo:", name);
        await updateUserLegalName(name.trim());
      } else {
        console.log(
          "✅ Nombre ya existe:",
          user?.legalName,
          "-> Saltando guardado."
        );
      }

      // 3. Enviar Código SMS (Siempre)
      console.log("📨 Enviando código SMS al:", phone);
      const res = await sendCode(phone);

      if (!res.ok) {
        throw new Error(res.ok || "No se pudo enviar el código SMS.");
      }

      // 4. Guardar temporalmente y Navegar
      setTempPhoneNumber(phone);
      router.push("/(auth)/PhoneVerificationScreen");
    } catch (error: any) {
      console.error("❌ Error:", error.message);
      Alert.alert("Ocurrió un error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <ToolBarTitle
            titleText="Completa tu perfil"
            showBackButton={true}
            onBackPress={handleGoBack}
          />

          <View style={styles.contentContainer}>
            {/* Información del Email */}
            <View style={styles.infoContainer}>
              <Text style={styles.title}>Email vinculado</Text>
              <Text style={styles.subtitle}>{user?.email ?? "Sin email"}</Text>
            </View>

            {/* Input de Nombre (CORREGIDO) */}
            <AuthInput
              label="Nombre y Apellido"
              placeholder="Ej: Jaled Jara"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              iconName="rename"
            />

            {/* Input de Teléfono */}
            <View style={{ marginTop: 20 }}>
              <CustomPhoneInput value={phone} onChangeText={setPhone} />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <LargeButton
              title={isSubmitting ? "Procesando..." : "Continuar"}
              onPress={handleContinue}
              iconName="arrow-forward-outline"
              loading={isSubmitting}
              disabled={isSubmitting || !isFormValid}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default UserBasicInfoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "flex-start",
    paddingTop: 30,
  },
  buttonContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  infoContainer: {
    marginBottom: 24,
    width: "100%",
  },
  title: {
    ...FONTS.h3,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  subtitle: {
    ...FONTS.body3,
    fontWeight: "600",
    color: "black", // Resaltamos el email
  },
});
