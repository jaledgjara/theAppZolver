import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { COLORS, SIZES } from "@/appASSETS/theme";
import { AdminUserService } from "@/appSRC/admin/Service/AdminUserService";

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => AdminUserService.fetchDashboardStats(),
    staleTime: 1000 * 60 * 5,
  });

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Dashboard</Text>

      <View style={styles.grid}>
        <MetricCard
          title="Usuarios Totales"
          value={isLoading ? "..." : String(data?.totalUsers ?? 0)}
        />
        <MetricCard
          title="Clientes"
          value={isLoading ? "..." : String(data?.totalClients ?? 0)}
        />
        <MetricCard
          title="Profesionales"
          value={isLoading ? "..." : String(data?.totalProfessionals ?? 0)}
        />
        <MetricCard
          title="Profesionales Pendientes"
          value={isLoading ? "..." : String(data?.pendingProfessionals ?? 0)}
          highlight={!!data?.pendingProfessionals}
        />
      </View>

      {isLoading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={COLORS.tertiary} />
        </View>
      )}
    </View>
  );
}

function MetricCard({
  title,
  value,
  highlight,
}: {
  title: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.card, highlight && styles.cardHighlight]}>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 32,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: 24,
    minWidth: 200,
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHighlight: {
    borderColor: COLORS.warning,
    borderWidth: 2,
  },
  cardValue: {
    fontSize: SIZES.h1,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: SIZES.body4,
    color: COLORS.textSecondary,
  },
  loadingRow: {
    alignItems: "center",
    paddingVertical: 16,
  },
});
