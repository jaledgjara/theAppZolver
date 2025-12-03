import { useState, useEffect } from "react";
import { supabase } from "@/appSRC/services/supabaseClient";

export type ProfessionalProfile = {
  id: string;
  user_id: string;
  legal_name: string;
  biography: string | null;
  rating: number;
  reviews_count: number;
  portfolio_urls: string[] | null;
  base_lat: number;
  base_lng: number;
};

export type ProfessionalService = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
};

export function useProfessionalDetails(professionalId: string) {
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [services, setServices] = useState<ProfessionalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!professionalId) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        console.log("📥 Fetching details for:", professionalId);

        // 1. Obtener Perfil (Datos del Humano)
        // Buscamos por 'user_id' porque así relacionamos las tablas en tu arquitectura
        const { data: profileData, error: profileError } = await supabase
          .from("professional_profiles")
          .select("*")
          .eq("user_id", professionalId) // professionalId viene de la búsqueda (es el auth_uid)
          .single();

        if (profileError) throw profileError;

        // 2. Obtener Servicios (El Menú)
        const { data: servicesData, error: servicesError } = await supabase
          .from("services")
          .select("*")
          .eq("professional_id", professionalId)
          .eq("active", true); // Solo servicios activos

        if (servicesError) throw servicesError;

        setProfile(profileData);
        setServices(servicesData || []);
      } catch (err: any) {
        console.error("❌ Error fetching details:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [professionalId]);

  return { profile, services, loading, error };
}
