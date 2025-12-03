import { useState, useEffect, useCallback } from "react";
import {
  MasterDataService,
  ServiceCategory,
  ServiceTag,
} from "../Service/ProfessionalCatalog";

export function useServiceSelection() {
  // --- 1. STATE ---
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [tags, setTags] = useState<ServiceTag[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<ServiceCategory | null>(null);

  // --- 2. UI STATE ---
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTags, setLoadingTags] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- 3. FETCH CATEGORIES (Memoized) ---
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    setError(null);
    try {
      const data = await MasterDataService.getCategories();
      setCategories(data);
    } catch (err: any) {
      console.error("Error loading categories:", err);
      setError("No se pudieron cargar las categorías.");
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // --- 4. FETCH TAGS (Reactive) ---
  // ✅ INTEGRACIÓN: Escucha cambios en selectedCategory automáticamente
  useEffect(() => {
    if (selectedCategory?.id) {
      loadTags(selectedCategory.id);
    } else {
      setTags([]);
    }
  }, [selectedCategory]);

  const loadTags = async (categoryId: string) => {
    setLoadingTags(true);
    try {
      const data = await MasterDataService.getTagsByCategory(categoryId);
      setTags(data);
    } catch (err: any) {
      console.error("Error loading tags:", err);
    } finally {
      setLoadingTags(false);
    }
  };

  // --- 5. INITIAL MOUNT ---
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    tags,
    selectedCategory,
    setSelectedCategory,
    loadingCategories,
    loadingTags,
    error,
    fetchCategories,
  };
}
export { ServiceCategory };
