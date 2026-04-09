import { View, Text, StyleSheet, TouchableOpacity, Platform, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES } from "@/appASSETS/theme";
import { AppGateStatus } from "@/appSRC/appConfig/Type/AppConfigType";

// IDs de las stores — hardcodeados porque son permanentes a lo largo de la app.
// Si cambian (muy raro), se actualizan aquí.
const IOS_APP_ID = "6754884746";
const ANDROID_PACKAGE = "com.the.zolver.app";

const IOS_STORE_URL = `https://apps.apple.com/app/id${IOS_APP_ID}`;
const ANDROID_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;

interface AppGateScreenProps {
  status: Exclude<AppGateStatus, { kind: "ok" }>;
}

/**
 * Pantalla de bloqueo que se muestra cuando:
 *  - El gate remoto indica modo mantenimiento, o
 *  - La versión instalada es menor a `min_version`
 *
 * Reemplaza al `<Slot/>` raíz en `app/_layout.tsx`, así que ninguna
 * otra pantalla se monta mientras este estado esté activo.
 */
export function AppGateScreen({ status }: AppGateScreenProps) {
  const isForceUpdate = status.kind === "force_update";

  const handleOpenStore = async () => {
    const url = Platform.OS === "ios" ? IOS_STORE_URL : ANDROID_STORE_URL;
    try {
      await Linking.openURL(url);
    } catch {
      // No-op: si el sistema no puede abrir la URL, el usuario verá el mensaje.
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons
          name={isForceUpdate ? "cloud-download-outline" : "construct-outline"}
          size={56}
          color={COLORS.brandDeep}
        />
      </View>

      <Text style={styles.title}>
        {isForceUpdate ? "Actualización requerida" : "Estamos mejorando la app"}
      </Text>

      <Text style={styles.message}>{status.message}</Text>

      {isForceUpdate && (
        <TouchableOpacity style={styles.button} onPress={handleOpenStore}>
          <Text style={styles.buttonText}>
            {Platform.OS === "ios" ? "Abrir App Store" : "Abrir Play Store"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.backgroundLight,
    padding: SIZES.padding * 2,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.brandLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SIZES.padding * 1.5,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: SIZES.base,
  },
  message: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SIZES.padding * 2,
    paddingHorizontal: SIZES.padding,
  },
  button: {
    backgroundColor: COLORS.brandDeep,
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.base * 1.5,
    borderRadius: SIZES.radius,
  },
  buttonText: {
    ...FONTS.h3,
    color: COLORS.white,
  },
});
