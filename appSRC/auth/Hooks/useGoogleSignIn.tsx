import { useEffect } from "react";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useAuthStore } from "../Store/AuthStore";
import { signInWithGoogleCredential } from "../Service/AuthService";

WebBrowser.maybeCompleteAuthSession();

function stripGoogleDomain(id: string) {
  return id.replace('.apps.googleusercontent.com', '');
}

export function useGoogleSignIn() {
  const { setUser, setStatus } = useAuthStore();

  const iosClientId = process.env.EXPO_PUBLIC_FIREBASE_IOS_CLIENT ?? "";
  const androidClientId = process.env.EXPO_PUBLIC_FIREBASE_ANDROID_CLIENT ?? "";

  // redirect nativo (reversed client id)
  const redirectUri =
    Platform.OS === 'ios'
      ? `com.googleusercontent.apps.${stripGoogleDomain(iosClientId)}:/oauthredirect`
      : `com.googleusercontent.apps.${stripGoogleDomain(androidClientId)}:/oauthredirect`;

      console.log("REDICRECT URI", redirectUri)

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId,
    androidClientId,
    redirectUri,
    scopes: ["profile", "email", "openid"],
  });
  useEffect(() => {
    const handleResponse = async () => {
      if (response?.type === "success" && response.authentication?.idToken) {
        const result = await signInWithGoogleCredential(response.authentication.idToken);
        if (result.ok && result.user) {
          setUser(result.user);
          setStatus(result.user.profileComplete ? "authenticated" : "preAuth");
        }
      } else if (response?.type === "error") {
        console.log("[GoogleSignIn] OAuth error →", response.error);
      }
    };
    handleResponse();
  }, [response]);

  const handleGoogleSignIn = async () => {
    await promptAsync();
  };

  return { handleGoogleSignIn };
}
