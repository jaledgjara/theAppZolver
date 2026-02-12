import { Slot, Link } from "expo-router";
import { View, Text, StyleSheet, Platform, Pressable } from "react-native";
import { COLORS, SIZES } from "@/appASSETS/theme";

/**
 * PublicLayout — Layout for the public-facing web pages.
 * Renders a top Navbar and a footer. Content is rendered via <Slot />.
 * On native platforms, it renders just the Slot without web chrome.
 */
export default function PublicLayout() {
  console.log("🌐 [PublicLayout] RENDER | Platform:", Platform.OS);

  if (Platform.OS !== "web") {
    return <Slot />;
  }

  return (
    <View style={styles.container}>
      <PublicNavbar />
      <View style={styles.content}>
        <Slot />
      </View>
      <PublicFooter />
    </View>
  );
}

/** Top navigation bar for the public web */
function PublicNavbar() {
  return (
    <View style={styles.navbar}>
      <View style={styles.navInner}>
        <Link href="/(public)" asChild>
          <Pressable>
            <Text style={styles.logo}>Zolver</Text>
          </Pressable>
        </Link>

        <View style={styles.navLinks}>
          <Link href="/(auth)/SignInScreen" asChild>
            <Pressable style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Iniciar Sesión</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}

/** Footer for the public web */
function PublicFooter() {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>
        © {new Date().getFullYear()} Zolver. Todos los derechos reservados.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  // --- Navbar ---
  navbar: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: SIZES.padding,
  },
  navInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
  },
  logo: {
    fontSize: SIZES.h2,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  navLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: SIZES.radius,
  },
  ctaButtonText: {
    color: COLORS.textPrimary,
    fontWeight: "600",
    fontSize: SIZES.body4,
  },
  // --- Content ---
  content: {
    flex: 1,
  },
  // --- Footer ---
  footer: {
    backgroundColor: COLORS.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 24,
    paddingHorizontal: SIZES.padding,
    alignItems: "center",
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: SIZES.h4,
  },
});
