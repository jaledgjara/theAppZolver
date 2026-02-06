import { useState, useEffect, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { ProfessionalDataService } from "../Service/ProfessionalDataService";
import { StorageService } from "@/appSRC/messages/Service/StorageService";
import { useRouter } from "expo-router";
import { Alert } from "react-native";

export const useProfessionalProfile = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const [profile, setProfile] = useState({
    specialty: "",
    bio: "",
    photoUrl: "",
    portfolioUrls: [] as string[],
  });

  const loadProfile = useCallback(async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const data = await ProfessionalDataService.fetchPublicProfile(user.uid);
      if (data) {
        console.log("📥 [HOOK] Perfil cargado:", data.photo_url);
        setProfile({
          specialty: data.specialization_title || "",
          bio: data.biography || "",
          photoUrl: data.photo_url || "",
          portfolioUrls: data.portfolio_urls || [],
        });
      }
    } catch (e) {
      console.error("❌ [HOOK] Error loadProfile:", e);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleUpdateField = (field: keyof typeof profile, value: any) => {
    console.log(`✍️ [HOOK] Editando [${field}]:`, value);
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      handleUpdateField("photoUrl", result.assets[0].uri);
    }
  };

  // ✅ FUNCIONES REINTEGRADAS
  const handleAddImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      const newUri = result.assets[0].uri;
      console.log(
        "✅ [Hook] Imagen de portfolio seleccionada (Local):",
        newUri
      );
      setProfile((prev) => ({
        ...prev,
        portfolioUrls: [...prev.portfolioUrls, newUri],
      }));
    }
  };

  const handleRemoveImage = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      portfolioUrls: prev.portfolioUrls.filter((_, i) => i !== index),
    }));
  };

  const updateProfile = async () => {
    if (!user?.uid) return;
    setSaving(true);
    console.log("💾 [HOOK] Iniciando guardado...");

    try {
      let finalPhotoPath = profile.photoUrl;
      if (profile.photoUrl.startsWith("file://")) {
        console.log("☁️ [HOOK] Subiendo avatar...");
        finalPhotoPath = await StorageService.uploadFile(
          profile.photoUrl,
          user.uid,
          "avatars"
        );
      }

      console.log("☁️ [HOOK] Procesando Portfolio...");
      const finalPortfolioPaths = await Promise.all(
        profile.portfolioUrls.map(async (uri) => {
          if (uri.startsWith("file://")) {
            return await StorageService.uploadFile(uri, user.uid, "portfolio");
          }
          return uri;
        })
      );

      const updateData = {
        specialization_title: profile.specialty,
        biography: profile.bio,
        photo_url: finalPhotoPath,
        portfolio_urls: finalPortfolioPaths,
      };

      await ProfessionalDataService.updatePublicProfile(user.uid, updateData);

      console.log("✨ [HOOK] Perfil guardado con éxito");
      Alert.alert("¡Éxito!", "Perfil actualizado.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      console.error("❌ [HOOK] Error fatal:", e.message);
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  return {
    profile,
    loading,
    saving,
    updateProfile,
    handleEditPhoto,
    handleAddImage,
    handleRemoveImage,
    handleUpdateField,
  };
};
