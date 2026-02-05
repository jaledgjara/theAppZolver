import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

/**
 * Hook de Dominio para la gestión de selección de imágenes.
 * Encapsula la lógica nativa de Expo y validaciones de negocio.
 */
export const useMessageImagePicker = (
  onImageSelected: (uri: string) => void
) => {
  const pickImage = async () => {
    // 1. Gestión de Permisos (Hardware Access)
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permisos requeridos",
        "Zolver necesita acceso a la galería para compartir evidencias del trabajo."
      );
      return;
    }

    // 2. Ejecución de la API de Imagen (Configuración MVP)
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7, // Balance entre fidelidad y velocidad de carga (Escalabilidad operativa)
      allowsMultipleSelection: false, // Restricción de selección única
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      onImageSelected(result.assets[0].uri);
    }
  };

  return { pickImage };
};
