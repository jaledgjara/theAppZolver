import { create } from "zustand";
import type { AuthUser, AuthStatus } from "../Type/AuthUser";
import { TransitionDirection } from "../Type/TransitionDirection";

const VALID_TRANSITIONS: Record<AuthStatus, AuthStatus[]> = {
  unknown: ["anonymous", "preAuth", "phoneVerified", "authenticated", "authenticatedProfessional", "authenticatedAdmin", "preProfessionalForm", "pendingReview", "rejected"],
  anonymous: ["preAuth", "unknown"],
  preAuth: ["phoneVerified", "anonymous", "unknown"],
  phoneVerified: ["authenticated", "preProfessionalForm", "pendingReview", "rejected", "authenticatedProfessional", "anonymous", "unknown"],
  preProfessionalForm: ["pendingReview", "anonymous", "unknown"],
  pendingReview: ["authenticatedProfessional", "rejected", "anonymous", "unknown"],
  rejected: ["preProfessionalForm", "anonymous", "unknown"],
  authenticated: ["anonymous", "unknown"],
  authenticatedProfessional: ["anonymous", "unknown"],
  authenticatedAdmin: ["anonymous", "unknown"],
};

const BOOT_LOADING_TIMEOUT_MS = 15_000;

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

let bootLoadingTimer: ReturnType<typeof setTimeout> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "unknown",
  user: null,
  isBootLoading: true,
  transitionDirection: "forward",
  lastStatus: null,

  tempPhoneNumber: null,
  setTempPhoneNumber: (phone) => set({ tempPhoneNumber: phone }),

  setStatus: (status) => {
    const prev = get().status;
    const allowed = VALID_TRANSITIONS[prev];
    if (allowed && !allowed.includes(status)) {
      console.warn(
        `[AuthStore] Invalid transition: "${prev}" → "${status}". Proceeding anyway.`
      );
    }
    set({
      status,
      lastStatus: prev,
    });
  },

  setUser: (user) => set({ user }),

  setBootLoading: (value) => {
    if (value) {
      // Start safety timeout
      if (bootLoadingTimer) clearTimeout(bootLoadingTimer);
      bootLoadingTimer = setTimeout(() => {
        const current = get().isBootLoading;
        if (current) {
          console.warn("[AuthStore] Boot loading timeout reached (15s). Forcing unlock.");
          set({ isBootLoading: false });
        }
      }, BOOT_LOADING_TIMEOUT_MS);
    } else {
      if (bootLoadingTimer) {
        clearTimeout(bootLoadingTimer);
        bootLoadingTimer = null;
      }
    }
    set({ isBootLoading: value });
  },

  setTransitionDirection: (dir) => set({ transitionDirection: dir }),

  reset: () => {
    if (bootLoadingTimer) {
      clearTimeout(bootLoadingTimer);
      bootLoadingTimer = null;
    }
    set({
      status: "anonymous",
      user: null,
      isBootLoading: false,
      transitionDirection: "back",
      lastStatus: null,
      tempPhoneNumber: null,
    });
  },
}));
