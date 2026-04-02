import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/appASSETS/theme";
import { ChatMessage } from "../Type/MessageType";

interface ChatBubbleProps {
  message: ChatMessage;
  isMine?: boolean;
}

export const ChatBubble = ({ message, isMine }: ChatBubbleProps) => {
  // 1. Determinar si es mío
  const isMsgMine = isMine !== undefined ? isMine : message.isMine;

  const { data, type } = message;

  // 2. Lógica Defensiva (AQUÍ ESTABA EL ERROR)
  // Usamos data?.text para evitar crash si data es null/undefined
  let content = "Mensaje vacío";

  if (type === "text") {
    content = data?.text || "Voy";
  } else if (type === "image") {
    content = "📷 Imagen";
  } else {
    content = "Formato no soportado"; // ❌ Caía aquí
  }

  return (
    <View style={[styles.container, isMsgMine ? styles.rightContainer : styles.leftContainer]}>
      <View style={[styles.bubble, isMsgMine ? styles.rightBubble : styles.leftBubble]}>
        <Text style={[styles.text, isMsgMine ? styles.rightText : styles.leftText]}>{content}</Text>
      </View>

      {/* Validación de fecha para evitar otro crash si createdAt viene mal */}
      <Text style={styles.time}>
        {message.createdAt
          ? new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : ""}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: "80%",
  },
  leftContainer: {
    alignSelf: "flex-start",
  },
  rightContainer: {
    alignSelf: "flex-end",
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
  },
  leftBubble: {
    backgroundColor: COLORS.bgCard,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  rightBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  text: {
    fontSize: 15,
  },
  leftText: {
    color: "#1F2937",
  },
  rightText: {
    color: "white",
  },
  time: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
    alignSelf: "flex-end",
    marginHorizontal: 4,
  },
});
