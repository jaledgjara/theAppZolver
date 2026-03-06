import { useAuthStore } from "../AuthStore";
import type { AuthStatus } from "../../Type/AuthUser";

// Reset store between tests
beforeEach(() => {
  useAuthStore.setState({
    status: "unknown",
    user: null,
    isBootLoading: true,
    transitionDirection: "forward",
    lastStatus: null,
    tempPhoneNumber: null,
  });
});

describe("AuthStore", () => {
  // --- setStatus transitions ---

  describe("setStatus", () => {
    it("transitions from unknown to anonymous", () => {
      const { setStatus } = useAuthStore.getState();
      setStatus("anonymous");
      expect(useAuthStore.getState().status).toBe("anonymous");
    });

    it("tracks lastStatus", () => {
      const { setStatus } = useAuthStore.getState();
      setStatus("anonymous");
      setStatus("preAuth");
      expect(useAuthStore.getState().lastStatus).toBe("anonymous");
    });

    it("allows valid transition: anonymous -> preAuth", () => {
      const { setStatus } = useAuthStore.getState();
      setStatus("anonymous");
      setStatus("preAuth");
      expect(useAuthStore.getState().status).toBe("preAuth");
    });

    it("allows valid transition: preAuth -> phoneVerified", () => {
      const { setStatus } = useAuthStore.getState();
      setStatus("preAuth");
      setStatus("phoneVerified");
      expect(useAuthStore.getState().status).toBe("phoneVerified");
    });

    it("allows valid transition: phoneVerified -> authenticated (client)", () => {
      const { setStatus } = useAuthStore.getState();
      setStatus("phoneVerified");
      setStatus("authenticated");
      expect(useAuthStore.getState().status).toBe("authenticated");
    });

    it("allows valid transition: phoneVerified -> preProfessionalForm", () => {
      const { setStatus } = useAuthStore.getState();
      setStatus("phoneVerified");
      setStatus("preProfessionalForm");
      expect(useAuthStore.getState().status).toBe("preProfessionalForm");
    });

    it("allows valid transition: preProfessionalForm -> pendingReview", () => {
      const { setStatus } = useAuthStore.getState();
      setStatus("preProfessionalForm");
      setStatus("pendingReview");
      expect(useAuthStore.getState().status).toBe("pendingReview");
    });

    it("allows valid transition: pendingReview -> authenticatedProfessional", () => {
      const { setStatus } = useAuthStore.getState();
      setStatus("pendingReview");
      setStatus("authenticatedProfessional");
      expect(useAuthStore.getState().status).toBe("authenticatedProfessional");
    });

    it("allows valid transition: pendingReview -> rejected", () => {
      const { setStatus } = useAuthStore.getState();
      setStatus("pendingReview");
      setStatus("rejected");
      expect(useAuthStore.getState().status).toBe("rejected");
    });

    it("allows valid transition: rejected -> preProfessionalForm", () => {
      const { setStatus } = useAuthStore.getState();
      setStatus("rejected");
      setStatus("preProfessionalForm");
      expect(useAuthStore.getState().status).toBe("preProfessionalForm");
    });

    it("warns but allows invalid transitions", () => {
      const spy = jest.spyOn(console, "warn").mockImplementation();
      const { setStatus } = useAuthStore.getState();
      setStatus("authenticated");
      // authenticated -> preAuth is not in VALID_TRANSITIONS
      setStatus("preAuth");
      expect(useAuthStore.getState().status).toBe("preAuth");
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("Invalid transition"));
      spy.mockRestore();
    });

    it("all statuses can return to anonymous", () => {
      const statuses: AuthStatus[] = [
        "preAuth",
        "phoneVerified",
        "preProfessionalForm",
        "pendingReview",
        "rejected",
        "authenticated",
        "authenticatedProfessional",
        "authenticatedAdmin",
      ];

      for (const s of statuses) {
        useAuthStore.setState({ status: s });
        const { setStatus } = useAuthStore.getState();
        setStatus("anonymous");
        expect(useAuthStore.getState().status).toBe("anonymous");
      }
    });
  });

  // --- setUser ---

  describe("setUser", () => {
    it("sets user data", () => {
      const { setUser } = useAuthStore.getState();
      const user = {
        uid: "uid-1",
        email: "test@example.com",
        displayName: "Test User",
        legalName: "Test User",
        photoURL: null,
        phoneNumber: "+5491112345678",
        role: "client" as const,
        profileComplete: true,
      };
      setUser(user);
      expect(useAuthStore.getState().user).toEqual(user);
    });

    it("clears user with null", () => {
      const { setUser } = useAuthStore.getState();
      setUser({
        uid: "uid-1",
        email: null,
        displayName: null,
        legalName: null,
        photoURL: null,
        phoneNumber: null,
        role: null,
        profileComplete: false,
      });
      setUser(null);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  // --- setBootLoading ---

  describe("setBootLoading", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("sets boot loading to false", () => {
      const { setBootLoading } = useAuthStore.getState();
      setBootLoading(false);
      expect(useAuthStore.getState().isBootLoading).toBe(false);
    });

    it("forces unlock after 15s timeout", () => {
      const { setBootLoading } = useAuthStore.getState();
      setBootLoading(true);
      expect(useAuthStore.getState().isBootLoading).toBe(true);

      jest.advanceTimersByTime(15_000);
      expect(useAuthStore.getState().isBootLoading).toBe(false);
    });

    it("cancels timeout when set to false before expiry", () => {
      const { setBootLoading } = useAuthStore.getState();
      setBootLoading(true);
      setBootLoading(false);

      jest.advanceTimersByTime(15_000);
      // Should still be false (not re-triggered)
      expect(useAuthStore.getState().isBootLoading).toBe(false);
    });
  });

  // --- reset ---

  describe("reset", () => {
    it("resets all state to defaults", () => {
      const store = useAuthStore.getState();
      store.setStatus("authenticated");
      store.setUser({
        uid: "uid-1",
        email: "test@example.com",
        displayName: "Test",
        legalName: "Test",
        photoURL: null,
        phoneNumber: null,
        role: "client",
        profileComplete: true,
      });
      store.setTempPhoneNumber("+5491112345678");

      store.reset();

      const state = useAuthStore.getState();
      expect(state.status).toBe("anonymous");
      expect(state.user).toBeNull();
      expect(state.isBootLoading).toBe(false);
      expect(state.transitionDirection).toBe("back");
      expect(state.lastStatus).toBeNull();
      expect(state.tempPhoneNumber).toBeNull();
    });
  });

  // --- tempPhoneNumber ---

  describe("setTempPhoneNumber", () => {
    it("stores phone number", () => {
      const { setTempPhoneNumber } = useAuthStore.getState();
      setTempPhoneNumber("+5491112345678");
      expect(useAuthStore.getState().tempPhoneNumber).toBe("+5491112345678");
    });

    it("clears phone number with null", () => {
      const { setTempPhoneNumber } = useAuthStore.getState();
      setTempPhoneNumber("+5491112345678");
      setTempPhoneNumber(null);
      expect(useAuthStore.getState().tempPhoneNumber).toBeNull();
    });
  });
});
