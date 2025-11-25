import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { useRouter } from "expo-router";
import CustomPickerImageInput from "@/appSRC/auth/Screen/CustomPickerImageInput";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { COLORS, SIZES } from "@/appASSETS/theme";
import { useImagePicker } from "@/appCOMP/images/Hooks/useImagePicker";
import { useSignOut } from "@/appSRC/auth/Hooks/useSignOut";
import { auth } from "@/APIconfig/firebaseAPIConfig";

const FormProfessionalOne = () => {
  const router = useRouter();
  const signOut = useSignOut();

  const pickerFrente = useImagePicker();
  const pickerDorso = useImagePicker();
  const pickerSelfie = useImagePicker();

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText={"Verificación DNI"} showBackButton={true} />
      <View style={styles.contentContainer}>
        <Text style={styles.subtitle}>
          Para proteger tu cuenta y la seguridad de nuestra comunidad...
        </Text>
        <View>
          {/* FRENTE */}
          <CustomPickerImageInput
            title="Frente del DNI"
            subtittle="Asegúrate de que la foto sea nítida."
            iconTitle="id-card-sharp"
            // Lógica visual: Cambiar ícono si ya hay imagen
            iconResultUpload={
              pickerFrente.image ? "checkmark-circle" : "circle-xmark"
            }
            color={pickerFrente.image ? "green" : "red"}
            // Acción al presionar
            onPress={pickerFrente.pickImage}
          />

          {/* DORSO */}
          <CustomPickerImageInput
            title="Dorso del DNI:"
            subtittle="Necesitamos ver la parte trasera."
            iconTitle="camera-reverse-outline"
            iconResultUpload={
              pickerDorso.image ? "checkmark-circle" : "circle-xmark"
            }
            color={pickerDorso.image ? "green" : "red"}
            onPress={pickerDorso.pickImage}
          />

          {/* SELFIE (Usamos la cámara para este) */}
          <CustomPickerImageInput
            title="Selfie sosteniendo tu DNI:"
            subtittle="Sostén tu DNI al lado de tu cara. "
            iconTitle="person-add-outline"
            iconResultUpload={
              pickerSelfie.image ? "checkmark-circle" : "circle-xmark"
            }
            color={pickerSelfie.image ? "green" : "red"}
            onPress={pickerSelfie.takePhoto} // Usamos takePhoto aquí
          />

          <View style={styles.buttonContainer}>
            <LargeButton
              title="Verificar identidad"
              onPress={() => router.push("(auth)/FormProfessionalTwo")}
              iconName="id-card"
              // Deshabilitar si está cargando
              loading={pickerFrente.isLoading || pickerSelfie.isLoading}
            />
          </View>
        </View>
      </View>
    </View>
  );
};
export default FormProfessionalOne;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  pickerContainer: {
    marginTop: 20,
  },
  subtitle: {
    fontSize: SIZES.h2,
    fontWeight: "bold",
    textAlign: "center",
    color: COLORS.textSecondary,
    marginTop: 50,
  },
  buttonContainer: {
    alignItems: "center",
    paddingBottom: 55,
    width: "100%",
  },
});
