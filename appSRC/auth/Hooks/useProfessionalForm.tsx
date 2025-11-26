import { useState, useEffect } from "react";
import { useServiceSelection } from "@/appSRC/auth/Hooks/useServiceCatalog";
import { useImagePicker } from "@/appCOMP/images/Hooks/useImagePicker";
import { ServiceMode } from "@/appSRC/users/Model/ServiceMode";

// Tipos auxiliares
export type DaySchedule = {
  day: string;
  active: boolean;
  from: string;
  to: string;
};

const INITIAL_SCHEDULE: DaySchedule[] = [
  { day: "Lun", active: true, from: "09:00", to: "18:00" },
  { day: "Mar", active: true, from: "09:00", to: "18:00" },
  { day: "Mié", active: true, from: "09:00", to: "18:00" },
  { day: "Jue", active: true, from: "09:00", to: "18:00" },
  { day: "Vie", active: true, from: "09:00", to: "18:00" },
  { day: "Sáb", active: false, from: "10:00", to: "14:00" },
  { day: "Dom", active: false, from: "10:00", to: "14:00" },
];

export function useProfessionalForm() {
  // 1. Consumimos el Hook de Datos
  const {
    categories,
    loadingCategories,
    loadingTags,
    tags,
    fetchCategories,
    setSelectedCategory,
  } = useServiceSelection();

  // 2. Consumimos el Hook de Imágenes
  const { pickImage: pickSingleImage, isLoading: loadingImages } =
    useImagePicker();

  // 3. Estado Local
  const [form, setForm] = useState({
    serviceModes: ["zolver_ya"] as ServiceMode[],
    selectedCategory: null as any,
    specialization: "",
    licenseNumber: "",
    biography: "",
    portfolioImages: [] as string[],

    // --- NUEVOS CAMPOS (Form 3/4) ---
    location: null as { latitude: number; longitude: number } | null,
    coverageRadius: 5, // en Kilómetros
    schedule: INITIAL_SCHEDULE,
  });

  // --- Lógica de Negocio ---

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setSelectedCategory(form.selectedCategory);
  }, [form.selectedCategory]);

  useEffect(() => {
    if (form.selectedCategory) {
      const isUrgent = form.selectedCategory.is_usually_urgent;
      const requiresLicense = form.selectedCategory.requires_license;

      setForm((prev) => {
        let newModes = [...prev.serviceModes];
        if (!isUrgent) {
          newModes = newModes.filter((m) => m !== "zolver_ya");
          if (!newModes.includes("presupuesto")) newModes.push("presupuesto");
        }
        return {
          ...prev,
          serviceModes: newModes,
          licenseNumber: requiresLicense ? prev.licenseNumber : "",
        };
      });
    }
  }, [form.selectedCategory]);

  // --- Actions ---
  const toggleServiceMode = (mode: ServiceMode) => {
    if (
      mode === "zolver_ya" &&
      form.selectedCategory &&
      !form.selectedCategory.is_usually_urgent
    )
      return;
    setForm((prev) => {
      const exists = prev.serviceModes.includes(mode);
      if (exists && prev.serviceModes.length === 1) return prev;
      return {
        ...prev,
        serviceModes: exists
          ? prev.serviceModes.filter((m) => m !== mode)
          : [...prev.serviceModes, mode],
      };
    });
  };

  const handleAddImage = async () => {
    const uri = await pickSingleImage();
    if (uri)
      setForm((prev) => ({
        ...prev,
        portfolioImages: [...prev.portfolioImages, uri],
      }));
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      portfolioImages: prev.portfolioImages.filter((_, i) => i !== index),
    }));
  };

  const updateField = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Nueva acción: Toggle día de la semana
  const toggleDay = (dayName: string) => {
    setForm((prev) => ({
      ...prev,
      schedule: prev.schedule.map((d) =>
        d.day === dayName ? { ...d, active: !d.active } : d
      ),
    }));
  };

  // --- Validaciones ---
  const isZolverYaDisabled =
    form.selectedCategory && !form.selectedCategory.is_usually_urgent;

  const isProfileValid =
    form.serviceModes.length > 0 &&
    form.selectedCategory && // ¿Has seleccionado Cerrajería?
    form.specialization.length > 0 &&
    form.biography.length > 0 &&
    (!form.selectedCategory.requires_license || form.licenseNumber.length > 3);

  // 2. Validación para el Paso 3 (Ubicación)
  const isLocationValid = form.location !== null;

  // Dentro de useProfessionalForm.tsx, antes del return
  console.log("DEBUG VALIDACIÓN:", {
    modes: form.serviceModes.length,
    category: !!form.selectedCategory,
    spec: form.specialization.length,
    bio: form.biography.length,
    licenseRequired: form.selectedCategory?.requires_license,
    licenseNum: form.licenseNumber,
  });

  return {
    ...form,
    categories,
    loadingCategories,
    loadingTags,
    tags,
    loadingImages,
    toggleServiceMode,
    pickImage: handleAddImage,
    removeImage,
    updateField,
    toggleDay,
    isZolverYaDisabled,

    // 👇 Exportamos las validaciones específicas
    isProfileValid,
    isLocationValid,
  };
}
