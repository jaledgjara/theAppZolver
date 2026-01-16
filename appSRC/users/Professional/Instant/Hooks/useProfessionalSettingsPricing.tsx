// appSRC/users/Professional/Instant/Hooks/useProfessionalSettingsPricing.tsx
import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { InstantModeService } from "../Service/InstantProfessionalService";
import { useRouter } from "expo-router";

export const useProfessionalSettings = () => {
  const { user } = useAuthStore();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [customPrices, setCustomPrices] = useState<Record<string, string>>({});
  const [activeModes, setActiveModes] = useState<string[]>([]);

  const resolveIdentity = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const profile = await InstantModeService.getProfessionalProfileByUid(uid);
      if (profile) {
        const modes =
          profile.type_work === "hybrid"
            ? ["instant", "quote"]
            : [profile.type_work || "instant"];
        setActiveModes(modes);

        // Fetch usando UID de Firebase
        const [allTemplates, currentPrices] = await Promise.all([
          InstantModeService.getTemplatesByCategory(profile.main_category_id),
          InstantModeService.getProfessionalPrices(uid),
        ]);

        setTemplates(allTemplates);
        const priceMap: Record<string, string> = {};
        currentPrices.forEach((p: any) => {
          priceMap[p.template_id] = p.custom_price.toString();
        });
        setCustomPrices(priceMap);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.uid) resolveIdentity(user.uid);
  }, [user?.uid, resolveIdentity]);

  /**
   * REGLA DE NEGOCIO: Toggle de modalidades
   * Impide que el profesional desactive ambos modos.
   */
  const handleToggleMode = (mode: string) => {
    setActiveModes((prev) => {
      if (prev.includes(mode)) {
        // Si el modo ya está activo, solo permitir quitarlo si hay otro activo
        return prev.length > 1 ? prev.filter((m) => m !== mode) : prev;
      }
      // Si no está activo, lo agregamos
      return [...prev, mode];
    });
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    setIsSaving(true);

    try {
      const typeWork = activeModes.length === 2 ? "hybrid" : activeModes[0];

      // 1. Guardar modo
      await InstantModeService.updateWorkProfile(user.uid, typeWork);

      // 2. Guardar precios (UID de Firebase)
      const savePromises = Object.entries(customPrices).map(([tId, price]) => {
        if (price)
          return InstantModeService.updateProfessionalPrice(
            user.uid!,
            tId,
            Number(price)
          );
      });

      await Promise.all(savePromises);

      Alert.alert("¡Éxito!", "Configuración actualizada correctamente.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("Error", "No se pudo guardar la configuración.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    templates,
    customPrices,
    setCustomPrices,
    activeModes,
    handleSave,
    loading,
    isSaving,
    handleToggleMode,
  };
};
