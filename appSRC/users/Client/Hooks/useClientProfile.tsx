import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { getInitials } from "../../Helper/ProfileHelper";
import { ProfileService } from "@/appSRC/users/Client/Service/ClientUserService";

export const useClientProfile = () => {
  const { user, setUser } = useAuthStore();

  // Estado local del formulario
  // Inicializamos con el valor del Store para reactividad inmediata
  const [legalName, setLegalName] = useState(user?.displayName || "");
  const [loading, setLoading] = useState(false);
  const [initials, setInitials] = useState("Z");

  // Efecto: Actualizar iniciales en tiempo real mientras el usuario escribe
  useEffect(() => {
    setInitials(getInitials(legalName));
  }, [legalName]);

  // Manejador de Guardado
  const handleSave = async () => {
    if (!user?.uid) return console.error("❌ if (!user?.uid) ❌❌❌❌");
    // 1. Validación Básica
    const cleanName = legalName.trim();
    if (cleanName.length < 3) {
      Alert.alert("Validación", "El nombre debe tener al menos 3 caracteres.");
      return;
    }

    setLoading(true);
    try {
      // 2. Persistencia en Supabase (DB)
      await ProfileService.updateProfile(user.uid, {
        legal_name: cleanName,
      });

      // 3. Actualización Optimista del Store (App State)
      // Esto actualiza el nombre en toda la app sin necesitar un refetch
      setUser({
        ...user,
        displayName: cleanName,
      });

      Alert.alert("Éxito", "Tu perfil ha sido actualizado.");
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Error",
        "No se pudo actualizar el perfil. Intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  // Manejador de Campos Bloqueados (UX)
  const handleLockedFieldPress = (fieldName: string) => {
    Alert.alert(
      `Editar ${fieldName}`,
      `Por seguridad, el ${fieldName.toLowerCase()} no se puede editar directamente. Si necesitas cambiarlo, contacta a Soporte.`,
      [
        { text: "Entendido", style: "cancel" },
        // { text: "Contactar Soporte", onPress: () => router.push('/support') } // Futuro
      ]
    );
  };

  return {
    // Data
    userData: {
      email: user?.email,
      phone: user?.phoneNumber,
      displayName: legalName, // Usamos el estado local para el input
      initials,
    },
    // Actions
    setLegalName,
    handleSave,
    handleLockedFieldPress,
    // State
    loading,
  };
};
