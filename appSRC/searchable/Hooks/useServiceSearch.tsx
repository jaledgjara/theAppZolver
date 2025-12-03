import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/appSRC/services/supabaseClient";
import * as Location from "expo-location";
import { ServiceResult } from "../Type/LocationType";

export function useServiceSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ServiceResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Estado para la ubicación del usuario
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // 1. Al montar el hook, intentamos obtener la ubicación del usuario
  // Esto es vital para el filtro de distancia
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.log(
            "Permiso de ubicación denegado - La búsqueda funcionará sin distancia"
          );
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        console.log("📍 Ubicación usuario detectada:", location.coords);
        setUserLocation({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });
      } catch (e) {
        console.error("Error obteniendo ubicación:", e);
      }
    })();
  }, []);

  // 2. Función de búsqueda inteligente
  const search = useCallback(
    async (text: string) => {
      setQuery(text);
      setLoading(true);

      try {
        // Calculamos "AHORA" para filtrar disponibilidad
        const now = new Date();
        const currentDay = now.getDay(); // 0 (Domingo) a 6 (Sábado)
        // Formato HH:MM para comparar con tu JSON
        const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;

        console.log(
          `🔎 Buscando: "${text}" | Día: ${currentDay} | Hora: ${currentTime}`
        );

        const { data, error } = await supabase.rpc("search_services", {
          search_term: text,

          // Pasamos la ubicación real (o null si no la tenemos aún)
          user_lat: userLocation?.lat || null,
          user_long: userLocation?.lng || null,

          // Pasamos el contexto temporal para filtrar "Abierto Ahora"
          filter_day: currentDay,
          filter_time: currentTime,

          page_number: 1,
          page_size: 20,
        });

        if (error) throw error;

        console.log(`✅ Resultados encontrados: ${data?.length || 0}`);
        setResults(data || []);
      } catch (err) {
        console.error("❌ Error en búsqueda:", err);
      } finally {
        setLoading(false);
      }
    },
    [userLocation]
  ); // Se recrea si la ubicación cambia

  return {
    query,
    results,
    loading,
    handleSearch: search,
    userLocation, // Exponemos esto por si quieres mostrar "Cerca de ti" en la UI
  };
}
