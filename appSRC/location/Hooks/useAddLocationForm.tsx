import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { useLocationStore } from "../Store/LocationStore";
import { LocationService } from "../Service/LocationService";

// Definimos los tipos de ubicaciones estáticos aquí o en constantes globales
export const LOCATION_TYPES = [
  { id: "home", label: "Casa", icon: "home-outline" },
  { id: "work", label: "Trabajo", icon: "briefcase-outline" },
  { id: "other", label: "Otro", icon: "location-outline" },
];

export function useAddLocationForm() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { setActiveAddress } = useLocationStore();

  // Estados del Formulario
  const [selectedType, setSelectedType] = useState("home");
  const [locationName, setLocationName] = useState("Casa");
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [floor, setFloor] = useState("");
  const [apartment, setApartment] = useState("");
  const [instructions, setInstructions] = useState("");

  const [loading, setLoading] = useState(false);

  // Lógica de Selección de Tipo
  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    const typeLabel = LOCATION_TYPES.find((t) => t.id === typeId)?.label;
    if (typeLabel && typeLabel !== "Otro") {
      setLocationName(typeLabel);
    } else {
      setLocationName("");
    }
  };

  // Lógica Principal de Guardado
  const handleSave = async () => {
    // 1. Validación
    if (!street || !streetNumber || !user?.uid) {
      Alert.alert("Faltan datos", "Por favor ingresa calle y altura.");
      return;
    }

    setLoading(true);

    try {
      // 2. Geocodificación (Lógica de negocio pura)
      const searchString = `${street} ${streetNumber}, Mendoza, Argentina`;
      console.log("🔍 Geocodificando:", searchString);

      let finalLat = 0;
      let finalLng = 0;

      try {
        const geocodedResults = await Location.geocodeAsync(searchString);
        if (geocodedResults.length > 0) {
          finalLat = geocodedResults[0].latitude;
          finalLng = geocodedResults[0].longitude;
        }
      } catch (geoError) {
        console.warn("⚠️ Error geocoding (usando 0,0)", geoError);
      }

      // 3. Persistencia
      const newAddress = await LocationService.addAddress({
        user_id: user.uid,
        label: locationName || "Ubicación",
        address_street: street,
        address_number: streetNumber,
        floor: floor || null,
        apartment: apartment || null,
        instructions: instructions || null,
        latitude: finalLat,
        longitude: finalLng,
        is_default: false,
      });

      if (newAddress) {
        setActiveAddress(newAddress);
        router.back();
      }
    } catch (error: any) {
      Alert.alert("Error", "No se pudo guardar la dirección.");
    } finally {
      setLoading(false);
    }
  };

  // Retornamos todo lo que la vista necesita
  return {
    // Valores
    form: {
      selectedType,
      locationName,
      street,
      streetNumber,
      floor,
      apartment,
      instructions,
    },
    loading,
    // Setters (para los inputs)
    setters: {
      setLocationName,
      setStreet,
      setStreetNumber,
      setFloor,
      setApartment,
      setInstructions,
    },
    // Acciones
    handleTypeSelect,
    handleSave,
  };
}
