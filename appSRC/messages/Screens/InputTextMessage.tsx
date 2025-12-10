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
}

export const MessageInput: React.FC<MessageInputProps> = ({ onQuotePress }) => {
  const [message, setMessage] = useState("");
  const router = useRouter();

  // 1. Obtener el Rol del Usuario desde el Store
  const user = useAuthStore((state) => state.user);

  // Verificación de seguridad básica si user es null
  if (!user) return null;

  const isProfessional = user.role === "professional";

  // 2. Lógica de renderizado del botón de acción
  const handleActionPress = () => {
    if (message.trim()) {
      // Si hay texto: ENVIAR MENSAJE
      console.log("Enviando mensaje:", message);
      setMessage("");
    } else {
      // Si el input está VACÍO:
      if (isProfessional) {
        // --- AQUÍ ESTÁ EL CAMBIO SOLICITADO ---
        // Si se pasa una función personalizada (onQuotePress), se usa esa.
        // Si no, se navega por defecto a la pantalla de Presupuesto.
        if (onQuotePress) {
          onQuotePress();
        } else {
          router.push("/(professional)/messages/ReservationRequestScreen");
        }
      } else {
        // ACCIÓN DE AUDIO (Cliente)
        Alert.alert("Audio", "Grabando mensaje de voz...");
      }
    }
  };

  // 3. Determinar qué icono mostrar
  const getIconName = () => {
    if (message.trim()) return "send"; // Siempre enviar si hay texto
    if (isProfessional) return "add"; // '+' si es profesional y está vacío
    return "mic"; // Micrófono en otros casos
  };

  // Color dinámico para diferenciar la acción de "Agregar" vs "Enviar"
  const getButtonColor = () => {
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
    maxHeight: 100,
  },
  input: {
    fontSize: 16,
    color: COLORS.textPrimary,
    paddingTop: 0,
  },
  sendButton: {
    elevation: 2,
  },
});
