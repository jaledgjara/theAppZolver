import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  Platform,
  Dimensions,
  Image,
} from "react-native";
import { Ionicons, FontAwesome6 } from "@expo/vector-icons";
import { COLORS, SIZES } from "@/appASSETS/theme";

// ─── UTILS: Link Handling ───
const openLink = (url: string) => {
  Linking.openURL(url).catch((err) =>
    console.error("Error opening link:", err),
  );
};

// ─── COMPONENT: Store Badge Button ───
// Botones profesionales que simulan los badges oficiales
function StoreBadge({ type }: { type: "ios" | "android" }) {
  const isIOS = type === "ios";
  const iconName = isIOS ? "logo-apple" : "logo-google-playstore";
  const storeName = isIOS ? "App Store" : "Google Play";
  const subText = isIOS ? "Consíguelo en el" : "Disponible en";
  const url = isIOS ? "https://apps.apple.com" : "https://play.google.com";

  return (
    <Pressable style={styles.storeBadge} onPress={() => openLink(url)}>
      <Ionicons
        name={iconName}
        size={32}
        color="#fff"
        style={{ marginRight: 12 }}
      />
      <View>
        <Text style={styles.badgeSubText}>{subText}</Text>
        <Text style={styles.badgeStoreName}>{storeName}</Text>
      </View>
    </Pressable>
  );
}

// ─── PAGE COMPONENT ───
export default function DownloadPage() {
  return (
    <View style={styles.container}>
      {/* 1. HERO TEXT */}
      <View style={styles.textSection}>
        <Text style={styles.title}>Lleva las soluciones en tu bolsillo.</Text>
        <Text style={styles.subtitle}>
          Accede a miles de profesionales verificados, gestiona tus servicios y
          paga de forma segura desde cualquier lugar.
        </Text>
      </View>

      {/* 2. STORE BUTTONS */}
      <View style={styles.buttonsContainer}>
        <StoreBadge type="ios" />
        <StoreBadge type="android" />
      </View>

      {/* 3. QR SECTION (The "Black Image" Area) */}
      <View style={styles.qrContainer}>
        <View style={styles.qrCard}>
          {/* El Placeholder Negro Solicitado */}
          <View style={styles.qrBlackPlaceholder}>
            {/* Icono sutil dentro del negro para indicar escaneo */}
            <Image
              source={require("../../appASSETS/IconImage/qr-example.png")}
              style={styles.qrBlackPlaceholder}
            />
          </View>

          <View style={styles.qrTextCol}>
            <Text style={styles.qrTitle}>Escanea para descargar</Text>
            <Text style={styles.qrDesc}>
              Apunta la cámara de tu celular aquí para ir directo a la tienda.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── STYLES ───

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 100, // Espaciado vertical generoso
    paddingHorizontal: SIZES.padding,
    alignItems: "center",
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
  },

  // ─── TEXT SECTION ───
  textSection: {
    alignItems: "center",
    maxWidth: 800,
    marginBottom: 50,
  },
  title: {
    fontSize: 56,
    fontWeight: "600",
    color: COLORS.textPrimary,
    lineHeight: 64,
    marginBottom: 24,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 20,
    color: COLORS.textSecondary,
    textAlign: "center",
    maxWidth: 600,
    lineHeight: 30,
  },

  // ─── BUTTONS SECTION ───
  buttonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 20,
    marginBottom: 80,
    width: "100%",
  },
  storeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 200,
    justifyContent: "center",
    // Efecto de elevación suave
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  badgeSubText: {
    color: "white",
    fontSize: 10,
    fontWeight: "500",
  },
  badgeStoreName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    lineHeight: 22,
  },

  // ─── QR SECTION ───
  qrContainer: {
    width: "100%",
    alignItems: "center",
  },
  qrCard: {
    flexDirection:
      Platform.OS === "web" && Dimensions.get("window").width > 768
        ? "row"
        : "column",
    backgroundColor: COLORS.white,
    padding: 50,
    borderRadius: 30,
    alignItems: "center",
    gap: 40,
    // Sombra elegante para destacar el QR
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  // EL CUADRO NEGRO SOLICITADO
  qrBlackPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: "#000", // Negro absoluto
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  qrTextCol: {
    maxWidth: 300,
    alignItems:
      Platform.OS === "web" && Dimensions.get("window").width > 768
        ? "flex-start"
        : "center",
  },
  qrTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign:
      Platform.OS === "web" && Dimensions.get("window").width > 768
        ? "left"
        : "center",
  },
  qrDesc: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
    textAlign:
      Platform.OS === "web" && Dimensions.get("window").width > 768
        ? "left"
        : "center",
  },
});
