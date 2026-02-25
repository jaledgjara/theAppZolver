/** Row shape from user_accounts table */
export interface AdminUserDTO {
  id: string;
  auth_uid: string;
  email: string;
  legal_name: string | null;
  phone: string | null;
  role: "client" | "professional" | "admin" | null;
  profile_complete: boolean;
  created_at: string;
  avatar_url: string | null;
}

/** Domain model for admin UI */
export interface AdminUser {
  id: string;
  authUid: string;
  email: string;
  legalName: string | null;
  phone: string | null;
  role: "client" | "professional" | "admin" | null;
  profileComplete: boolean;
  createdAt: Date;
  avatarUrl: string | null;
}

/** Professional profile data for admin view */
export interface AdminProfessionalDetail {
  userId: string;
  typeWork: "instant" | "quote" | null;
  identityStatus: "pending" | "approved" | "rejected" | "verified";
  isActive: boolean;
  serviceArea: string | null;
}

/** Filters for user list query */
export interface AdminUserFilters {
  search: string;
  role: "all" | "client" | "professional" | "admin";
  page: number;
  pageSize: number;
}

/** Paginated response */
export interface PaginatedUsers {
  users: AdminUser[];
  totalCount: number;
}
