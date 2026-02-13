import React from "react";
import { Slot, Link } from "expo-router";
import {
  Image,
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
  Dimensions,
  ScrollView,
} from "react-native";
import { COLORS, SIZES } from "@/appASSETS/theme";

const WEB_MAX_WIDTH = 1200;
const { width } = Dimensions.get("window");

export default function PublicLayout() {
  // 1. Mobile Native: Sin layout web
  if (Platform.OS !== "web") {
    return <Slot />;
  }

  // 2. Web: Estructura Profesional
  return (
    <View style={styles.mainContainer}>
      <ProfessionalNavbar />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={true}>
        <View style={styles.pageContent}>
          <Slot />
        </View>

        <ProfessionalFooter />
      </ScrollView>
    </View>
  );
}

// ─── COMPONENTS ───

function ProfessionalNavbar() {
  return (
    <View style={styles.navbar}>
      <View style={styles.navInner}>
        {/* BRAND AREA: HUGE & PROFESSIONAL */}
        <Link href="/" asChild>
          <Pressable style={styles.logoContainer}>
            <Image
              // Asegúrate de que esta ruta sea correcta en tu estructura
              source={require("../../appASSETS/IconImage/logo-zZzNoBgX2.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View style={styles.logoTextColumn}>
              <Text style={styles.logoBrand}>ZOLVER</Text>
              <Text style={styles.logoTagline}>PLATFORMA</Text>
            </View>
          </Pressable>
        </Link>

        {/* WEB NAVIGATION TABS */}
        {width > 768 && (
          <View style={styles.navTabs}>
            <NavTab title="Servicios" href="/services" />
            <NavTab title="Cómo funciona" href="/how-it-works" />
            <NavTab title="Descargar App" href="/download" />
            <NavTab title="Soporte" href="/support" />
          </View>
        )}
      </View>
    </View>
  );
}

function NavTab({ title, href }: { title: string; href: string }) {
  return (
    <Link href={href as any} asChild>
      <Pressable style={styles.navTab}>
        <Text style={styles.navTabText}>{title}</Text>
      </Pressable>
    </Link>
  );
}

function ProfessionalFooter() {
  return (
    <View style={styles.footer}>
      <View style={styles.footerContent}>
        <View>
          <Text style={styles.footerBrand}>ZOLVER</Text>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} Zolver Platform. Todos los derechos
            reservados.
          </Text>
        </View>
        <View style={styles.footerLinks}>
          <Text style={styles.footerLinkItem}>Privacidad</Text>
          <Text style={styles.footerLinkItem}>Términos</Text>
          <Text style={styles.footerLinkItem}>Ayuda</Text>
        </View>
      </View>
    </View>
  );
}

// ─── STYLES ───

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  // ─── NAVBAR STYLES ───
  navbar: {
    backgroundColor: COLORS.tertiary,
    height: 120, // Altura aumentada para acomodar el logo "Huge"
    justifyContent: "center",
    zIndex: 100,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  navInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: WEB_MAX_WIDTH,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: SIZES.padding,
  },

  // HUGE LOGO CONTAINER
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16, // Espacio entre logo y texto
    paddingVertical: 10,
  },
  logoImage: {
    width: 90, // Imagen grande
    height: 90, // Imagen grande
  },
  logoTextColumn: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  logoBrand: {
    fontSize: 36, // Tipografía Masiva
    fontWeight: "900", // Extra Bold
    color: COLORS.white,
    letterSpacing: 2,
    lineHeight: 36, // Compacto para apilar con el tagline
    marginTop: 16,
  },
  logoTagline: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary, // Acento de color
    letterSpacing: 4, // Estilo "Premium"
    textTransform: "uppercase",
    marginTop: 5,
  },

  // TABS
  navTabs: {
    flexDirection: "row",
    gap: 40,
    height: "100%",
    alignItems: "center",
  },
  navTab: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  navTabText: {
    color: "rgba(255,255,255, 0.9)",
    fontWeight: "600",
    fontSize: 16,
    letterSpacing: 0.5,
  },

  // ─── SCROLL & CONTENT ───
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  pageContent: {
    flex: 1,
    width: "100%",
  },

  // ─── FOOTER ───
  footer: {
    backgroundColor: "#111", // Negro más profundo
    paddingVertical: 60,
    paddingHorizontal: SIZES.padding,
    marginTop: "auto",
  },
  footerContent: {
    maxWidth: WEB_MAX_WIDTH,
    width: "100%",
    alignSelf: "center",
    flexDirection: width > 768 ? "row" : "column",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 40,
  },
  footerBrand: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 24,
    marginBottom: 12,
    letterSpacing: 1,
    textAlign: width > 768 ? "left" : "center",
  },
  footerText: {
    color: "#666",
    fontSize: 13,
    textAlign: width > 768 ? "left" : "center",
  },
  footerLinks: {
    flexDirection: "row",
    gap: 32,
  },
  footerLinkItem: {
    color: "#999",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
