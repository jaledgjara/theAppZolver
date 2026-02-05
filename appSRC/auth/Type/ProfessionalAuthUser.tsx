import { create } from "zustand";

// 1. Definición de Arquitectura: Enum para Tipos de Trabajo
export type ProfessionalTypeWork = "instant" | "quote" | "hybrid";

// 2. Definimos la estructura de los días por defecto (Sin cambios)
const INITIAL_SCHEDULE = [
  { day: "Lun", active: true, from: "09:00", to: "18:00" },
  { day: "Mar", active: true, from: "09:00", to: "18:00" },
  { day: "Mié", active: true, from: "09:00", to: "18:00" },
  { day: "Jue", active: true, from: "09:00", to: "18:00" },
  { day: "Vie", active: true, from: "09:00", to: "18:00" },
  { day: "Sáb", active: false, from: "10:00", to: "14:00" },
  { day: "Dom", active: false, from: "10:00", to: "14:00" },
];

// 3. Estado inicial
const INITIAL_DATA = {
  dniFrontUri: null,
  dniBackUri: null,
  selfieUri: null,
  category: null,
  specialization: "",
  licenseNumber: "",
  biography: "",
  portfolioUris: [] as string[],

  // ARQUITECTURA: Reemplazamos 'serviceModes' (array) por 'typeWork' (Enum)
  // Inicializamos en "instant" como solicitaste
  typeWork: "instant" as ProfessionalTypeWork,

  instantServicePrice: "",
  location: null,
  radiusKm: 5,
  schedule: INITIAL_SCHEDULE,
  cbuAlias: "",
};

interface OnboardingState {
  dniFrontUri: string | null;
  dniBackUri: string | null;
  selfieUri: string | null;
  category: any | null;
  specialization: string;
  licenseNumber: string;
  biography: string;
  portfolioUris: string[];

  // ARQUITECTURA: Propiedad fuertemente tipada
  typeWork: ProfessionalTypeWork;

  instantServicePrice: string;
  location: { latitude: number; longitude: number } | null;
  radiusKm: number;
  schedule: typeof INITIAL_SCHEDULE;
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
