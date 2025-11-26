import { useState } from "react";
import { Alert, Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";

export const useImagePicker = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- Helpers de Permisos (Reutilizables internamente) ---
  const verifyMediaPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permisos insuficientes",
        "Necesitamos acceso a tu galería.",
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
      Alert.alert("Permisos insuficientes", "Necesitamos acceso a tu cámara.", [
        { text: "Cancelar", style: "cancel" },
        { text: "Ir a Configuración", onPress: () => Linking.openSettings() },
      ]);
      return false;
    }
    return true;
  };

  // --- Acciones Mejoradas ---

  // 🆕 CAMBIO: Ahora retorna Promise<string | null>
  const pickImage = async (): Promise<string | null> => {
    const hasPermission = await verifyMediaPermissions();
    if (!hasPermission) return null;

    try {
      setIsLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setImage(uri); // Mantiene comportamiento original
        return uri; // ✅ NUEVO: Retorna la URI para usar en arrays
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "No se pudo seleccionar la imagen.");
    } finally {
      setIsLoading(false);
    }
    return null;
  };

  // 🆕 CAMBIO: Ahora retorna Promise<string | null>
  const takePhoto = async (): Promise<string | null> => {
    const hasPermission = await verifyCameraPermissions();
    if (!hasPermission) return null;

    try {
      setIsLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setImage(uri);
        return uri; // ✅ NUEVO
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "No se pudo tomar la foto.");
    } finally {
      setIsLoading(false);
    }
    return null;
  };

  return {
    image,
    pickImage,
    takePhoto,
    isLoading,
  };
};
