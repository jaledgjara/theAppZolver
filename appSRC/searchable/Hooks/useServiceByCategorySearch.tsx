// appSRC/searchable/Hooks/useServiceByCategorySearch.tsx

import { useState, useEffect, useCallback } from "react";
import { ProfessionalTypeWork } from "@/appSRC/userProf/Type/ProfessionalTypeWork";
import { SearchService } from "../Service/SearchService";
import { useLocationStore } from "@/appSRC/location/Store/LocationStore"; // 👈 Import Store

export const useServiceByCategorySearch = (categoryId?: string) => {
  const [mode, setMode] = useState<ProfessionalTypeWork>("instant");
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 🟢 1. Listen to Global Location
  const activeAddress = useLocationStore((state) => state.activeAddress);

  const fetchProfessionals = useCallback(async () => {
    if (!categoryId) {
      setProfessionals([]);
      return;
    }

    setLoading(true);
    try {
      // 🟢 2. Extract coords from the Store
      const lat = activeAddress?.coords?.lat;
      const lng = activeAddress?.coords?.lng;

      console.log(
        `📍 [Hook] Fetching Category "${categoryId}" near: ${lat}, ${lng}`
      );

      // 🟢 3. Pass coords to Service
      const data = await SearchService.getProfessionalByCategory(
        categoryId,
        mode,
        lat, // 👈 Passing lat
        lng // 👈 Passing lng
      );
      setProfessionals(data || []);
    } catch (error) {
      console.error("❌ [Hook] Error searching professionals:", error);
      setProfessionals([]);
    } finally {
      setLoading(false);
    }
  }, [categoryId, mode, activeAddress]); // 👈 Re-run when activeAddress changes!

  useEffect(() => {
    fetchProfessionals();
  }, [fetchProfessionals]);

  return {
    professionals,
    loading,
    refetch: fetchProfessionals,
    mode,
    handleModeChange: setMode,
    activeAddress, // Optional: to show "Searching near X" in UI
  };
};
