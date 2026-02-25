import { View, Text, Pressable, StyleSheet } from "react-native";
import { COLORS, SIZES } from "@/appASSETS/theme";
import { AdminUser } from "../Type/AdminTypes";
import RoleBadge from "./RoleBadge";

interface UserTableRowProps {
  user: AdminUser;
  onPress: (user: AdminUser) => void;
}

export default function UserTableRow({ user, onPress }: UserTableRowProps) {
  return (
    <Pressable
      style={({ hovered }) => [styles.row, hovered && styles.rowHovered]}
      onPress={() => onPress(user)}
    >
      <View style={styles.cellName}>
        <Text style={styles.nameText} numberOfLines={1}>
          {user.legalName ?? "—"}
        </Text>
        <Text style={styles.emailText} numberOfLines={1}>
          {user.email}
        </Text>
      </View>

      <View style={styles.cellRole}>
        <RoleBadge role={user.role} />
      </View>

      <View style={styles.cellStatus}>
        <Text style={styles.statusText}>
          {user.profileComplete ? "Completo" : "Incompleto"}
        </Text>
      </View>

      <View style={styles.cellDate}>
        <Text style={styles.dateText}>
          {user.createdAt.toLocaleDateString("es-AR")}
        </Text>
      </View>

      <View style={styles.cellAction}>
        <Text style={styles.actionText}>Ver</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.backgroundLight,
  },
  rowHovered: {
    backgroundColor: COLORS.backgroundLight,
  },
  cellName: {
    flex: 3,
    gap: 2,
  },
  nameText: {
    fontSize: SIZES.body4,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
  emailText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  cellRole: {
    flex: 1.5,
    alignItems: "flex-start",
  },
  cellStatus: {
    flex: 1.5,
  },
  statusText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  cellDate: {
    flex: 1.5,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  cellAction: {
    flex: 0.5,
    alignItems: "center",
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.tertiary,
  },
});
