import AntDesign from "@expo/vector-icons/AntDesign";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View, Platform, StatusBar } from "react-native";
import { COLORS, FONTS, SIZES } from "../../appASSETS/theme";

interface ToolBarPresentationProps {
  titleText: string;
  showBackButton?: boolean;
}

export const ToolBarPresentation: React.FC<ToolBarPresentationProps> = ({
  titleText,
  showBackButton = false,
}) => {
  const router = useRouter();

  const handleBackButton = () => {
    if (showBackButton) {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handleBackButton}
        style={styles.buttonContainer}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {showBackButton && <AntDesign name="arrow-left" size={22} color={COLORS.white} />}
      </Pressable>

      <Text style={styles.title}>{titleText}</Text>

      <View style={styles.buttonContainer} />
    </View>
  );
};

export default ToolBarPresentation;

const STATUS_BAR_HEIGHT = Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) : 44;

const styles = StyleSheet.create({
  container: {
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    width: "100%",
    paddingHorizontal: SIZES.xl,
    paddingTop: STATUS_BAR_HEIGHT + SIZES.lg,
    paddingBottom: SIZES.lg,
    backgroundColor: COLORS.brandDeep,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.white,
    flex: 1,
    textAlign: "center",
  },
  buttonContainer: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
});
