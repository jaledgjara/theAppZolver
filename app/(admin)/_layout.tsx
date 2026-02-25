import { Slot, usePathname, useRouter } from "expo-router";
import { View, Text, StyleSheet, Platform, Pressable } from "react-native";
import { COLORS, SIZES } from "@/appASSETS/theme";
import { useAdminAuthGuard } from "@/appSRC/auth/Hooks/useAdminAuthGuard";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import AdminLoginScreen from "@/appSRC/admin/Screen/AdminLoginScreen";

/** Admin sidebar navigation items */
interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/(admin)/dashboard" },
  { label: "Usuarios", href: "/(admin)/users" },
];

/**
 * AdminLayout — Protected layout for the admin panel.
 * Only accessible on web and only for users with `role: "admin"`.
 * Renders a sidebar + topbar chrome around the <Slot />.
 */
export default function AdminLayout() {
  const { isAdmin, isLoading, needsLogin } = useAdminAuthGuard();

  // While verifying admin role, show a loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Verificando permisos...</Text>
      </View>
    );
  }

  // Not authenticated — show admin login screen inline (no redirect)
  if (needsLogin) {
    return <AdminLoginScreen onLoginSuccess={() => {}} />;
  }

  // If not admin, the guard already redirects. Render nothing as fallback.
  if (!isAdmin) {
    return null;
  }

  // On native, admin is not supported — render a message
  if (Platform.OS !== "web") {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          El panel de administración solo está disponible en la versión web.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AdminSidebar />
      <View style={styles.main}>
        <AdminTopbar />
        <View style={styles.content}>
          <Slot />
        </View>
      </View>
    </View>
  );
}

/** Sidebar navigation */
function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.sidebarLogo}>Zolver</Text>
        <Text style={styles.sidebarBadge}>Admin</Text>
      </View>

      <View style={styles.sidebarNav}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.includes(
            item.href.replace("/(admin)", "")
          );
          return (
            <Pressable
              key={item.href}
              style={[
                styles.sidebarItem,
                isActive && styles.sidebarItemActive,
              ]}
              onPress={() => router.push(item.href as any)}
            >
              <Text
                style={[
                  styles.sidebarItemText,
                  isActive && styles.sidebarItemTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sidebarFooter}>
        <Pressable
          style={styles.sidebarItem}
          onPress={() => router.push("/(public)" as any)}
        >
          <Text style={styles.sidebarItemText}>Volver al sitio</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Top bar with user info */
function AdminTopbar() {
  const user = useAuthStore((s) => s.user);

  return (
    <View style={styles.topbar}>
      <Text style={styles.topbarTitle}>Panel de Administración</Text>
      <Text style={styles.topbarUser}>
        {user?.displayName ?? user?.email ?? "Admin"}
      </Text>
    </View>
  );
}

const SIDEBAR_WIDTH = 260;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: COLORS.backgroundLight,
  },
  // ─── Loading ───
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.backgroundLight,
  },
  loadingText: {
    fontSize: SIZES.body3,
    color: COLORS.textSecondary,
  },
  // ─── Sidebar ───
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: COLORS.textPrimary,
    paddingTop: 24,
    justifyContent: "flex-start",
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    gap: 8,
  },
  sidebarLogo: {
    fontSize: SIZES.h2,
    fontWeight: "700",
    color: COLORS.white,
  },
  sidebarBadge: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textPrimary,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  sidebarNav: {
    flex: 1,
    paddingTop: 12,
  },
  sidebarItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  sidebarItemActive: {
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  sidebarItemText: {
    fontSize: SIZES.body4,
    color: "rgba(255,255,255,0.7)",
  },
  sidebarItemTextActive: {
    color: COLORS.white,
    fontWeight: "600",
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingVertical: 12,
  },
  // ─── Main Area ───
  main: {
    flex: 1,
  },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topbarTitle: {
    fontSize: SIZES.h3,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  topbarUser: {
    fontSize: SIZES.body4,
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
    padding: 24,
  },
});
