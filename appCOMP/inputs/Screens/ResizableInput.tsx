// appCOMP/inputs/ResizableInput.tsx
import { COLORS, SIZES } from "@/appASSETS/theme";
import React from "react";
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  Pressable,
  StyleProp,
  ViewStyle,
} from "react-native";

interface ResizableInputProps extends TextInputProps {
  icon?: React.ReactNode;
  isTextArea?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  onPress?: () => void; // Agregamos prop explícita para manejo de toques
}

export const ResizableInput: React.FC<ResizableInputProps> = ({
  icon,
  isTextArea = false,
  containerStyle,
  onPress,
  editable = true,
  ...props
}) => {
  // Si se pasa un onPress, el componente actúa como botón, no como input directo.
  const isButtonMode = !!onPress;

  return (
    <Pressable
      onPress={onPress}
      disabled={!isButtonMode} // Deshabilitar pressable si es un input normal
      style={[
        styles.inputWrapper,
        isTextArea && styles.textAreaWrapper,
        containerStyle,
      ]}>
      {icon && (
        <View style={[styles.iconContainer, isTextArea && styles.iconTop]}>
          {icon}
        </View>
      )}

      <TextInput
        style={[
          styles.textInput,
          isTextArea && styles.textArea,
          !editable && styles.textInputDisabled, // Estilo visual opcional
        ]}
        placeholderTextColor={COLORS.textSecondary} //
        multiline={true}
        textAlignVertical={isTextArea ? "top" : "center"}
        editable={editable && !isButtonMode}
        pointerEvents={isButtonMode ? "none" : "auto"}
        {...props}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white, //
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border || "#E5E7EB", // Fallback seguro
    paddingHorizontal: 12,
    marginBottom: 15,
    minHeight: 55, // Altura mínima para touch targets
  },
  textAreaWrapper: {
    alignItems: "flex-start",
    paddingVertical: 10,
  },
  iconContainer: {
    marginRight: 10,
  },
  iconTop: {
    marginTop: 4,
  },
  textInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.textPrimary,
    minHeight: 24,
  },
  textInputDisabled: {
    color: COLORS.textPrimary,
  },
  textArea: {
    height: 100,
  },
});
