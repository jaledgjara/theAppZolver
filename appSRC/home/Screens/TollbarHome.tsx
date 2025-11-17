import AntDesign from '@expo/vector-icons/AntDesign';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View, Text } from 'react-native';
import { AUTH_PATHS } from '@/appSRC/auth/Path/AuthPaths';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { COLORS, FONTS } from '@/appASSETS/theme';

interface ToolBarHomeProps {
  titleText: string;
  showMenukButton?: boolean;
  onPress?: () => void;
}

export const ToolBarHome: React.FC<ToolBarHomeProps> = ({
  titleText,
  showMenukButton = false,
  onPress,
}) => {
  const router = useRouter();


  const handleBackButton = () => {
    if (onPress) {
      onPress();
    } else if (showMenukButton) {
      console.log('Presionado el botton');
    }
  };

  return (
    <View style={styles.container}>
      {showMenukButton && (
        <Pressable onPress={handleBackButton} hitSlop={10}>
          <MaterialIcons name="menu-open" size={18} color="white" />
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
    ...FONTS.body3,
    color: COLORS.white,
    marginRight: 5,
    paddingHorizontal: 10
  }
});