import React from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import NamingCard from "@/appCOMP/cards/NamingCard";
import { PRIVACY_OPTIONS } from "@/appSRC/profile/Type/PrivacyAndDataType";
import { COLORS } from "@/appASSETS/theme";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";

export default function PrivacyScreen() {
  const router = useRouter();
  const { user } = useAuthStore(); // Obtenemos los datos reales del usuario

  const handleEditPress = (item: (typeof PRIVACY_OPTIONS)[0]) => {
    if (!item.editable) return;

    // Lógica de navegación según el campo
    if (item.key === "phoneNumber") {
      // Ejemplo: Ir a verificar teléfono de nuevo
      Alert.alert(
        "Aviso",
        "Para cambiar tu teléfono deberás verificarlo nuevamente."
      );
      // router.push('/(auth)/PhoneVerificationScreen');
    } else {
      // Ejemplo: Ir a pantalla genérica de edición
      // router.push({ pathname: '/(professional)/profile/edit-field', params: { field: item.key } });
      console.log(`Editando ${item.label}`);
    }
  };

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Datos y Privacidad" showBackButton={true} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 2. Mapeo de opciones desde el JSON */}
        {PRIVACY_OPTIONS.map((option) => (
          <NamingCard
            key={option.id}
            label={option.label}
            // @ts-ignore: Acceso dinámico seguro dado que el JSON coincide con el tipo AuthUser
            value={user?.[option.key] || "No especificado"}
            editable={option.editable}
            onPress={
              option.editable ? () => handleEditPress(option) : undefined
            }
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight, //
  },
  scrollContent: {
    paddingBottom: 40,
  },
});
