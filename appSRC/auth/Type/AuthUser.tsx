
export type UserRole = "client" | "professional" | "employer" | "admin";

export type AuthStatus =
  | "unknown"          
  | "anonymous"        
  | "preAuth"         
  | "authenticated"    
  | "incompleteProfile"; 

export type AuthUser = {
  uid: string;
  email?: string | null;
  phoneNumber?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  profileComplete: boolean; 
};

// appSRC/auth/Type/AuthUser.ts

export type AuthUserSession = {
  status: AuthStatus;
  user: AuthUser | null;

  /**
   * ⚠️ Deprecated:
   *  ya no se usa como bandera global de carga.
   *  Se reemplaza por:
   *   - isBootLoading → carga inicial (splash / auth)
   *   - isActionLoading → carga de acciones (sign-in, update, etc.)
   */
  isLoading?: boolean;

  lastError?: string | null;
};
