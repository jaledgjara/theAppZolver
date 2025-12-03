import { useState, useEffect, useCallback } from "react";
import * as Location from "expo-location";
import { SearchService } from "@/appSRC/searchable/Service/SearchService";
import { ProfessionalResult } from "@/appSRC/searchable/Type/LocationType";
import { ProfessionalTypeWork } from "@/appSRC/userProf/Type/ProfessionalTypeWork";

export function useServiceSearch() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<ProfessionalTypeWork>("instant");
  const [results, setResults] = useState<ProfessionalResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // 1. Obtener ubicación al montar
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.warn("⚠️ Permiso ubicación denegado");
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        });
        console.log(
          "📍 Ubicación usuario:",
          loc.coords.latitude,
          loc.coords.longitude
        );
      } catch (e) {
        console.error("Error GPS:", e);
      }
    })();
  }, []);

  const executeSearch = useCallback(
    async (text: string, currentMode: ProfessionalTypeWork) => {
      setLoading(true);
      try {
        const data = await SearchService.searchProfessionals(
          text,
          userLocation?.lat,
          userLocation?.lng,
          currentMode
        );
        setResults(data || []);
      } catch (error) {
        console.error(error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [userLocation]
  );

  const handleTextSearch = (text: string) => {
    setQuery(text);
    executeSearch(text, mode);
  };

  // ✅ Recibe explícitamente el tipo SearchMode
  const handleModeChange = (newMode: ProfessionalTypeWork) => {
    setMode(newMode);
    executeSearch(query, newMode);
  };

  return {
    query,
    results,
    loading,
    mode,
    handleTextSearch,
    handleModeChange,
  };
}
