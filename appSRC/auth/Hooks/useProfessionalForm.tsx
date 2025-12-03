import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { useAuthStore } from "../Store/AuthStore";
import { useServiceSelection } from "../../categories/Hooks/useServiceCatalog";
import { ServiceMode } from "@/appSRC/users/Model/ServiceMode";
import { useProfessionalOnboardingStore } from "../Type/ProfessionalAuthUser";
import { ProfessionalProfileService } from "../Service/ProfessionalAuthService";

export function useProfessionalForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Lógica Zolver Ya
  useEffect(() => {
    if (store.category) {
      const isUrgent = store.category.is_usually_urgent;
      let newModes = [...store.serviceModes];
      if (!isUrgent) {
        newModes = newModes.filter((m) => m !== "zolver_ya");
        if (!newModes.includes("presupuesto")) newModes.push("presupuesto");
        if (newModes.length !== store.serviceModes.length) {
          store.setData({ serviceModes: newModes });
        }
      }
    }
  }, [store.category]);

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

  const toggleServiceMode = (mode: ServiceMode) => {
    if (
      mode === "zolver_ya" &&
      store.category &&
      !store.category.is_usually_urgent
    )
      return;
    const currentModes = store.serviceModes;
    const exists = currentModes.includes(mode);
    if (exists && currentModes.length === 1) return;
    const newModes = exists
      ? currentModes.filter((m) => m !== mode)
      : [...currentModes, mode];
    store.setData({ serviceModes: newModes });
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

    // Acciones
    updateField,
    addPortfolioImage,
    removeImage: removePortfolioImage,
    toggleServiceMode,
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
