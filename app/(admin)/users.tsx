import { View, Text, StyleSheet } from "react-native";
import { COLORS, SIZES } from "@/appASSETS/theme";

/**
 * AdminUsers — User management page for the admin panel.
 * Will display a list/table of all users with filtering and actions.
 */
export default function AdminUsers() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Gestión de Usuarios</Text>
      </View>

      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, styles.tableCellName]}>Nombre</Text>
          <Text style={[styles.tableCell, styles.tableCellEmail]}>Email</Text>
          <Text style={[styles.tableCell, styles.tableCellRole]}>Rol</Text>
          <Text style={[styles.tableCell, styles.tableCellStatus]}>Estado</Text>
        </View>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            La tabla de usuarios se llenará una vez conectados los servicios de
            datos.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: SIZES.h2,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  tableContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.backgroundLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableCell: {
    fontSize: SIZES.body4,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  tableCellName: {
    flex: 2,
  },
  tableCellEmail: {
    flex: 3,
  },
  tableCellRole: {
    flex: 1,
  },
  tableCellStatus: {
    flex: 1,
  },
  placeholder: {
    padding: 48,
    alignItems: "center",
  },
  placeholderText: {
    fontSize: SIZES.body4,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});
