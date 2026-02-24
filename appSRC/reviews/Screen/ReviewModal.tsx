import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "@/appASSETS/theme";

interface ReviewModalProps {
  visible: boolean;
  professionalName: string;
  onClose: () => void;
  onSubmit: (score: number, comment: string) => void;
  isLoading?: boolean;
}

const STAR_COUNT = 5;

const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  professionalName,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");

  console.log("[REVIEW-MODAL] Render - visible:", visible, "score:", score, "isLoading:", isLoading);

  const handleSubmit = () => {
    if (score === 0) {
      console.log("[REVIEW-MODAL] handleSubmit blocked - score is 0");
      return;
    }
    console.log("[REVIEW-MODAL] handleSubmit - score:", score, "comment:", comment.trim() || "(empty)");
    onSubmit(score, comment.trim());
  };

  const handleClose = () => {
    console.log("[REVIEW-MODAL] handleClose - resetting state");
    setScore(0);
    setComment("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.card}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.iconCircle}>
            <Ionicons name="star" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Calificar Profesional</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {professionalName}
          </Text>

          {/* Stars */}
          <View style={styles.starsRow}>
            {Array.from({ length: STAR_COUNT }, (_, i) => {
              const starIndex = i + 1;
              return (
                <TouchableOpacity
                  key={starIndex}
                  onPress={() => setScore(starIndex)}
                  activeOpacity={0.7}
                  style={styles.starTouch}>
                  <Ionicons
                    name={starIndex <= score ? "star" : "star-outline"}
                    size={40}
                    color={starIndex <= score ? COLORS.primary : "#D1D5DB"}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {score > 0 && (
            <Text style={styles.scoreLabel}>
              {score === 1 && "Malo"}
              {score === 2 && "Regular"}
              {score === 3 && "Bueno"}
              {score === 4 && "Muy bueno"}
              {score === 5 && "Excelente"}
            </Text>
          )}

          {/* Comment input */}
          <TextInput
            style={styles.input}
            placeholder="Dejá un comentario (opcional)"
            placeholderTextColor="#9CA3AF"
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />

          {/* Submit button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              score === 0 && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={score === 0 || isLoading}
            activeOpacity={0.7}>
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.submitText}>Enviar Calificación</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ReviewModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  closeButton: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 1,
    padding: 4,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFF8E1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: SIZES.body3,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  starTouch: {
    paddingHorizontal: 6,
  },
  scoreLabel: {
    fontSize: SIZES.body4,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 16,
  },
  input: {
    width: "100%",
    minHeight: 80,
    maxHeight: 120,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: 12,
    padding: 14,
    fontSize: SIZES.body4,
    color: COLORS.textPrimary,
    marginBottom: 20,
  },
  submitButton: {
    width: "100%",
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 50,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  submitButtonDisabled: {
    backgroundColor: "#CFCFCF",
  },
  submitText: {
    fontSize: SIZES.h3,
    fontWeight: "600",
    color: COLORS.white,
  },
});
