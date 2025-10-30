import AntDesign from '@expo/vector-icons/AntDesign';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View, Text } from 'react-native';
import { FONTS, COLORS } from '../../appASSETS/theme';

interface ToolBarTitleProps {
  titleText: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export const ToolBarTitle: React.FC<ToolBarTitleProps> = ({
  titleText,
  showBackButton = false,
  onBackPress,
}) => {
  const router = useRouter();

  const handleBackButton = () => {
    if (onBackPress) {
      onBackPress(); // acción personalizada
    } else if (showBackButton) {
      router.back(); // acción por defecto
    }
  };

  return (
    <View style={styles.container}>
      {showBackButton && (
        <Pressable onPress={handleBackButton} hitSlop={10}>
          <AntDesign name="arrow-left" size={20} color="white" />
        </Pressable>
      )}
      <Text style={styles.title}>{titleText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 130,
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 10,
    backgroundColor: COLORS.tertiary,
  },
  title: {
    ...FONTS.body2,
    color: COLORS.white,
    marginRight: 5,
    paddingHorizontal: 20
  }
});