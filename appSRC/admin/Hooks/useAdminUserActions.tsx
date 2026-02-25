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
      status: "approved" | "rejected";
    }) => AdminUserService.updateProfessionalStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
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
    isUpdatingStatus: updateStatusMutation.isPending,
    updateStatusError: updateStatusMutation.error,
  };
}
