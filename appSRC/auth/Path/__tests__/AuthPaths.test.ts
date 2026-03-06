import { AUTH_PATHS, getPathForStatus } from "../AuthPaths";

describe("AuthPaths", () => {
  // --- AUTH_PATHS mapping ---

  it("maps all 10 auth statuses to paths", () => {
    const expectedStatuses = [
      "unknown",
      "anonymous",
      "preAuth",
      "phoneVerified",
      "preProfessionalForm",
      "pendingReview",
      "rejected",
      "authenticated",
      "authenticatedProfessional",
      "authenticatedAdmin",
    ];

    for (const status of expectedStatuses) {
      expect(AUTH_PATHS[status]).toBeDefined();
      expect(typeof AUTH_PATHS[status]).toBe("string");
    }
  });

  it("unknown -> WelcomeScreen", () => {
    expect(AUTH_PATHS.unknown).toBe("/(auth)/WelcomeScreen");
  });

  it("anonymous -> SignInScreen", () => {
    expect(AUTH_PATHS.anonymous).toBe("/(auth)/SignInScreen");
  });

  it("preAuth -> UserBasicInfoScreen", () => {
    expect(AUTH_PATHS.preAuth).toBe("/(auth)/UserBasicInfoScreen");
  });

  it("phoneVerified -> TypeOfUserScreen", () => {
    expect(AUTH_PATHS.phoneVerified).toBe("/(auth)/TypeOfUserScreen");
  });

  it("authenticated -> client home", () => {
    expect(AUTH_PATHS.authenticated).toBe("/(client)/(tabs)/home");
  });

  it("authenticatedProfessional -> professional home", () => {
    expect(AUTH_PATHS.authenticatedProfessional).toBe("/(professional)/(tabs)/home");
  });

  it("authenticatedAdmin -> admin dashboard", () => {
    expect(AUTH_PATHS.authenticatedAdmin).toBe("/(admin)/dashboard");
  });

  it("pendingReview and rejected both -> AccountStatusScreen", () => {
    expect(AUTH_PATHS.pendingReview).toBe("/(auth)/AccountStatusScreen");
    expect(AUTH_PATHS.rejected).toBe("/(auth)/AccountStatusScreen");
  });

  // --- getPathForStatus ---

  it("returns correct path for known status", () => {
    expect(getPathForStatus("authenticated")).toBe("/(client)/(tabs)/home");
  });

  it("falls back to unknown path for unrecognized status", () => {
    expect(getPathForStatus("nonexistent")).toBe("/(auth)/WelcomeScreen");
  });
});
