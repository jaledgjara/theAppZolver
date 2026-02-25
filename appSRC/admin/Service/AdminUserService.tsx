import { supabase } from "@/appSRC/services/supabaseClient";
import {
  AdminUser,
  AdminUserDTO,
  AdminUserFilters,
  AdminProfessionalDetail,
  PaginatedUsers,
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

  /** Approve or reject a professional (updates identity_status + is_active) */
  async updateProfessionalStatus(
    userId: string,
    status: "approved" | "rejected"
  ): Promise<void> {
    const { error } = await supabase
      .from("professional_profiles")
      .update({
        identity_status: status,
        is_active: status === "approved",
      })
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
