import { Alert, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native'
import React, { useState } from 'react'
import { ToolBarTitle } from '@/appCOMP/toolbar/Toolbar'
import { useRouter } from 'expo-router';
import { COLORS, FONTS } from '@/appASSETS/theme';
import AuthInput from '@/appSRC/auth/Screen/AuthInput';
import { LargeButton } from '@/appCOMP/button/LargeButton';
import { useSignOut } from '@/appSRC/auth/Hooks/useSignOut';
import { useAuthStore } from '@/appSRC/auth/Store/AuthStore';
import { CustomPhoneInput } from '@/appSRC/auth/Screen/CustomPhoneInput';
import { usePhoneVerification } from "@/appSRC/auth/Hooks/usePhoneVerification";


const UserBasicInfoScreen = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [phone, setPhone] = useState("");
  const { loading, error, sendCode } = usePhoneVerification();

  const onPressSend = async () => {
    console.log("[UserBasicInfoScreen] Button pressed → sendCode()");
    if (!phone) {
      Alert.alert("Error", "Por favor ingresa un número de teléfono");
      return;
    }

    const res = await sendCode(phone);
    console.log("[UserBasicInfoScreen] sendCode result:", res);

    if (!res.ok) {
      Alert.alert("Error", error ?? "No se pudo enviar el código");
      return;
    }

    console.log("[UserBasicInfoScreen] ✅ OTP enviado correctamente → navegando a VerifyScreen");
    router.push("/(auth)/PhoneVerificationScreen");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Dismiss keyboard when tapping anywhere */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <ToolBarTitle
            titleText="Formulario de usuario"
            showBackButton={true}
            onBackPress={() => router.back()}
          />

          <View style={styles.contentContainer}>
            <View style={styles.infoContainer}>
              <Text style={styles.title}>Email</Text>
              <Text style={styles.subtitle}>{user?.email ?? "Sin email"}</Text>
            </View>

            <CustomPhoneInput value={phone} onChangeText={setPhone} />
          </View>

          <View style={styles.buttonContainer}>
            <LargeButton
              title={loading ? "Enviando..." : "Verificar teléfono"}
              onPress={onPressSend}
              iconName="phone-portrait-outline"
              disabled={loading}
              loading={loading}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};


export default UserBasicInfoScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  buttonContainer: {
    justifyContent: 'center', 
    alignItems: 'center',
    width: '100%',
    paddingBottom: 50,
    paddingHorizontal: 20
  },
  infoContainer: {
    marginBottom: 16,
    width: '100%',
  },
  title: {
    ...FONTS.h3,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  subtitle: {
    ...FONTS.body3,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
});


