
export type UserRole = "client" | "professional" | "employer" | "admin";

export type AuthStatus =
  | "unknown"          
  | "anonymous"        
  | "preAuth"      
  | "preTypeOfUser"   
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
  isLoading?: boolean;
  lastError?: string | null;
};
