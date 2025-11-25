import { useState } from "react";
import { Alert, Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";

export const useImagePicker = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Manejo robusto de permisos
  const verifyPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permisos insuficientes",
        "Necesitamos acceso a tu galería para subir el documento.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Ir a Configuración", onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }
    return true;
  };

  const verifyCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso denegado",
        "Necesitamos usar la cámara para verificar tu identidad."
      );
      return false;
    }
    return true;
  };

  // Función para abrir Galería
  const pickImage = async () => {
    const hasPermission = await verifyPermissions();
    if (!hasPermission) return;

    try {
      setIsLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // UX: Permite recortar
        aspect: [4, 3],
        quality: 0.5, // Performance: Comprimir antes de subir a Supabase
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        return result.assets[0].uri;
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "No se pudo seleccionar la imagen.");
    } finally {
      setIsLoading(false);
    }
  };

  // Función para abrir Cámara
  const takePhoto = async () => {
    const hasPermission = await verifyCameraPermissions();
    if (!hasPermission) return;

    try {
      setIsLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        return result.assets[0].uri;
      }
    } catch (error) {
      console.error("Error taking photo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    image,
    pickImage,
    takePhoto,
    isLoading,
  };
};
