import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { COLORS, SIZES } from "@/appASSETS/theme";
import { AdminUserService } from "@/appSRC/admin/Service/AdminUserService";
import PendingProfessionalCard from "@/appSRC/admin/Screen/PendingProfessionalCard";

export default function PendingsScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "pendings"],
    queryFn: () => AdminUserService.fetchPendingProfessionals(),
    staleTime: 1000 * 60 * 2,
  });

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Profesionales Pendientes</Text>

      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.tertiary} size="large" />
          <Text style={styles.loadingText}>Cargando solicitudes...</Text>
        </View>
      )}

      {error && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            Error al cargar: {(error as Error).message}
          </Text>
        </View>
      )}

      {data && data.length === 0 && (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            No hay profesionales pendientes de revisión.
          </Text>
        </View>
      )}

      {data && data.length > 0 && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {data.map((professional) => (
            <PendingProfessionalCard
              key={professional.userId}
              professional={professional}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageTitle: {
    fontSize: SIZES.h2,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 24,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: SIZES.body4,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: SIZES.body4,
    color: COLORS.error,
  },
  emptyText: {
    fontSize: SIZES.body3,
    color: COLORS.textSecondary,
  },
  listContent: {
    paddingBottom: 40,
  },
});
