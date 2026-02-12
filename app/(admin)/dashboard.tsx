import { View, Text, StyleSheet } from "react-native";
import { COLORS, SIZES } from "@/appASSETS/theme";

/**
 * AdminDashboard — Main overview page for the admin panel.
 * Displays summary cards with key platform metrics.
 */
export default function AdminDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Dashboard</Text>

      <View style={styles.grid}>
        <MetricCard title="Usuarios Totales" value="—" />
        <MetricCard title="Profesionales Activos" value="—" />
        <MetricCard title="Reservas del Mes" value="—" />
        <MetricCard title="Ingresos del Mes" value="—" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actividad Reciente</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Los datos se mostrarán aquí una vez conectados los servicios.
          </Text>
        </View>
      </View>
    </View>
  );
}

/** Reusable metric card */
function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.card}>
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
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: SIZES.h3,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  placeholder: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  placeholderText: {
    fontSize: SIZES.body4,
    color: COLORS.textSecondary,
  },
});
