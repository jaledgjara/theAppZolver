import { useEffect } from "react";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { signInWithGoogleCredential } from "../Service/AuthService";

WebBrowser.maybeCompleteAuthSession();

function stripGoogleDomain(id: string) {
  return id.replace('.apps.googleusercontent.com', '');
}

export function useGoogleSignIn() {
  const iosClientId = process.env.EXPO_PUBLIC_FIREBASE_IOS_CLIENT ?? "";
  const androidClientId = process.env.EXPO_PUBLIC_FIREBASE_ANDROID_CLIENT ?? "";
  const webClientId = process.env.EXPO_PUBLIC_FIREBASE_WEB_CLIENT ?? "";

  const redirectUri =
    Platform.OS === 'ios'
      ? `com.googleusercontent.apps.${stripGoogleDomain(iosClientId)}:/oauthredirect`
      : `com.googleusercontent.apps.${stripGoogleDomain(androidClientId)}:/oauthredirect`;

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId,
    androidClientId,
    webClientId,
    redirectUri: Platform.OS === "web" ? undefined : redirectUri,
    scopes: ["profile", "email", "openid"],
  });

  useEffect(() => {
    if (response?.type === "success" && response.authentication?.idToken) {
      // Solo dispara Firebase — el AuthListener maneja status y user
      signInWithGoogleCredential(response.authentication.idToken);
    }
  }, [response]);

  const handleGoogleSignIn = async () => {
    await promptAsync();
  };

  return { handleGoogleSignIn };
}
