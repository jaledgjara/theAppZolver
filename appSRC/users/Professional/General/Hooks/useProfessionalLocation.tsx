// appSRC/users/Professional/General/Hooks/useProfessionalLocation.tsx
import { useState } from "react";
import { Alert } from "react-native";
import * as Location from "expo-location";
import { ProfessionalDataService } from "../Service/ProfessionalDataService";
import { useRouter } from "expo-router";

export const useProfessionalLocation = (userId: string) => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const router = useRouter();

  const fetchSavedLocation = async () => {
    console.log("🧠 [HOOK] fetchSavedLocation ejecutado");
    setLoading(true);
    try {
      const data = await ProfessionalDataService.fetchLocationConfig(userId);
      if (data?.base_lat && data?.base_lng) {
        const result = {
          coords: { latitude: data.base_lat, longitude: data.base_lng },
          radius: data.coverage_radius_km || 10,
        };
        console.log("🧠 [HOOK] Datos mapeados para UI:", result);
        return result;
      }
      console.log("🧠 [HOOK] No había coordenadas previas guardadas");
    } catch (e) {
      console.error("🔥 [HOOK] Error en fetchSavedLocation:", e);
    } finally {
      setLoading(false);
    }
    return null;
  };

  const getCurrentLocation = async () => {
    console.log("🧠 [HOOK] getCurrentLocation (GPS) solicitado");
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log("🧠 [HOOK] Permisos GPS status:", status);
      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Zolver necesita acceso a tu ubicación."
        );
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const result = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      console.log("🧠 [HOOK] Ubicación GPS obtenida:", result);
      return result;
    } catch (error) {
      console.error("🔥 [HOOK] Error obteniendo GPS:", error);
      Alert.alert("Error", "No se pudo obtener la ubicación actual.");
      return null;
    } finally {
      setLoadingLocation(false);
    }
  };

  const saveLocation = async (region: any, radius: number) => {
    console.log(
      "🧠 [HOOK] saveLocation disparado con region:",
      region,
      "radius:",
      radius
    );
    setIsSaving(true);
    try {
      await ProfessionalDataService.updateLocationConfig(
        userId,
        { latitude: region.latitude, longitude: region.longitude },
        radius
      );
      console.log("🧠 [HOOK] Guardado completado con éxito");
      Alert.alert("¡Éxito!", "Zona de cobertura actualizada.");
      router.back();
    } catch (error: any) {
      console.error("🔥 [HOOK] Error en saveLocation:", error);
      Alert.alert("Error de Seguridad", "No se pudo validar tu identidad.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    saveLocation,
    fetchSavedLocation,
    getCurrentLocation,
    loading,
    isSaving,
    loadingLocation,
  };
};
