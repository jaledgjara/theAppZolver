import { supabase } from "@/appSRC/services/supabaseClient";
import {
  AdminUser,
  AdminUserDTO,
  AdminUserFilters,
  AdminProfessionalDetail,
  PaginatedUsers,
  PendingProfessional,
  PendingProfessionalDTO,
} from "../Type/AdminTypes";

// DTO → Domain mapper
function mapAdminUser(dto: AdminUserDTO): AdminUser {
  return {
    id: dto.id,
    authUid: dto.auth_uid,
    email: dto.email,
    legalName: dto.legal_name,
    phone: dto.phone,
    role: dto.role,
    profileComplete: dto.profile_complete,
    createdAt: new Date(dto.created_at),
    avatarUrl: dto.avatar_url,
  };
}

function mapPendingProfessional(dto: PendingProfessionalDTO): PendingProfessional {
  const ua = dto.user_accounts;
  return {
    authUid: ua.auth_uid,
    legalName: ua.legal_name,
    email: ua.email,
    phone: ua.phone,
    createdAt: new Date(ua.created_at),
    userId: dto.user_id,
    docFrontUrl: dto.doc_front_url,
    docBackUrl: dto.doc_back_url,
    mainCategoryId: dto.main_category_id,
    specializationTitle: dto.specialization_title,
    enrollmentNumber: dto.enrollment_number,
    biography: dto.biography,
    portfolioUrls: dto.portfolio_urls ?? [],
    baseLat: dto.base_lat,
    baseLng: dto.base_lng,
    coverageRadiusKm: dto.coverage_radius_km,
    typeWork: dto.type_work,
    financialInfo: dto.financial_info,
    identityStatus: dto.identity_status,
    profileCreatedAt: new Date(dto.created_at),
  };
}

export const AdminUserService = {
  /** Fetch paginated user list with optional search and role filter */
  async fetchUsers(filters: AdminUserFilters): Promise<PaginatedUsers> {
    let query = supabase
      .from("user_accounts")
      .select("*", { count: "exact" });

    if (filters.search) {
      query = query.or(
        `legal_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      );
    }

    if (filters.role !== "all") {
      query = query.eq("role", filters.role);
    }

    const from = filters.page * filters.pageSize;
    const to = from + filters.pageSize - 1;
    query = query.range(from, to).order("created_at", { ascending: false });

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      users: (data as AdminUserDTO[] || []).map(mapAdminUser),
      totalCount: count ?? 0,
    };
  },

  /** Fetch single user by auth_uid */
  async fetchUserDetail(authUid: string): Promise<AdminUser> {
    const { data, error } = await supabase
      .from("user_accounts")
      .select("*")
      .eq("auth_uid", authUid)
      .single();

    if (error) throw new Error(error.message);
    return mapAdminUser(data as AdminUserDTO);
  },

  /** Fetch professional profile for a given user_id (Postgres UUID) */
  async fetchProfessionalDetail(
    userId: string
  ): Promise<AdminProfessionalDetail | null> {
    const { data, error } = await supabase
      .from("professional_profiles")
      .select("user_id, type_work, identity_status, is_active, service_area")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // not found
      throw new Error(error.message);
    }

    return {
      userId: data.user_id,
      typeWork: data.type_work,
      identityStatus: data.identity_status,
      isActive: data.is_active,
      serviceArea: data.service_area,
    };
  },

  /** Change a user's role */
  async updateUserRole(
    authUid: string,
    newRole: "client" | "professional" | "admin"
  ): Promise<void> {
    const { error } = await supabase
      .from("user_accounts")
      .update({ role: newRole })
      .eq("auth_uid", authUid);

    if (error) throw new Error(error.message);
  },

  /** Approve, verify, or reject a professional (updates identity_status + is_active) */
  async updateProfessionalStatus(
    userId: string,
    status: "approved" | "rejected" | "verifiedProfessional"
  ): Promise<void> {
    console.log(`[AdminService] updateProfessionalStatus START — userId: ${userId}, status: ${status}`);

    const { data, error, status: httpStatus, statusText } = await supabase
      .from("professional_profiles")
      .update({
        identity_status: status,
        is_active: status !== "rejected",
      })
      .eq("user_id", userId)
      .select("user_id");

    console.log(`[AdminService] updateProfessionalStatus RESPONSE — httpStatus: ${httpStatus}, statusText: ${statusText}`);
    console.log(`[AdminService] data:`, JSON.stringify(data));
    console.log(`[AdminService] error:`, JSON.stringify(error));

    if (error) {
      console.error(`[AdminService] Supabase error:`, error.message, error.code, error.details);
      throw new Error(error.message);
    }
    if (!data || data.length === 0) {
      console.error(`[AdminService] 0 rows updated — RLS blocked or user_id not found`);
      throw new Error(
        "No se pudo actualizar el perfil. Verifica permisos de administrador (RLS)."
      );
    }

    console.log(`[AdminService] updateProfessionalStatus SUCCESS — ${data.length} row(s) updated`);
  },

  /** Fetch a platform setting by key */
  async fetchPlatformSetting(key: string): Promise<string | null> {
    const { data, error } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", key)
      .single();

    if (error) {
      console.error(`[AdminService] Error fetching setting '${key}':`, error.message);
      return null;
    }
    return data?.value ?? null;
  },

  /** Update a platform setting */
  async updatePlatformSetting(key: string, value: string): Promise<void> {
    const { error } = await supabase
      .from("platform_settings")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("key", key);

    if (error) throw new Error(error.message);
  },

  /** Fetch all pending professionals with user account data */
  async fetchPendingProfessionals(): Promise<PendingProfessional[]> {
    const { data, error } = await supabase
      .from("professional_profiles")
      .select(
        "*, user_accounts!inner(auth_uid, legal_name, email, phone, created_at)"
      )
      .eq("identity_status", "pending")
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    return ((data as PendingProfessionalDTO[]) || []).map(
      mapPendingProfessional
    );
  },

  /** Update editable fields on a professional profile */
  async updateProfessionalProfile(
    userId: string,
    fields: Partial<{
      specialization_title: string;
      biography: string;
      enrollment_number: string;
      coverage_radius_km: number;
    }>
  ): Promise<void> {
    const { error } = await supabase
      .from("professional_profiles")
      .update(fields)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
  },

  /** Fetch aggregate stats for the dashboard */
  async fetchDashboardStats(): Promise<{
    totalUsers: number;
    totalClients: number;
    totalProfessionals: number;
    pendingProfessionals: number;
  }> {
    const [totalRes, clientsRes, prosRes, pendingRes] = await Promise.all([
      supabase
        .from("user_accounts")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("user_accounts")
        .select("*", { count: "exact", head: true })
        .eq("role", "client"),
      supabase
        .from("user_accounts")
        .select("*", { count: "exact", head: true })
        .eq("role", "professional"),
      supabase
        .from("professional_profiles")
        .select("*", { count: "exact", head: true })
        .eq("identity_status", "pending"),
    ]);

    return {
      totalUsers: totalRes.count ?? 0,
      totalClients: clientsRes.count ?? 0,
      totalProfessionals: prosRes.count ?? 0,
      pendingProfessionals: pendingRes.count ?? 0,
    };
  },
};
