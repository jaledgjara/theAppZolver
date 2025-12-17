import { useState, useEffect } from "react";
import {
  MasterDataService,
  ServiceTag,
} from "@/appSRC/categories/Service/ProfessionalCatalog";

export function useServiceMetadata(
  categoryIdParam: string | null,
  categoryNameParam: string
) {
  const [tags, setTags] = useState<ServiceTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvedCategoryId, setResolvedCategoryId] = useState<string | null>(
    null
  );

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      let targetId = categoryIdParam;

      // 1. Limpieza inicial: Evitar strings "undefined" o "null"
      if (targetId === "undefined" || targetId === "null") targetId = null;

      console.log(
        `🔌 [Hook Metadata] Input -> ID: ${targetId} | Name: ${categoryNameParam}`
      );

      try {
        // 2. Estrategia de Fallback: Si no hay ID, buscar por Nombre
        if (!targetId && categoryNameParam) {
          console.log("⚠️ [Hook Metadata] ID faltante. Buscando por nombre...");
          const cat = await MasterDataService.getCategoryByName(
            categoryNameParam
          );
          if (cat) targetId = cat.id;
        }

        // 3. Carga de Tags
        if (targetId) {
          console.log(
            `✅ [Hook Metadata] ID Resuelto: ${targetId}. Buscando tags...`
          );
          const fetchedTags = await MasterDataService.getTagsByCategory(
            targetId
          );
          setTags(fetchedTags);
          setResolvedCategoryId(targetId);
        } else {
          console.warn("⛔ [Hook Metadata] No se pudo resolver la categoría.");
          setTags([]);
        }
      } catch (e) {
        console.error("❌ [Hook Metadata] Error:", e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [categoryIdParam, categoryNameParam]);

  return { tags, loading, resolvedCategoryId };
}
