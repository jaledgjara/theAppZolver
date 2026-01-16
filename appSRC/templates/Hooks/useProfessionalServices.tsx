// appSRC/templates/Hooks/useProfessionalServices.tsx
import { useState, useEffect } from "react";
import { ProfessionalTemplate } from "../Type/TemplateType";
import { TemplateService } from "../Service/TemplateService";

export function useProfessionalServices(professionalId: string | null) {
  const [services, setServices] = useState<ProfessionalTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      console.log(
        "🔗 [useProfessionalServices] Iniciando efecto. ID:",
        professionalId
      );

      if (!professionalId) {
        console.warn(
          "⚠️ [useProfessionalServices] professionalId es null o undefined."
        );
        setServices([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await TemplateService.getProfessionalServices(
          professionalId
        );
        console.log(
          `✅ [useProfessionalServices] Éxito. Recibidos ${data.length} servicios.`
        );
        setServices(data);
      } catch (e) {
        console.error("❌ [useProfessionalServices] Error fatal:", e);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [professionalId]);

  return { services, loading };
}
