// appSRC/location/Hooks/useLocation.tsx

import { useState, useCallback } from "react";
import { Alert } from "react-native";
import * as Location from "expo-location";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { useLocationStore } from "../Store/LocationStore";
import { LocationService } from "../Service/LocationService";
import { Address, CreateAddressDTO } from "../Type/LocationType";

export function useLocation() {
  const { user } = useAuthStore();
  const { activeAddress, setActiveAddress } = useLocationStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // 1. REFRESH (READ + AUTO-FIX 🛠️)
  // ==========================================
  const refreshAddresses = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      // a. Traer datos frescos de la DB
      const data = await LocationService.fetchUserAddresses(user.uid);
      setAddresses(data);

      // b. AUTOCORRECCIÓN: Si ya hay una dirección activa, verificamos si la versión de la DB es más nueva
      if (activeAddress && activeAddress.id !== "gps_current") {
        const freshVersion = data.find((addr) => addr.id === activeAddress.id);

        // Si la encontramos y las coordenadas son diferentes (o 0,0), forzamos update
        if (freshVersion) {
          const oldLat = activeAddress.coords.lat;
          const newLat = freshVersion.coords.lat;

          if (oldLat !== newLat || (oldLat === 0 && newLat !== 0)) {
            console.log(
              "🔄 [AutoFix] Actualizando dirección activa con coordenadas reales."
            );
            setActiveAddress(freshVersion);
          }
        }
      }

      // c. Si no hay ninguna seleccionada, elegir la default
      if (!activeAddress && data.length > 0) {
        const defaultAddr = data.find((a) => a.is_default) || data[0];
        setActiveAddress(defaultAddr);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, activeAddress, setActiveAddress]);

  // ==========================================
  // 2. ADD NEW ADDRESS
  // ==========================================
  const addNewAddress = async (
    dto: Omit<CreateAddressDTO, "user_id">
  ): Promise<boolean> => {
    if (!user?.uid) return false;
    setLoading(true);
    try {
      const newAddress = await LocationService.addAddress({
        ...dto,
        user_id: user.uid,
      });

      if (newAddress) {
        setAddresses((prev) => [newAddress, ...prev]);
        setActiveAddress(newAddress); // Seleccionar la nueva automáticamente
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 3. SELECT ADDRESS
  // ==========================================
  const selectAddress = (address: Address) => {
    setActiveAddress(address);
  };

  // ==========================================
  // 4. REMOVE ADDRESS (🔥 NEW SWIPE LOGIC)
  // ==========================================
  const removeAddress = async (id: string) => {
    try {
      // 1. Eliminar del servidor
      const success = await LocationService.deleteAddress(id);
      if (!success) throw new Error("Failed to delete");

      // 2. Actualizar UI (Optimistic update)
      setAddresses((prev) => prev.filter((addr) => addr.id !== id));

      // 3. Si la dirección borrada era la activa, limpiarla o ir a GPS
      if (activeAddress?.id === id) {
        setActiveAddress(null);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo eliminar la dirección.");
    }
  };

  // ==========================================
  // 5. USE GPS (CURRENT LOCATION)
  // ==========================================
  const useCurrentLocation = async (): Promise<boolean> => {
    setLoading(true);
    try {
      console.log("📍 Hook: Solicitando GPS Real...");

      // A. Permisos
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Habilita la ubicación en configuración."
        );
        return false;
      }

      // B. Obtener coordenadas
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // C. Reverse Geocoding
      let street = "";
      let streetNumber = "";
      let city = "";
      let province = "Mendoza";

      try {
        const reverse = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (reverse.length > 0) {
          const addr = reverse[0];
          console.log("📍 [GPS] Reverse geocode FULL:", JSON.stringify(addr));

          // Prioridad para la calle:
          //   1. addr.street  — "Besares" (nombre de calle)
          //   2. addr.name    — "Besares 795" (iOS suele poner dirección completa aquí)
          //   3. addr.district — barrio/zona como último recurso
          street = addr.street || addr.name || addr.district || "";
          streetNumber = addr.streetNumber || "";

          // Si street ya incluye el número (ej: "Besares 795"), no duplicar.
          if (streetNumber && street.includes(streetNumber)) {
            streetNumber = "";
          }

          city = addr.city || addr.subregion || "";
          province = addr.region || "Mendoza";

          console.log(
            `📍 [GPS] Parsed → street: "${street}", number: "${streetNumber}", city: "${city}", province: "${province}"`
          );
        }
      } catch (e) {
        console.warn("No se pudo obtener nombre de calle, usando coords");
      }

      // D. Construir label legible: "Calle 123, Ciudad, Provincia"
      const streetFull = streetNumber
        ? `${street} ${streetNumber}`
        : street;
      const parts = [streetFull, city, province].filter(Boolean);
      const label = parts.length > 0 ? parts.join(", ") : "Ubicación actual";

      // E. Crear Dirección "Virtual"
      //    address_street solo lleva la calle (sin ciudad ni provincia),
      //    porque el formato final se arma en la UI con city + province.
      const gpsAddress: Address = {
        id: "gps_current",
        user_id: user?.uid || "guest",
        label: "Ubicación actual",
        address_street: street,
        address_number: streetNumber,
        city: city || null,
        province: province,
        coords: {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        },
        is_default: false,
      };

      // F. Actualizar el Store Global
      setActiveAddress(gpsAddress);
      return true;
    } catch (err: any) {
      console.error("Error GPS:", err);
      Alert.alert("Error", "No se pudo obtener tu ubicación.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    addresses,
    activeAddress,
    loading,
    error,
    refreshAddresses,
    addNewAddress,
    selectAddress,
    removeAddress, // 👈 Exported for swipe delete
    useCurrentLocation,
  };
}
