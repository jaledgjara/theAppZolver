import { COLORS, FONTS } from "@/appASSETS/theme";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";

interface AuthInputProps extends TextInputProps {
  label: string;
  iconName: keyof typeof Icon.glyphMap;
  error?: string;
  isPassword?: boolean;
}

const AuthInput: React.FC<AuthInputProps> = ({
  label,
  iconName,
  error,
  isPassword = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!isPassword);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const getBorderColor = () => {
    if (error) {
      return "#D93434";
    }
    if (isFocused) {
      return "#3D5CFF";
    }
    return "#E0E0E0";
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, { borderColor: getBorderColor() }]}>
        <Icon
          name={iconName}
          size={20}
          color={isFocused ? "#333" : "#9E9E9E"}
          style={styles.icon}
        />
        <TextInput
          style={styles.textInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={!isPasswordVisible}
          placeholderTextColor="#BDBDBD"
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={togglePasswordVisibility}>
            <Icon
              name={isPasswordVisible ? "eye" : "eye-off"}
              size={20}
              color="#9E9E9E"
              style={styles.eyeIcon}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: "100%",
  },
  label: {
    ...FONTS.h3,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.backgroundInput,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 3,
  },
  icon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: 45,
    fontSize: 18,
    marginLeft: 5,
    color: COLORS.textPrimary,
  },
  eyeIcon: {
    marginLeft: 10,
  },
  errorText: {
    fontSize: 12,
    color: "#D93434",
    marginTop: 4,
    marginLeft: 4,
  },
});

export default AuthInput;
