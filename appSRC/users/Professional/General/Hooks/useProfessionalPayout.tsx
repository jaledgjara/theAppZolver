// appSRC/paymentMethod/Hooks/useProfessionalPayout.ts
import { useState, useEffect } from "react";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { ProfessionalDataService } from "../Service/ProfessionalDataService";

export const useProfessionalPayout = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({ alias: "", bankName: "" });

  const loadData = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const data = await ProfessionalDataService.fetchPayoutConfig(user.uid);
      setConfig({ alias: data.alias, bankName: data.bankName });
    } catch (err) {
      console.error("[Hook Error]", err);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (alias: string, bankName: string) => {
    if (!user?.uid) return { success: false, error: "Sesión no encontrada" };
    try {
      setSaving(true);
      await ProfessionalDataService.updatePayoutConfig(
        user.uid,
        alias,
        bankName
      );
      setConfig({ alias, bankName });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.uid]);

  return { config, loading, saving, updateConfig };
};
