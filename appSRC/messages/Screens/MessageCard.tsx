import { COLORS, SIZES } from "@/appASSETS/theme";
import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";


interface MessageCardProps {
  name: string;
  lastMessage?: string;
  avatarUrl?: string; // optional
}

const MessageCard: React.FC<MessageCardProps> = ({
  name,
  lastMessage = "",
  avatarUrl,
}) => {
  return (
    <View style={styles.container}>
      {/* Avatar */}
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.placeholderAvatar}>
          <Text style={styles.placeholderText}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Text Section */}
      <View style={styles.textContainer}>
        <Text style={styles.name}>{name}</Text>
        {lastMessage.length > 0 && (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMessage}
          </Text>
        )}
      </View>
    </View>
  );
};

export default MessageCard;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    alignItems: "center"
  },
  avatar: {
    width: 48,
    height: 48,
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
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  lastMessage: {
    marginTop: 2,
    fontSize: 14,
    color: "#666",
  },
});
