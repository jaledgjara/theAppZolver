import { useState, useCallback } from "react";
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { COLORS, SIZES } from "@/appASSETS/theme";
import { useAdminUsers } from "@/appSRC/admin/Hooks/useAdminUsers";
import { AdminUser, AdminUserFilters } from "@/appSRC/admin/Type/AdminTypes";
import UserSearchBar from "@/appSRC/admin/Screen/UserSearchBar";
import UserTableRow from "@/appSRC/admin/Screen/UserTableRow";
import Pagination from "@/appSRC/admin/Screen/Pagination";
import UserDetailModal from "@/appSRC/admin/Screen/UserDetailModal";

const PAGE_SIZE = 20;

export default function AdminUsers() {
  const [filters, setFilters] = useState<AdminUserFilters>({
    search: "",
    role: "all",
    page: 0,
    pageSize: PAGE_SIZE,
  });
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const { users, totalCount, isLoading, isError } = useAdminUsers(filters);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handlePageChange = useCallback(
    (page: number) => setFilters((f) => ({ ...f, page })),
    []
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Gestión de Usuarios</Text>
        <Text style={styles.countText}>
          {totalCount} usuario{totalCount !== 1 ? "s" : ""}
        </Text>
      </View>

      <UserSearchBar filters={filters} onFiltersChange={setFilters} />

      <View style={styles.tableContainer}>
        {/* Table header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, { flex: 3 }]}>Nombre / Email</Text>
          <Text style={[styles.headerCell, { flex: 1.5 }]}>Rol</Text>
          <Text style={[styles.headerCell, { flex: 1.5 }]}>Perfil</Text>
          <Text style={[styles.headerCell, { flex: 1.5 }]}>Registro</Text>
          <Text style={[styles.headerCell, { flex: 0.5 }]} />
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={COLORS.tertiary} size="large" />
          </View>
        ) : isError ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>
              Error al cargar usuarios. Verificá tus permisos.
            </Text>
          </View>
        ) : users.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No se encontraron usuarios.</Text>
          </View>
        ) : (
          <ScrollView>
            {users.map((user) => (
              <UserTableRow
                key={user.id}
                user={user}
                onPress={setSelectedUser}
              />
            ))}
          </ScrollView>
        )}
      </View>

      <Pagination
        page={filters.page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      <UserDetailModal
        user={selectedUser}
        visible={selectedUser !== null}
        onClose={() => setSelectedUser(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: SIZES.h2,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  countText: {
    fontSize: SIZES.body4,
    color: COLORS.textSecondary,
  },
  tableContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    flex: 1,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.backgroundLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerCell: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  centered: {
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: SIZES.body4,
    color: COLORS.error,
    textAlign: "center",
  },
  emptyText: {
    fontSize: SIZES.body4,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});
