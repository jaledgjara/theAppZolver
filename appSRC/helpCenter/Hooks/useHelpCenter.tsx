import * as Clipboard from "expo-clipboard";
import { Linking, Alert } from "react-native";

export const useHelpCenter = () => {
  const contactEmail = "soporte@zolver.com";
  const contactPhone = "+5491123456789";

  const copyEmail = async () => {
    await Clipboard.setStringAsync(contactEmail);
    Alert.alert("Copiado", "Correo copiado al portapapeles.");
  };

  const openWhatsApp = async () => {
    const url = `whatsapp://send?phone=${contactPhone}&text=Hola Zolver, necesito ayuda.`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "WhatsApp no está instalado.");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo abrir WhatsApp.");
    }
  };

  return { contactEmail, contactPhone, copyEmail, openWhatsApp };
};
