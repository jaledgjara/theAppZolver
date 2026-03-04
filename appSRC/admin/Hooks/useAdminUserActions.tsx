import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminUserService } from "../Service/AdminUserService";

export function useAdminUserActions() {
  const queryClient = useQueryClient();

  const changeRoleMutation = useMutation({
    mutationFn: ({
      authUid,
      role,
    }: {
      authUid: string;
      role: "client" | "professional" | "admin";
    }) => AdminUserService.updateUserRole(authUid, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      userId,
      status,
    }: {
      userId: string;
      status: "approved" | "rejected" | "verifiedProfessional";
    }) => AdminUserService.updateProfessionalStatus(userId, status),
    onSuccess: (_data, variables) => {
      console.log(`[AdminActions] onSuccess — status: ${variables.status}`);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      const msg =
        variables.status === "verifiedProfessional"
          ? "Profesional verificado exitosamente."
          : variables.status === "rejected"
            ? "Profesional rechazado."
            : "Estado actualizado.";
      window.alert(msg);
    },
    onError: (error: Error) => {
      console.error("[AdminActions] onError:", error.message);
      window.alert(`Error: ${error.message}`);
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({
      userId,
      fields,
    }: {
      userId: string;
      fields: Partial<{
        specialization_title: string;
        biography: string;
        enrollment_number: string;
        coverage_radius_km: number;
      }>;
    }) => AdminUserService.updateProfessionalProfile(userId, fields),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pendings"] });
    },
  });

  return {
    changeRole: changeRoleMutation.mutate,
    isChangingRole: changeRoleMutation.isPending,
    changeRoleError: changeRoleMutation.error,
    approveProfessional: (userId: string) =>
      updateStatusMutation.mutate({ userId, status: "approved" }),
    rejectProfessional: (userId: string) =>
      updateStatusMutation.mutate({ userId, status: "rejected" }),
    verifyProfessional: (userId: string) =>
      updateStatusMutation.mutate({ userId, status: "verifiedProfessional" }),
    isUpdatingStatus: updateStatusMutation.isPending,
    updateStatusError: updateStatusMutation.error,
    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,
  };
}
