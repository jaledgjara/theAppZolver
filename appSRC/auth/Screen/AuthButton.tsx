import { COLORS, FONTS } from '@/appASSETS/theme';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface AuthButtonProps {
  title: string;
  icon?: React.ReactNode;
  onPress: () => void;
  style?: object;
  textColor?: string;
  disabled?: boolean; 
}

const AuthButton: React.FC<AuthButtonProps> = ({ title, icon, onPress, style, textColor = '#FFFFFF', disabled = false }) => {
  return (
    <Pressable
      style={[
        styles.button, 
        style, 
        disabled && styles.buttonDisabled
      ]} 
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.iconStyle}>{icon}</View> 
      <Text style={[
        styles.buttonText, 
        { color: textColor }, 
        disabled && styles.textDisabled
      ]}>
        {title}
      </Text>
    </Pressable >
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginVertical: 5,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    },
  buttonText: {
    ...FONTS.body2,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  iconStyle: {
    marginRight: 8,
  },
  buttonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  textDisabled: {
    color: COLORS.textSecondary,
  }
});

export default AuthButton;