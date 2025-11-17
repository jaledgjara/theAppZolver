import { create } from "zustand";
import type { AuthUser } from "../Type/AuthUser";
import { TransitionDirection } from "../Type/TransitionDirection";

export type AuthStatus =
  | "unknown"
  | "anonymous"
  | "preAuth"             // logged in, phone NOT verified
  | "phoneVerified"       // phone verified, missing role
  | "preProfessionalForm" // professional missing extra form
  | "authenticated";

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  isBootLoading: boolean;
  transitionDirection: TransitionDirection;
  lastStatus: AuthStatus | null;

  tempPhoneNumber: string | null;
  setTempPhoneNumber: (phone: string | null) => void;

  setStatus: (status: AuthStatus) => void;
  setUser: (user: AuthUser | null) => void;
  setBootLoading: (value: boolean) => void;
  setTransitionDirection: (dir: TransitionDirection) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "unknown",
  user: null,
  isBootLoading: true,
  transitionDirection: "forward",
  lastStatus: null,

  tempPhoneNumber: null,
  setTempPhoneNumber: (phone) => set({ tempPhoneNumber: phone }),

  // 👇 YA NO toca la dirección, solo cambia el status
  setStatus: (status) => {
    const prev = get().status;
    set({
      status,
      lastStatus: prev,
    });
  },

  setUser: (user) => set({ user }),
  setBootLoading: (value) => set({ isBootLoading: value }),
  setTransitionDirection: (dir) => set({ transitionDirection: dir }),

  reset: () =>
    set({
      status: "anonymous",
      user: null,
      isBootLoading: false,
      transitionDirection: "back",
      lastStatus: null,
      tempPhoneNumber: null,
    }),
}));
