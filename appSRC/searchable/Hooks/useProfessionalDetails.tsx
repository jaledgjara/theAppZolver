// appSRC/searchable/Hooks/useProfessionalDetails.tsx

import { useState, useEffect } from "react";
import { SearchService } from "../Service/SearchService";
import { useLocationStore } from "@/appSRC/location/Store/LocationStore"; // 👈 Import Store
import { ProfessionalResult } from "../Type/LocationType";

export function useProfessionalDetails(id: string) {
  const [profile, setProfile] = useState<ProfessionalResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🟢 Listen to address changes
  const activeAddress = useLocationStore((s) => s.activeAddress);

  useEffect(() => {
    let mounted = true;

    const fetchDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        console.log(`📍 [Details Hook] Refreshing details for ${id}...`);

        // Currently just fetches profile.
        // Future Upgrade: Pass activeAddress.coords to Service if you want dynamic distance calculation here too.
        const data = await SearchService.getProfessionalById(id);

        if (mounted) {
          setProfile(data);
        }
      } catch (err: any) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDetails();

    return () => {
      mounted = false;
    };
  }, [id, activeAddress]); // 👈 Triggers refresh if user changes address while viewing details

  return { profile, loading, error };
}
