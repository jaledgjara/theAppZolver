import { create } from "zustand";
import type { AuthStatus, AuthUser, AuthUserSession } from "../Type/AuthUser";
import { TransitionDirection } from "../Type/TransitionDirection";

/** Dirección de la animación de transición */

/** 🔹 Definición del tipo del store */
export type AuthStore = AuthUserSession & {
  /** Carga inicial del app (solo durante el arranque) */
  isBootLoading: boolean;

  /** Carga de acciones (sign in, sign out, update, etc.) */
  isActionLoading: boolean;

  /** Último error registrado */
  lastError: string | null;

  /** Dirección de transición visual (slide) */
  transitionDirection: TransitionDirection;

  /** Setters de estado */
  setStatus: (status: AuthStatus) => void;
  setUser: (user: AuthUser | null) => void;
  setBootLoading: (loading: boolean) => void;
  setActionLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTransitionDirection: (direction: TransitionDirection) => void;

  /** Reinicia el store a un estado anónimo */
  reset: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  // 🔹 Estado inicial
  status: "unknown",       // arranca desconocido (solo en memoria)
  user: null,
  isBootLoading: true,     // splash mientras Firebase responde
  isActionLoading: false,
  lastError: null,
  transitionDirection: "forward", // por defecto, avanzar

  // 🔹 Setters
  setStatus: (status) => set({ status }),
  setUser: (user) => set({ user }),
  setBootLoading: (isBootLoading) => set({ isBootLoading }),
  setActionLoading: (isActionLoading) => set({ isActionLoading }),
  setError: (lastError) => set({ lastError }),
  setTransitionDirection: (transitionDirection) => set({ transitionDirection }),

  // 🔹 Reinicio total del store
  reset: () =>
    set({
      status: "anonymous",
      user: null,
      isBootLoading: false,
      isActionLoading: false,
      lastError: null,
      transitionDirection: "back", // al salir, retrocede
    }),
}));
