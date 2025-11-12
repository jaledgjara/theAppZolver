import { create } from "zustand";
import type { AuthStatus, AuthUser, AuthUserSession } from "../Type/AuthUser";
import { TransitionDirection } from "../Type/TransitionDirection";

/** 🔹 Tipo del store de autenticación global */
export type AuthStore = AuthUserSession & {
  /** Carga inicial del app (solo durante el arranque) */
  isBootLoading: boolean;

  /** Carga de acciones (sign in, sign out, update, etc.) */
  isActionLoading: boolean;

  /** Último error registrado */
  lastError: string | null;

  /** Dirección de transición visual (slide) */
  transitionDirection: TransitionDirection;

  /** 🔹 Campos temporales para verificación telefónica (OTP) */
  verificationId: string | null;
  lastPhone: string | null;

  /** 🔹 Setters de estado */
  setStatus: (status: AuthStatus) => void;
  setUser: (user: AuthUser | null) => void;
  setBootLoading: (loading: boolean) => void;
  setActionLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTransitionDirection: (direction: TransitionDirection) => void;

  /** 🔹 Setters específicos OTP */
  setVerificationId: (id: string | null) => void;
  setLastPhone: (phone: string | null) => void;

  /** Reinicia el store a un estado anónimo */
  reset: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  // 🔹 Estado inicial
  status: "unknown",
  user: null,
  isBootLoading: true,
  isActionLoading: false,
  lastError: null,
  transitionDirection: "forward",

  // 🔹 Campos OTP
  verificationId: null,
  lastPhone: null,

  // 🔹 Setters
  setStatus: (status) => set({ status }),
  setUser: (user) => set({ user }),
  setBootLoading: (isBootLoading) => set({ isBootLoading }),
  setActionLoading: (isActionLoading) => set({ isActionLoading }),
  setError: (lastError) => set({ lastError }),
  setTransitionDirection: (transitionDirection) => set({ transitionDirection }),

  // 🔹 Setters OTP
  setVerificationId: (verificationId) => set({ verificationId }),
  setLastPhone: (lastPhone) => set({ lastPhone }),

  // 🔹 Reinicio total del store
  reset: () =>
    set({
      status: "anonymous",
      user: null,
      isBootLoading: false,
      isActionLoading: false,
      lastError: null,
      transitionDirection: "back",
      verificationId: null,
      lastPhone: null,
    }),
}));
