import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { useAuthStore } from "../Store/AuthStore";
import { useServiceSelection } from "../../categories/Hooks/useServiceCatalog";
import {
  ProfessionalTypeWork,
  useProfessionalOnboardingStore,
} from "../Type/ProfessionalAuthUser";
import { ProfessionalProfileService } from "../Service/ProfessionalAuthService";
import { InstantModeService } from "@/appSRC/users/Professional/Instant/Service/InstantProfessionalService";

export function useProfessionalForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templates, setTemplates] = useState<{ id: string; label: string; basePrice: number }[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const { user, setUser, setStatus } = useAuthStore();

  const store = useProfessionalOnboardingStore();

  // 2. Catálogo
  const {
    categories,
    loadingCategories,
    tags,
    loadingTags,
    fetchCategories,
    setSelectedCategory,
  } = useServiceSelection();

  // --- EFECTOS ---
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setSelectedCategory(store.category);
  }, [store.category]);

  // Si la categoría no es urgente, forzar typeWork a "quote"
  useEffect(() => {
    if (store.category && !store.category.is_usually_urgent) {
      store.setTypeWork("quote");
    }
  }, [store.category]);

  // Fetch templates when category changes (for pricing)
  useEffect(() => {
    if (!store.category?.id) {
      setTemplates([]);
      return;
    }
    const loadTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const data = await InstantModeService.getTemplatesByCategory(store.category.id);
        setTemplates(data);
      } catch (e) {
        console.error("[useProfessionalForm] Error loading templates:", e);
      } finally {
        setLoadingTemplates(false);
      }
    };
    loadTemplates();
  }, [store.category?.id]);

  // --- ACCIONES ---
  const updateField = (field: string, value: any) => {
    // Mapper para compatibilidad con vistas viejas
    if (field === "selectedCategory") field = "category";
    if (field === "portfolioImages") field = "portfolioUris";
    if (field === "coverageRadius") field = "radiusKm";

    store.setData({ [field]: value });
  };

  const addPortfolioImage = (uri: string) => {
    store.setData({ portfolioUris: [...store.portfolioUris, uri] });
  };

  const removePortfolioImage = (index: number) => {
    const newImages = [...store.portfolioUris];
    newImages.splice(index, 1);
    store.setData({ portfolioUris: newImages });
  };

  const setTypeWork = (mode: ProfessionalTypeWork) => {
    const canInstant = !!store.category?.is_usually_urgent;
    // Block instant/hybrid for non-urgent categories
    if (!canInstant && (mode === "instant" || mode === "hybrid")) return;
    store.setTypeWork(mode);
  };

  const toggleDay = (dayName: string) => {
    const newSchedule = store.schedule.map((d) =>
      d.day === dayName ? { ...d, active: !d.active } : d
    );
    store.setData({ schedule: newSchedule });
  };

  const submitProfile = async () => {
    if (!user?.uid) return;
    setIsSubmitting(true);
    try {
      // 1. Guardar en Base de Datos (vía Edge Function)
      await ProfessionalProfileService.saveFullProfile(user.uid, store);

      // 2. Actualizar usuario local
      // Marcamos profileComplete como true porque el formulario ya se llenó
      setUser({ ...user, profileComplete: true });

      // 3. 🔥 CAMBIO CLAVE: Establecer estado a "pendingReview"
      // Esto disparará el AuthGuard para llevarlo a la pantalla de estado
      setStatus("pendingReview");

      // 4. Limpiar formulario
      store.reset();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Fallo al guardar perfil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const setCustomPrices = (updater: (prev: Record<string, string>) => Record<string, string>) => {
    store.setData({ customPrices: updater(store.customPrices) });
  };

  // --- RETURN CON ALIAS (Soluciona tus errores de tipos) ---
  return {
    ...store,
    // ALIAS: Mapeamos nombres nuevos a viejos para que tus vistas no se rompan
    selectedCategory: store.category,
    portfolioImages: store.portfolioUris,
    coverageRadius: store.radiusKm,

    // Resto de datos
    user,
    categories,
    loadingCategories,
    tags,
    loadingTags,
    isSubmitting,

    // Templates & pricing
    templates,
    loadingTemplates,
    customPrices: store.customPrices,
    setCustomPrices,

    // Acciones
    updateField,
    addPortfolioImage,
    removeImage: removePortfolioImage,
    setTypeWork,
    toggleDay,
    submitProfile,

    // Validaciones
    isZolverYaDisabled: store.category && !store.category.is_usually_urgent,
    isProfileValid:
      store.category &&
      store.specialization.length > 0 &&
      store.biography.length > 0,
    isLocationValid: store.location !== null,
  };
}
