import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/appASSETS/theme";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import IconButton from "@/appCOMP/button/IconButton";
import { useRouter } from "expo-router";

interface MessageInputProps {
  onQuotePress?: () => void;
  // 👇 1. NUEVA PROP: Función para enviar el texto al padre
  onSendText?: (text: string) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onQuotePress,
  onSendText,
}) => {
  const [message, setMessage] = useState("");
  const router = useRouter();

  // Obtener el Rol del Usuario desde el Store
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  const isProfessional = user.role === "professional";

  // 2. Lógica Principal del Botón
  const handleActionPress = () => {
    const textToSend = message.trim();

    if (textToSend) {
      // --- CASO A: HAY TEXTO (ENVIAR) ---
      if (onSendText) {
        onSendText(textToSend); // 🚀 Disparamos el envío a Supabase
      }
      setMessage(""); // Limpiamos el input inmediatamente
    } else {
      // --- CASO B: INPUT VACÍO (ACCIONES EXTRA) ---
      if (isProfessional) {
        // Acción de Presupuesto (Solo Pros)
        if (onQuotePress) {
          onQuotePress();
        } else {
          router.push("/(professional)/messages/ReservationRequestScreen");
        }
      } else {
        // Acción de Audio (Clientes - Placeholder por ahora)
        Alert.alert(
          "Próximamente",
          "El envío de audio estará disponible pronto."
        );
      }
    }
  };

  // 3. Determinar qué icono mostrar
  const getIconName = () => {
    if (message.trim()) return "send"; // Siempre avión si hay texto
    if (isProfessional) return "add"; // '+' si es profesional y está vacío
    return "mic"; // Micrófono para clientes vacíos
  };

  // Color dinámico
  const getButtonColor = () => {
    // Si es Pro y está vacío (modo agregar), usamos color terciario/acento
    if (!message.trim() && isProfessional) return COLORS.tertiary;
    return COLORS.primary;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      style={styles.avoidingView}>
      <View style={styles.outerContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder={
              isProfessional
                ? "Escribe o envía un presupuesto..."
                : "Escribe un mensaje..."
            }
            placeholderTextColor={COLORS.textSecondary}
            multiline={true}
            maxLength={500}
            // Importante para la experiencia de usuario en chat
            blurOnSubmit={false}
          />
        </View>

        <IconButton
          size={50}
          backgroundColor={getButtonColor()}
          onPress={handleActionPress}
          icon={<Ionicons name={getIconName() as any} size={24} color="#fff" />}
          style={styles.sendButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  avoidingView: {
    width: "100%",
  },
  outerContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 10,
    paddingBottom: Platform.OS === "ios" ? 30 : 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  inputContainer: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    minHeight: 40,
    maxHeight: 100, // Límite de crecimiento vertical
  },
  input: {
    fontSize: 16,
    color: COLORS.textPrimary,
    paddingTop: 0, // Alineación vertical en Android
    maxHeight: 90,
  },
  sendButton: {
    elevation: 2,
    marginBottom: 2, // Ajuste visual menor
  },
});
