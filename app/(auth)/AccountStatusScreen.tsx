import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Linking, Alert } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { COLORS } from "@/appASSETS/theme";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { syncUserSession } from "@/appSRC/auth/Service/SessionService";

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
    icon: "clock-circle",
    color: COLORS.warning ?? "#FFB300",
    title: "Verificación en Proceso",
    desc: "Tu perfil ha sido enviado. Estamos revisando tus datos. Te notificaremos pronto.",
    btnText: "Verificar estado",
  },
  approved: {
    icon: "check-circle",
    color: COLORS.success ?? "#4CAF50",
    title: "¡Perfil Aprobado!",
    desc: "Tus datos han sido validados correctamente. Ya puedes comenzar a ofrecer servicios.",
    btnText: "Ir al Inicio",
  },
  rejected: {
    icon: "close-circle",
    color: COLORS.error ?? "#F44336",
    title: "Solicitud Rechazada",
    desc: "Tu solicitud fue rechazada. Por favor ingresa a www.zolver.com y contacta al soporte al cliente.",
    btnText: "Ir a Zolver",
  },
};

export default function AccountStatusScreen() {
  const { status: authStatus, setStatus } = useAuthStore();

  console.log(`[AccountStatusScreen] authStatus: ${authStatus}`);

  // 1. Determinar estado visual
  const getVisualStatus = (): VisualStatusType => {
    if (authStatus === "rejected") return "rejected";
    if (authStatus === "authenticatedProfessional") return "approved";
    return "pending";
  };

  const visualStatus = getVisualStatus();
  const config = STATUS_CONFIG[visualStatus];

  console.log(`[AccountStatusScreen] visualStatus: ${visualStatus}`);

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

  const [loading, setLoading] = useState(false);

  // 3. Acción del botón
  const handlePress = async () => {
    console.log(`[AccountStatusScreen] handlePress — visualStatus: ${visualStatus}`);

    if (visualStatus === "pending") {
      // Re-sync con backend para ver si el admin ya aprobó
      setLoading(true);
      try {
        console.log(`[AccountStatusScreen] Syncing session...`);
        const session = await syncUserSession();
        console.log(`[AccountStatusScreen] Session result:`, JSON.stringify(session));

        if (
          session?.ok &&
          (session.identityStatus === "approved" ||
            session.identityStatus === "verified" ||
            session.identityStatus === "verifiedProfessional")
        ) {
          console.log(`[AccountStatusScreen] Status is approved/verified — redirecting`);
          setStatus("authenticatedProfessional");
        } else if (session?.ok && session.identityStatus === "rejected") {
          console.log(`[AccountStatusScreen] Status is rejected`);
          setStatus("rejected");
        } else {
          Alert.alert(
            "Verificación pendiente",
            "Tu perfil aún no ha sido aprobado. Intenta más tarde."
          );
        }
      } catch (err) {
        console.error(`[AccountStatusScreen] Error syncing:`, err);
        Alert.alert("Error", "No se pudo verificar el estado de tu cuenta.");
      } finally {
        setLoading(false);
      }
    } else if (visualStatus === "approved") {
      // Ya está aprobado — re-sync y redirigir
      setLoading(true);
      try {
        const session = await syncUserSession();
        if (
          session?.ok &&
          (session.identityStatus === "approved" ||
            session.identityStatus === "verified" ||
            session.identityStatus === "verifiedProfessional")
        ) {
          setStatus("authenticatedProfessional");
        } else {
          Alert.alert(
            "Verificación pendiente",
            "Tu perfil aún no ha sido aprobado. Intenta más tarde."
          );
        }
      } catch {
        Alert.alert("Error", "No se pudo verificar el estado de tu cuenta.");
      } finally {
        setLoading(false);
      }
    } else if (visualStatus === "rejected") {
      console.log(`[AccountStatusScreen] Opening www.zolver.com`);
      Linking.openURL("https://www.zolver.com");
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
            loading={loading}
            disabled={loading}
            backgroundColor={config.color}
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
