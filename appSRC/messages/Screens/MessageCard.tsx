import { COLORS, SIZES } from "@/appASSETS/theme";
import UserAvatar from "@/appCOMP/avatar/UserAvatar";
import React from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";

interface MessageCardProps {
  name: string;
  lastMessage?: string;
  avatarPath?: string | null; // Cambiado de Url a Path para Supabase
  userType: "client" | "professional";
  onPress?: () => void;
}

// appSRC/messages/Screens/MessageCard.tsx

const MessageCard: React.FC<MessageCardProps> = ({
  name,
  lastMessage = "",
  avatarPath, // Este viene del Join anterior (solo si es profesional)
  userType, // 'client' | 'professional' (del interlocutor)
  onPress,
}) => {
  // REGLA DE NEGOCIO ZOLVER:
  // Si hablo con un 'professional', intentamos usar avatarPath.
  // Si hablo con un 'client', forzamos null (porque no tienen foto).
  const resolvedPath = userType === "professional" ? avatarPath : null;

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <UserAvatar path={resolvedPath} name={name} size={60} />

      <View style={styles.textContainer}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {lastMessage}
        </Text>
      </View>
    </Pressable>
  );
};
export default MessageCard;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 18,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    alignItems: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 24,
  },
  placeholderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#d0d0d0",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "600",
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  lastMessage: {
    marginTop: 6,
    fontSize: 14,
    color: "#666",
  },
  pressed: {
    backgroundColor: "#F9F9F9",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
