import React, { useState, useRef } from "react";
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, ScrollView, Platform } from "react-native";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { usePhoneVerification } from "@/appSRC/auth/Hooks/usePhoneVerification";
import { COLORS } from "@/appASSETS/theme";

export default function PhoneVerificationScreen() {
  const router = useRouter();

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<Array<TextInput | null>>([]);

  const joinedCode = code.join("");

  const { verifyCode, loading } = usePhoneVerification();

  // 🚨 USAMOS EL TELÉFONO TEMPORAL (NO EL USER.phoneNumber)
  const tempPhoneNumber = useAuthStore((s) => s.tempPhoneNumber);

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, "");
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleConfirm = async () => {
    // 🚨 VALIDAR TEMPPHONENUMBER
    if (!tempPhoneNumber) {
      Alert.alert(
        "Error",
        "No hay un teléfono registrado. Intenta nuevamente."
      );
      return;
    }

    if (joinedCode.length !== 6) {
      Alert.alert("Error", "El código debe tener 6 dígitos");
      return;
    }

    await verifyCode(tempPhoneNumber, joinedCode);
  };


  return (
<KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView>
          <ToolBarTitle 
            titleText="Verificación de teléfono" 
            showBackButton
          />

          <View style={styles.contentContainer}>
            <Text style={styles.subtitle}>
              Ingresa el código de 6 dígitos enviado por SMS
            </Text>


            <View style={styles.boxContainer}>
              {code.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(el) => {
                    inputs.current[i] = el;
                  }}
                  value={digit}
                  onChangeText={(t) => handleChange(t, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  style={[styles.input, digit ? styles.inputFilled : null]}
                  textAlign="center"
                  returnKeyType={i === 5 ? "done" : "next"}
                  onSubmitEditing={() => {
                    if (i < 5) inputs.current[i + 1]?.focus();
                    else Keyboard.dismiss();
                  }}
                />
              ))}
            </View>

            <LargeButton
              title={loading ? "Verificando..." : "Verificar teléfono"}
              iconName="phone-portrait-outline"
              onPress={handleConfirm}
              disabled={loading}
              loading={loading}
            />
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingBottom: 50,
    marginTop: 60
  },
  codeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 30,
    textAlign: "center",
    fontWeight: '700'
  },
  boxContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
  },
  input: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 10,
    fontSize: 22,
    fontWeight: "600",
    color: COLORS.primary ?? "#333",
  },
  inputFilled: {
    borderColor: COLORS.primary ?? "#007AFF",
  },
  codePreview: {
    marginTop: 40,
    fontSize: 18,
    color: "#aaa",
    letterSpacing: 2,
  }, 
  error: { color: "red", marginTop: 10 },
});
