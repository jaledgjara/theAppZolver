import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import {
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
} from "firebase/auth";
import { auth } from "@/APIconfig/firebaseAPIConfig";
import { COLORS, SIZES } from "@/appASSETS/theme";

interface AdminLoginScreenProps {
  onLoginSuccess: () => void;
}

export default function AdminLoginScreen({
  onLoginSuccess,
}: AdminLoginScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    console.log("[AdminLogin] Starting Google sign-in via signInWithPopup...");
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      console.log("[AdminLogin] GoogleAuthProvider created, calling signInWithPopup...");
      const result = await signInWithPopup(auth, provider);
      console.log("[AdminLogin] Google sign-in SUCCESS:", {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
      });
      onLoginSuccess();
    } catch (e: unknown) {
      const firebaseError = e as { code?: string; message?: string; customData?: Record<string, unknown> };
      console.error("[AdminLogin] Google sign-in FAILED:", {
        code: firebaseError.code,
        message: firebaseError.message,
        customData: firebaseError.customData,
        fullError: e,
      });
      setError(`Error Google: ${firebaseError.code ?? firebaseError.message ?? String(e)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    console.log("[AdminLogin] Starting Apple sign-in via signInWithPopup...");
    setIsLoading(true);
    setError(null);
    try {
      const provider = new OAuthProvider("apple.com");
      provider.addScope("email");
      provider.addScope("name");
      console.log("[AdminLogin] OAuthProvider(apple.com) created, calling signInWithPopup...");
      const result = await signInWithPopup(auth, provider);
      console.log("[AdminLogin] Apple sign-in SUCCESS:", {
        uid: result.user.uid,
        email: result.user.email,
      });
      onLoginSuccess();
    } catch (e: unknown) {
      const firebaseError = e as { code?: string; message?: string; customData?: Record<string, unknown> };
      console.error("[AdminLogin] Apple sign-in FAILED:", {
        code: firebaseError.code,
        message: firebaseError.message,
        customData: firebaseError.customData,
        fullError: e,
      });
      setError(`Error Apple: ${firebaseError.code ?? firebaseError.message ?? String(e)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.logo}>Zolver</Text>
          <Text style={styles.badge}>Admin</Text>
        </View>

        <Text style={styles.title}>Panel de Administración</Text>
        <Text style={styles.subtitle}>
          Iniciá sesión con una cuenta autorizada.
        </Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.buttons}>
          <Pressable
            style={[styles.button, styles.googleButton]}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.buttonText}>Continuar con Google</Text>
            )}
          </Pressable>

          <Pressable
            style={[styles.button, styles.appleButton]}
            onPress={handleAppleSignIn}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Continuar con Apple</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.backgroundLight,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 40,
    width: 400,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  logo: {
    fontSize: SIZES.h2,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  badge: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textPrimary,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  title: {
    fontSize: SIZES.h3,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: SIZES.body4,
    color: COLORS.textSecondary,
    marginBottom: 24,
    textAlign: "center",
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    marginBottom: 16,
    textAlign: "center",
  },
  buttons: {
    width: "100%",
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: SIZES.radius,
    alignItems: "center",
    width: "100%",
  },
  googleButton: {
    backgroundColor: "#3872F1",
  },
  appleButton: {
    backgroundColor: "#1A202C",
  },
  buttonText: {
    color: COLORS.white,
    fontSize: SIZES.body4,
    fontWeight: "600",
  },
});
