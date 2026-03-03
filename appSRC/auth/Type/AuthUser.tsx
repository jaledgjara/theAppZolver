export type UserRole = "client" | "professional" | "admin";

export type AuthStatus =
  | "unknown"
  | "anonymous"
  | "preAuth"
  | "phoneVerified"
  | "preProfessionalForm"
  | "pendingReview"
  | "rejected"
  | "authenticated"
  | "authenticatedProfessional"
  | "authenticatedAdmin";

// appSRC/auth/Model/AuthUser.ts

export type AuthUser = {
  uid: string;
  internalId?: string; // Postgres UUID — use for Supabase Storage paths
  email: string | null;
  displayName: string | null;
  legalName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  role: "client" | "professional" | "admin" | null;
  profileComplete: boolean;
  identityStatus?: string | null;
};

// appSRC/auth/Type/AuthUser.ts
export type AuthUserSession = {
  status: AuthStatus;
  user: AuthUser | null;
  isLoading?: boolean;
  lastError?: string | null;
};

/*
 unknown → WelcomeScreen                                                                                              
       │                                                                                                                 
       ▼                                                                                                                 
    anonymous → SignInScreen (Apple/Google/Email)
       │
       ▼
    preAuth → UserBasicInfoScreen (name + phone verify)
       │
       ▼
    phoneVerified → TypeOfUserScreen
       │
       ├── "client" → authenticated → /(client)/home ✅
       │
       └── "professional" → set-user-role called
              │
              ├── NEW pro (profile_complete=false, no professional_profiles row)
              │     │
              │     ▼
              │   preProfessionalForm → FormProfessionalOne (DNI photos)
              │     │  router.push
              │     ▼
              │   preProfessionalForm → FormProfessionalTwo (category, bio, portfolio)
              │     │  router.push
              │     ▼
              │   preProfessionalForm → FormProfessionalThree (location, schedule)
              │     │  router.push
              │     ▼
              │   preProfessionalForm → FormProfessionalFour (CBU/payment)
              │     │  submitProfile() → saves everything to Supabase
              │     │  setStatus("pendingReview")
              │     ▼
              │   pendingReview → AccountStatusScreen ("Esperando validación")
              │     │
              │     ├── Admin approves → authenticatedProfessional → /(professional)/home
              │     └── Admin rejects  → rejected → AccountStatusScreen
              │
              └── RETURNING pro (profile_complete=true, identity_status=approved)
                    → authenticatedProfessional → /(professional)/home
*/
