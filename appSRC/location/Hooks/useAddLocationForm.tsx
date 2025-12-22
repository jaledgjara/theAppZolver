import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { useLocationStore } from "../Store/LocationStore";
import { LocationService } from "../Service/LocationService";
import { LOCATION_TYPES } from "../Type/LocationType";

// Recibimos 'origin' para saber quién llama al hook
export function useAddLocationForm(origin: "home" | "profile") {
  const router = useRouter();
  const { user } = useAuthStore();
  const { setActiveAddress } = useLocationStore();

  // Estados del Formulario
  const [selectedType, setSelectedType] = useState("home");
  const [locationName, setLocationName] = useState("Casa"); // Default basado en tipo
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [floor, setFloor] = useState("");
  const [apartment, setApartment] = useState("");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);

  // Lógica UI: Al cambiar tipo, pre-rellenar nombre si el usuario no escribió algo custom
  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    const typeLabel = LOCATION_TYPES.find((t) => t.id === typeId)?.label;
    if (
      typeLabel &&
      (locationName === "Casa" ||
        locationName === "Trabajo" ||
        locationName === "Otro")
    ) {
      setLocationName(typeLabel);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!street || !streetNumber) {
      Alert.alert("Faltan datos", "Por favor ingresa calle y altura.");
      return;
    }

    setLoading(true);
    try {
      // 1. Geocoding (Obtener Lat/Lng de la dirección escrita)
      const searchString = `${street} ${streetNumber}, Mendoza, Argentina`; // Ajustar país/región
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
      const newAddress = await LocationService.addAddress({
        user_id: user.uid,
        label: locationName || "Ubicación",
        address_street: street,
        address_number: streetNumber,
        latitude: finalLat,
        longitude: finalLng,
        is_default: false,
        floor: floor || undefined,
        apartment: apartment || undefined,
        instructions: instructions || undefined,
      });

      if (newAddress) {
        // 🚀 LÓGICA CONDICIONAL CLAVE
        if (origin === "home") {
          // Si estoy en Home, el usuario quiere usar esta dirección YA para pedir
          setActiveAddress(newAddress);
        }
        // Si estoy en Profile, solo la guardo en la lista (no cambio la activa del Home)

        router.back();
      }
    } catch (error: any) {
      Alert.alert("Error", "No se pudo guardar la dirección.");
    } finally {
      setLoading(false);
    }
  };

  return {
    form: {
      selectedType,
      locationName,
      street,
      streetNumber,
      floor,
      apartment,
      instructions,
    },
    setters: {
      setLocationName,
      setStreet,
      setStreetNumber,
      setFloor,
      setApartment,
      setInstructions,
    },
    loading,
    handleTypeSelect,
    handleSave,
  };
}
