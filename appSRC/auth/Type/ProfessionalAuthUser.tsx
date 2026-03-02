import { create } from "zustand";
import type { ServiceCategory } from "@/appSRC/categories/Service/ProfessionalCatalog";

// 1. Definición de Arquitectura: Enum para Tipos de Trabajo
export type ProfessionalTypeWork = "instant" | "quote" | "hybrid";

// 2. Estado inicial
const INITIAL_DATA = {
  dniFrontUri: null,
  dniBackUri: null,
  selfieUri: null,
  category: null as ServiceCategory | null,
  specialization: "",
  licenseNumber: "",
  biography: "",
  portfolioUris: [] as string[],

  // ARQUITECTURA: Reemplazamos 'serviceModes' (array) por 'typeWork' (Enum)
  // Inicializamos en "instant" como solicitaste
  typeWork: "instant" as ProfessionalTypeWork,

  customPrices: {} as Record<string, string>,
  location: null,
  radiusKm: 5,
  cbuAlias: "",
};

export interface OnboardingState {
  dniFrontUri: string | null;
  dniBackUri: string | null;
  selfieUri: string | null;
  category: ServiceCategory | null;
  specialization: string;
  licenseNumber: string;
  biography: string;
  portfolioUris: string[];

  // ARQUITECTURA: Propiedad fuertemente tipada
  typeWork: ProfessionalTypeWork;

  customPrices: Record<string, string>;
  location: { latitude: number; longitude: number } | null;
  radiusKm: number;
  cbuAlias: string;

  // Agregamos la acción explícita para el Switcher
  setTypeWork: (mode: ProfessionalTypeWork) => void;

  setData: (data: Partial<OnboardingState>) => void;
  reset: () => void;
}

export const useProfessionalOnboardingStore = create<OnboardingState>(
  (set) => ({
    ...INITIAL_DATA,
    setTypeWork: (mode) => set({ typeWork: mode }),

    setData: (data) => set((state) => ({ ...state, ...data })),

    reset: () => set({ ...INITIAL_DATA }),
  })
);
