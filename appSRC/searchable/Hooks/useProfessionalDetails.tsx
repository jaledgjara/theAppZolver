import { useState, useEffect } from "react";
import { SearchService } from "../Service/SearchService";
import { ProfessionalResult } from "../Types/SearchTypes";

export function useProfessionalDetails(id: string) {
  const [profile, setProfile] = useState<ProfessionalResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // Llamamos al servicio para buscar por ID (user_id o uuid)
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
  }, [id]);

  return { profile, loading, error };
}
