import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/appASSETS/theme";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";

interface MessageInputProps {
  onQuotePress?: () => void;
  onSendText?: (text: string, imageUri?: string) => void; // 💡 Firma actualizada
  onImagePress?: () => void;
  placeholderName?: string;
  selectedImageUri?: string | null; // 💡 Nueva Prop
  onClearImage?: () => void; // 💡 Para remover el adjunto
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onQuotePress,
  onSendText,
  onImagePress,
  placeholderName = "Marcus",
  selectedImageUri,
  onClearImage,
}) => {
  const [message, setMessage] = useState("");
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  const isProfessional = user.role === "professional";
  const hasContent = message.trim().length > 0 || !!selectedImageUri;
  const handleSend = () => {
    onSendText?.(message, selectedImageUri || undefined);
    setMessage("");
    onClearImage?.(); // Limpiar tras enviar
  };

  return (
    <View style={styles.footerContainer}>
      {/* 💡 Indicador de archivos adjuntos (Silly View Logic) */}
      {selectedImageUri && (
        <View style={styles.attachmentPreview}>
          <Ionicons name="attach" size={16} color={COLORS.primary} />
          <TextInput editable={false} style={styles.attachmentText}>
            1 file attached
          </TextInput>
          <TouchableOpacity onPress={onClearImage}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.maxContainer}>
        <TouchableOpacity
          style={styles.actionCircle}
          onPress={isProfessional ? onQuotePress : onImagePress}
          activeOpacity={0.7}>
          <Ionicons
            name={isProfessional ? "add" : "camera-outline"}
            size={24}
            color={selectedImageUri ? COLORS.primary : "#6B7280"}
          />
        </TouchableOpacity>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder={
              selectedImageUri
                ? "Add a caption..."
                : `Message ${placeholderName}...`
            }
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
          />
        </View>

        <TouchableOpacity
          style={[styles.sendCircle, !hasContent && styles.disabledSend]}
          onPress={handleSend}
          disabled={!hasContent}>
          <Ionicons
            name="send"
            size={18}
            color="#fff"
            style={{ marginLeft: 2 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: { backgroundColor: "#fff" },
  footerContainer: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 25 : 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff", // 🔥 Added background
  },
  maxContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },
  actionCircle: {
    height: 40,
    width: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: "#F9FAFB", // bg-gray-50 de Stitch
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    marginHorizontal: 8,
  },
  input: {
    fontSize: 15,
    color: "#111827",
    maxHeight: 120,
    padding: 0,
  },
  sendCircle: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  disabledSend: { backgroundColor: "#D1D5DB", elevation: 0, shadowOpacity: 0 },
  attachmentPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
    marginLeft: 48, // Alineado con el input
  },
  attachmentText: {
    fontSize: 13,
    color: "#374151",
    marginHorizontal: 8,
    fontWeight: "500",
  },
});
