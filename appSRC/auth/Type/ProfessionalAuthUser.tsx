import { create } from "zustand";

// 1. Definimos la estructura de los días por defecto
const INITIAL_SCHEDULE = [
  { day: "Lun", active: true, from: "09:00", to: "18:00" },
  { day: "Mar", active: true, from: "09:00", to: "18:00" },
  { day: "Mié", active: true, from: "09:00", to: "18:00" },
  { day: "Jue", active: true, from: "09:00", to: "18:00" },
  { day: "Vie", active: true, from: "09:00", to: "18:00" },
  { day: "Sáb", active: false, from: "10:00", to: "14:00" },
  { day: "Dom", active: false, from: "10:00", to: "14:00" },
];

// 2. Estado inicial con el horario cargado
const INITIAL_DATA = {
  dniFrontUri: null,
  dniBackUri: null,
  selfieUri: null,
  category: null,
  specialization: "",
  licenseNumber: "",
  biography: "",
  portfolioUris: [] as string[],
  serviceModes: ["zolver_ya"],
  location: null,
  radiusKm: 5,
  schedule: INITIAL_SCHEDULE, // 👈 ¡Aquí estaba el problema! Antes era []
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
  serviceModes: string[];
  location: { latitude: number; longitude: number } | null;
  radiusKm: number;
  schedule: typeof INITIAL_SCHEDULE; // Tipado automático
  cbuAlias: string;

  setData: (data: Partial<OnboardingState>) => void;
  reset: () => void;
}

export const useProfessionalOnboardingStore = create<OnboardingState>(
  (set) => ({
    ...INITIAL_DATA,

    setData: (data) => set((state) => ({ ...state, ...data })),

    reset: () => set({ ...INITIAL_DATA }),
  })
);
