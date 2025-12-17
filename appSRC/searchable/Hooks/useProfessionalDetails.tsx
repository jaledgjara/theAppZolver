import { useState, useEffect, useCallback } from "react";
import { SearchService } from "../Service/SearchService";
import { ProfessionalResult } from "../Type/LocationType";

export const useProfessionalDetails = (userId: string) => {
  const [profile, setProfile] = useState<ProfessionalResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchDetails = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const data = await SearchService.getProfessionalById(userId);
      setProfile(data);
    } catch (err) {
      console.error(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { profile, loading, error, refetch: fetchDetails };
};
