import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/appASSETS/theme"; // Asumiendo tu archivo de tema
import { TextMessage } from "../Type/MessageType";
import { format } from "date-fns"; // O tu utilidad de fecha preferida

interface Props {
  message: TextMessage;
}

export const ChatBubble = ({ message }: Props) => {
  const { isMine, text, createdAt } = message;

  return (
    <View
      style={[
        styles.container,
        isMine ? styles.containerMine : styles.containerOther,
      ]}>
      <Text style={[styles.text, isMine ? styles.textMine : styles.textOther]}>
        {text}
      </Text>

      <Text style={[styles.time, isMine ? styles.textMine : styles.textOther]}>
        {/* Formato simple de hora: 14:30 */}
        {format(createdAt, "HH:mm")}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  // Estilos "MÍOS" (Derecha - Color Primario)
  containerMine: {
    alignSelf: "flex-end",
    backgroundColor: COLORS.primary, // Tu azul Zolver
    borderBottomRightRadius: 4, // Efecto burbuja de chat
  },
  // Estilos "DEL OTRO" (Izquierda - Gris)
  containerOther: {
    alignSelf: "flex-start",
    backgroundColor: "#F0F0F0",
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 16,
    marginBottom: 4,
  },
  textMine: {
    color: "#FFFFFF",
  },
  textOther: {
    color: "#333333",
  },
  time: {
    fontSize: 10,
    alignSelf: "flex-end",
    opacity: 0.8,
  },
});
