// appSRC/users/Professional/Hooks/useProfessionalProfile.ts
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { ProfessionalProfileService } from "@/appSRC/auth/Service/ProfessionalAuthService";
import { ProfessionalDataService } from "../Service/ProfessionalDataService";
import { router, useRouter } from "expo-router";
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

  useEffect(() => {
    if (user?.uid) loadProfile();
  }, [user?.uid]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await ProfessionalDataService.fetchPublicProfile(user!.uid);
      if (data) {
        setProfile({
          specialty: data.specialization_title || "",
          bio: data.biography || "",
          photoUrl: data.photo_url || "",
          portfolioUrls: data.portfolio_urls || [],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Lógica para la Foto de Perfil Principal
   */
  const handleEditPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Forzamos que sea cuadrada para el avatar
      quality: 0.5,
    });

    if (!result.canceled) {
      const newPhotoUri = result.assets[0].uri;
      setProfile((prev) => ({
        ...prev,
        photoUrl: newPhotoUri,
      }));
      console.log("📸 Foto de perfil actualizada localmente");
    }
  };

  // LÓGICA DE IMÁGENES (PORTFOLIO)
  const handleAddImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const newUri = result.assets[0].uri;
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

  const updateProfile = async (data: any) => {
    if (!user?.uid) return;

    setSaving(true);
    try {
      const res = await ProfessionalDataService.updatePublicProfile(
        user.uid,
        data
      );

      if (res.success) {
        Alert.alert("¡Éxito!", "Tu perfil ha sido actualizado correctamente.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (e: any) {
      Alert.alert("Error", "No se pudo actualizar el perfil: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return {
    profile,
    setProfile,
    loading,
    saving,
    updateProfile,
    handleAddImage,
    handleRemoveImage,
    handleEditPhoto,
  };
};
