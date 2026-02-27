// appSRC/users/Professional/Instant/Hooks/useProfessionalSettingsPricing.tsx
import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { InstantModeService } from "../Service/InstantProfessionalService";
import { useRouter } from "expo-router";
import { ProfessionalTypeWork } from "@/appSRC/auth/Type/ProfessionalAuthUser";

export const useProfessionalSettings = () => {
  const { user } = useAuthStore();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [customPrices, setCustomPrices] = useState<Record<string, string>>({});
  const [typeWork, setTypeWork] = useState<ProfessionalTypeWork>("instant");

  const resolveIdentity = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const profile = await InstantModeService.getProfessionalProfileByUid(uid);
      if (profile) {
        setTypeWork((profile.type_work as ProfessionalTypeWork) || "instant");

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

  const handleSelectMode = (mode: ProfessionalTypeWork) => {
    setTypeWork(mode);
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    setIsSaving(true);

    try {
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
    typeWork,
    handleSave,
    loading,
    isSaving,
    handleSelectMode,
  };
};
