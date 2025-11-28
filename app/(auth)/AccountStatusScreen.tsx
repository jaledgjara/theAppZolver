import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Linking } from "react-native";
import { AntDesign } from "@expo/vector-icons"; // 👈 Usamos AntDesign según tu captura
import { COLORS, FONTS } from "@/appASSETS/theme";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";

// Tipos de iconos disponibles en AntDesign
type AntDesignIconName = React.ComponentProps<typeof AntDesign>["name"];

type VisualStatusType = "pending" | "approved" | "rejected";

interface StatusConfig {
  icon: AntDesignIconName;
  color: string;
  title: string;
  desc: string;
  btnText: string;
}

// Configuración Visual con AntDesign
const STATUS_CONFIG: Record<VisualStatusType, StatusConfig> = {
  pending: {
    icon: "clock-circle", // 🕒 Reloj (según tu captura)
    color: COLORS.warning ?? "#FFB300",
    title: "Verificación en Proceso",
    desc: "Tu perfil ha sido enviado. Estamos revisando tus datos. Te notificaremos pronto.",
    btnText: "Entendido",
  },
  approved: {
    icon: "check-circle", // ✅ Check
    color: COLORS.success ?? "#4CAF50",
    title: "¡Perfil Aprobado!",
    desc: "Tus datos han sido validados correctamente. Ya puedes comenzar a ofrecer servicios.",
    btnText: "Ir al Inicio",
  },
  rejected: {
    icon: "close-circle", // ❌ Cruz
    color: COLORS.error ?? "#F44336",
    title: "Solicitud Rechazada",
    desc: "Hubo un problema con la validación. Por favor, contacta a soporte para más detalles.",
    btnText: "Contactar Soporte",
  },
};

export default function AccountStatusScreen() {
  const router = useRouter();
  const { status: authStatus, setStatus } = useAuthStore();

  // 1. Determinar estado visual
  const getVisualStatus = (): VisualStatusType => {
    if (authStatus === "rejected") return "rejected";
    if (authStatus === "authenticatedProfessional") return "approved";
    return "pending";
  };

  const visualStatus = getVisualStatus();
  const config = STATUS_CONFIG[visualStatus];

  // 2. Animaciones simples (Scale & Opacity)
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visualStatus]);

  // 3. Acción del botón
  const handlePress = () => {
    if (visualStatus === "approved") {
      setStatus("authenticatedProfessional");
      router.replace("/(professional)/(tabs)/home");
    } else if (visualStatus === "rejected") {
      Linking.openURL("mailto:soporte@zolver.app");
    } else {
      console.log("En espera...");
      // Opcional: router.back() si quieres permitir salir
    }
  };

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Estado de cuenta" showBackButton={false} />

      <View style={styles.contentContainer}>
        {/* Icono Animado */}
        <Animated.View
          style={[
            styles.iconWrapper,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}>
          <AntDesign name={config.icon} size={100} color={config.color} />
        </Animated.View>

        {/* Textos */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.description}>{config.desc}</Text>
        </View>

        {/* Botón */}
        <View style={styles.footer}>
          <LargeButton
            title={config.btnText}
            onPress={handlePress}
            style={{ backgroundColor: COLORS.primary }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white ?? "#FFFFFF",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -50,
  },
  iconWrapper: {
    marginBottom: 30,
    // Opcional: Si quieres un fondo circular suave detrás del icono
    // backgroundColor: "#F5F5F5",
    // borderRadius: 100,
    // padding: 20,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.textPrimary ?? "#000",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondary ?? "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  footer: {
    width: "100%",
    position: "absolute",
    bottom: 50,
  },
});
