import { useState, useCallback } from "react";
import { useProfessionalOnboardingStore } from "@/appSRC/auth/Type/ProfessionalAuthUser";

export const useWorkMode = () => {
  const { typeWork } = useProfessionalOnboardingStore();

  // 'activeTab' controla si mostramos Instant o Quote internamente en la Home
  const [activeTab, setActiveTab] = useState<"instant" | "quote">(
    typeWork === "quote" ? "quote" : "instant"
  );

  const isHybrid = typeWork === "hybrid";

  const switchTab = useCallback((tab: "instant" | "quote") => {
    setActiveTab(tab);
  }, []);

  return {
    typeWork,
    activeTab,
    switchTab,
    isHybrid,
  };
};
