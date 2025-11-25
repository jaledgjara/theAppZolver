import { COLORS, FONTS } from "@/appASSETS/theme";
import { FontAwesome6 } from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

interface CustomPickerImageInputProps {
  title: string;
  subtittle: string;
  iconTitle: IoniconName;
  iconResultUpload?: string;
  color?: string;
  onPress: () => void;
}

const CustomPickerImageInput: React.FC<CustomPickerImageInputProps> = ({
  title,
  subtittle,
  iconTitle,
  iconResultUpload,
  color,
  onPress,
}) => {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.infoContainer}>
        <Ionicons name={iconTitle} size={40} color="black" />

        <View style={styles.stringContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtittle}</Text>
        </View>
      </View>
      <View style={styles.iconResultContainer}>
        <FontAwesome6 name={iconResultUpload} size={24} color={color} />
      </View>
    </Pressable>
  );
};

export default CustomPickerImageInput;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    marginVertical: 10,
    borderRadius: 15,
    paddingVertical: 20,
    paddingHorizontal: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  infoContainer: {
    justifyContent: "flex-start",
    flexDirection: "row",
    alignContent: "center",
  },
  stringContainer: {
    marginHorizontal: 15,
  },
  title: {
    ...FONTS.h3,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...FONTS.h4,
    color: COLORS.textSecondary,
  },
  iconResultContainer: {
    marginVertical: 10,
    marginRight: 5,
  },
});
