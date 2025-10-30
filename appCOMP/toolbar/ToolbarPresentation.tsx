import AntDesign from '@expo/vector-icons/AntDesign';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../appASSETS/theme';
import { FONTS } from '../../appASSETS/theme';

interface ToolBarPresentationProps {
  titleText: string;
  showBackButton?: boolean
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
  }

  return (
    <View style={styles.container}>
      {/* Left Item: Back Button */}
      <Pressable
        onPress={handleBackButton}
        style={styles.buttonContainer}
      >
        {showBackButton && <AntDesign name="arrow-left" size={24} color={COLORS.white}/>}
      </Pressable>
      
      {/* Center Item: Title */}
      <Text style={styles.title} >{titleText}</Text>
      
      {/* Right Item: Spacer View */}
      {/* This invisible view has the same width as the button to ensure the title is always perfectly centered. */}
      <View style={styles.buttonContainer} />
    </View>
  );
};

export default ToolBarPresentation;

const styles = StyleSheet.create({
  container: {
    // Key change: Use space-between to push items to the edges
    justifyContent: 'space-between', 
    alignItems: 'center',
    flexDirection:'row',
    width: '100%',
    height: 130,
    paddingHorizontal: 10,
    paddingTop: 70,
    paddingBottom: 10,
    backgroundColor: COLORS.tertiary,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.white,
    fontWeight: 'bold',
    flex: 1, 
    textAlign: 'center',
  },
  buttonContainer: {
    // Give the container a fixed width to ensure perfect balance
    width: 30, 
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  }
});