import { View, Text, StyleSheet } from "react-native";
import { COLORS, SIZES } from "@/appASSETS/theme";

interface RoleBadgeProps {
  role: "client" | "professional" | "admin" | null;
}

const ROLE_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  admin: { label: "Admin", bg: COLORS.error, text: COLORS.white },
  professional: { label: "Profesional", bg: COLORS.tertiary, text: COLORS.white },
  client: { label: "Cliente", bg: COLORS.primary, text: COLORS.textPrimary },
};

export default function RoleBadge({ role }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role ?? ""] ?? {
    label: "Sin rol",
    bg: COLORS.border,
    text: COLORS.textSecondary,
  };

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});
