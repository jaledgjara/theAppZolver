import { useState, useEffect, useCallback } from "react";
// Remove local Location import, we rely on the Store now
// import * as Location from "expo-location";
import { SearchService } from "@/appSRC/searchable/Service/SearchService";
import { ProfessionalResult } from "@/appSRC/searchable/Type/LocationType";
import { ProfessionalTypeWork } from "@/appSRC/userProf/Type/ProfessionalTypeWork";
import { useLocationStore } from "@/appSRC/location/Store/LocationStore"; // Import Store

export function useServiceSearch() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<ProfessionalTypeWork>("instant");
  const [results, setResults] = useState<ProfessionalResult[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Listen to the Active Address from the Global Store
  const activeAddress = useLocationStore((state) => state.activeAddress);

  const executeSearch = useCallback(
    async (text: string, currentMode: ProfessionalTypeWork) => {
      // If we don't have an active address, we might not want to search (or search without coords)
      if (!activeAddress?.coords) {
        console.warn("⚠️ No active address selected for search");
        // Optional: setResults([]) or search without location if your DB supports it
      }

      setLoading(true);
      try {
        const lat = activeAddress?.coords?.lat;
        const lng = activeAddress?.coords?.lng;

        console.log("📍 Searching with coords:", lat, lng);

        const data = await SearchService.searchProfessionals(
          text,
          lat,
          lng,
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
    [activeAddress] // 🔥 Re-create function when address changes
  );

  // 2. React to Address Changes (Uber Style)
  useEffect(() => {
    // Whenever activeAddress changes, we re-run the search with the current query/mode
    executeSearch(query, mode);
  }, [activeAddress, mode]); // 🔥 Trigger on address or mode change

  const handleTextSearch = (text: string) => {
    setQuery(text);
    // We don't need to pass mode here explicitly if we use the state,
    // but usually search inputs trigger immediately.
    executeSearch(text, mode);
  };

  const handleModeChange = (newMode: ProfessionalTypeWork) => {
    setMode(newMode);
    // The useEffect will handle the search, but if you want immediate feedback:
    executeSearch(query, newMode);
  };

  return {
    query,
    results,
    loading,
    mode,
    handleTextSearch,
    handleModeChange,
    activeAddress, // Optional: return this if you want to show "Searching near..." in UI
  };
}
