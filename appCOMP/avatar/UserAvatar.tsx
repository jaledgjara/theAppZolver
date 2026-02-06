import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageStyle,
  StyleProp,
} from "react-native";
import { COLORS, SIZES } from "@/appASSETS/theme";
import { useAvatar } from "@/appSRC/users/Professional/General/Hooks/useAvatar";

interface UserAvatarProps {
  path?: string | null; // El path relativo de Supabase
  name: string;
  size?: number;
  style?: StyleProp<ImageStyle>; // Permitir estilos personalizados desde la Card
}

/**
 * Componente Atómico de Avatar - Zolver Architecture
 * Resuelve imágenes de Supabase y maneja Fallback de iniciales nativas.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  path,
  name,
  size = 50,
  style,
}) => {
  // 1. Resolvemos la URL usando nuestra lógica de MediaService
  const { url, showFallback, onError } = useAvatar(path, "avatars");

  // 2. Lógica de Iniciales (Capa de Presentación)
  const getInitials = (fullName: string) => {
    const names = fullName.trim().split(/\s+/);
    if (!names[0]) return "Z"; // Fallback mínimo
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (
      names[0].charAt(0) + names[names.length - 1].charAt(0)
    ).toUpperCase();
  };

  const initials = getInitials(name);

  // 3. Renderizado Condicional
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: COLORS.primary + "15", // Color de marca con transparencia para el fondo
        },
        style,
      ]}>
      {!showFallback && url ? (
        <Image
          source={{ uri: url }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          onError={onError}
        />
      ) : (
        <Text
          style={[
            styles.text,
            { fontSize: size * 0.4, color: COLORS.primary },
          ]}>
          {initials}
        </Text>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    // Sombra sutil alineada con BaseCard
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginRight: 14,
  },
  text: {
    color: COLORS.white,
    fontWeight: "bold",
    fontFamily: "Roboto-Bold", // Basado en la definición de FONTS
  },
});

export default UserAvatar;
