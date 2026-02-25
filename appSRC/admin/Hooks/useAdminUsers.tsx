import { useQuery } from "@tanstack/react-query";
import { AdminUserService } from "../Service/AdminUserService";
import { AdminUserFilters } from "../Type/AdminTypes";

export function useAdminUsers(filters: AdminUserFilters) {
  const query = useQuery({
    queryKey: ["admin", "users", filters],
    queryFn: () => AdminUserService.fetchUsers(filters),
    staleTime: 1000 * 60 * 2,
  });

  return {
    users: query.data?.users ?? [],
    totalCount: query.data?.totalCount ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
