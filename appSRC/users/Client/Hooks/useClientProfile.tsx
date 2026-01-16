import { useState } from "react";
import { Alert } from "react-native";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { getInitials } from "../../Helper/ProfileHelper";
import { useRouter } from "expo-router";

export const useUserProfile = () => {
  const { user } = useAuthStore();
  const router = useRouter();

  // El nombre legal ya no se "setea" localmente para editar, es Read-Only
  const legalName = user?.displayName || "Usuario Zolver";
  const initials = getInitials(legalName);

  // Manejador de intento de edición de nombre (Bloqueo por Fraude)
  const handleNameEditPress = () => {
    Alert.alert(
      "Información Protegida",
      "Por seguridad y cumplimiento legal, tu nombre vinculado al DNI no puede ser cambiado. Si hay un error, contacta a Soporte",
      [{ text: "Cancelar", style: "cancel" }]
    );
  };

  const handleLockedFieldPress = () => {
    Alert.alert(
      "Información Protegida",
      "Por seguridad y cumplimiento legal, tu nombre vinculado al DNI no puede ser cambiado. Si hay un error, contacta a Perfil -> Soporte",
      [{ text: "Cancelar", style: "cancel" }]
    );
  };

  return {
    userData: {
      email: user?.email,
      phone: user?.phoneNumber,
      displayName: legalName,
      initials,
    },
    handleNameEditPress,
    handleLockedFieldPress,
  };
};
