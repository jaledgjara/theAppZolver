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

/** DTO from Supabase join: professional_profiles + user_accounts */
export interface PendingProfessionalDTO {
  user_id: string;
  doc_front_url: string | null;
  doc_back_url: string | null;
  main_category_id: string | null;
  specialization_title: string;
  enrollment_number: string;
  biography: string;
  portfolio_urls: string[];
  base_lat: number;
  base_lng: number;
  coverage_radius_km: number;
  type_work: string;
  financial_info: { cbu_alias?: string } | null;
  identity_status: string;
  created_at: string;
  user_accounts: {
    auth_uid: string;
    legal_name: string | null;
    email: string;
    phone: string | null;
    created_at: string;
  };
}

/** Domain model for pending professional review */
export interface PendingProfessional {
  authUid: string;
  legalName: string | null;
  email: string;
  phone: string | null;
  createdAt: Date;
  userId: string;
  docFrontUrl: string | null;
  docBackUrl: string | null;
  mainCategoryId: string | null;
  specializationTitle: string;
  enrollmentNumber: string;
  biography: string;
  portfolioUrls: string[];
  baseLat: number;
  baseLng: number;
  coverageRadiusKm: number;
  typeWork: string;
  financialInfo: { cbu_alias?: string } | null;
  identityStatus: string;
  profileCreatedAt: Date;
}
