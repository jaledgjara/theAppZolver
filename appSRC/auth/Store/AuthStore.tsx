import { create } from "zustand";
import type { AuthStatus, AuthUser, AuthUserSession } from "../Type/AuthUser";

// 🔹 Definición del tipo del store
export type AuthStore = AuthUserSession & {
  /** Carga inicial del app (solo durante el arranque) */
  isBootLoading: boolean;

  /** Carga de acciones (sign in, sign out, update, etc.) */
  isActionLoading: boolean;

  /** Último error registrado */
  lastError: string | null;

  /** Setters de estado */
  setStatus: (status: AuthStatus) => void;
  setUser: (user: AuthUser | null) => void;
  setBootLoading: (loading: boolean) => void;
  setActionLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  /** Reinicia el store a un estado anónimo */
  reset: () => void;
};

// 🔹 Implementación del store con Zustand
export const useAuthStore = create<AuthStore>((set) => ({
  status: "unknown",
  user: null,
  isBootLoading: true,   // solo durante el arranque inicial
  isActionLoading: false, // para acciones de usuario
  lastError: null,

  setStatus: (status) => set({ status }),
  setUser: (user) => set({ user }),
  setBootLoading: (isBootLoading) => set({ isBootLoading }),
  setActionLoading: (isActionLoading) => set({ isActionLoading }),
  setError: (lastError) => set({ lastError }),

  reset: () =>
    set({
      status: "anonymous",
      user: null,
      isBootLoading: false,
      isActionLoading: false,
      lastError: null,
    }),
}));
