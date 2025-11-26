import { useState, useEffect } from "react";
import { useServiceSelection } from "@/appSRC/auth/Hooks/useServiceCatalog";
import { useImagePicker } from "@/appCOMP/images/Hooks/useImagePicker";
import { ServiceMode } from "@/appSRC/users/Model/ServiceMode";

export function useProfessionalForm() {
  // 1. Consumimos el Hook de Datos
  const {
    categories,
    loadingCategories,
    loadingTags, // (Opcional: para mostrar spinner en los chips)
    tags, // 👈 Estos son los que no te llegan
    fetchCategories,
    setSelectedCategory, // ✅ IMPORTANTE: Necesitamos esto para avisarle al hook que cargue tags
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
  });

  // --- Lógica de Negocio ---

  useEffect(() => {
    fetchCategories();
  }, []);

  // ✅ NUEVO: Sincronización de Tags
  // Cada vez que el usuario elige una categoría en el formulario,
  // le avisamos al hook de servicio para que busque los tags correspondientes.
  useEffect(() => {
    setSelectedCategory(form.selectedCategory);
  }, [form.selectedCategory]);

  // Autocorrección basada en Categoría (Tu lógica original)
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

  // --- Validaciones ---
  const isZolverYaDisabled =
    form.selectedCategory && !form.selectedCategory.is_usually_urgent;
  const isFormValid =
    form.serviceModes.length > 0 &&
    form.selectedCategory &&
    form.specialization.length > 0 &&
    form.biography.length > 0 &&
    (!form.selectedCategory.requires_license || form.licenseNumber.length > 3);

  return {
    ...form,
    categories,
    loadingCategories,
    loadingTags,
    tags, // 👈 Ahora sí tendrá datos cuando selecciones categoría
    loadingImages,
    toggleServiceMode,
    pickImage: handleAddImage,
    removeImage,
    updateField,
    isZolverYaDisabled,
    isFormValid,
  };
}
