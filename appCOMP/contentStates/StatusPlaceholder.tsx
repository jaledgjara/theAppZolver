import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS, FONTS } from 'appASSETS/theme';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

type MaterialIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface StatusPlaceholderProps {
  icon: MaterialIconName,
  title: string,
  subtitle: string,
  buttonTitle?: string;
  onButtonPress?: () => void;
}

const StatusPlaceholder: React.FC<StatusPlaceholderProps> = ({
  icon, title, subtitle, buttonTitle, onButtonPress
}) => {

  const containerHeight = buttonTitle ? 240 : 190;

  return (
    <View style={[styles.cardContainer, { height: containerHeight }]}>
      <MaterialCommunityIcons name={icon} size={30} color={COLORS.tertiary} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {buttonTitle ? 
      <Pressable onPress={onButtonPress} style={styles.button}>
        <Text style={styles.buttonText}>{buttonTitle}</Text>
      </Pressable>
      : null }
    </View>
  )
}

export default StatusPlaceholder

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: 'white',
    width: '100%',
    height: 220,
    borderRadius: 15,
    padding: 10,
    margin: 10,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  title: {
    ...FONTS.h2,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 16,
  },
  subtitle: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  button: {
    backgroundColor: COLORS.primary, 
    paddingVertical: 10,
    width: '80%',
    borderRadius: 50,
    marginTop: 24,
    alignItems: 'center'
  },
  buttonText: {
    ...FONTS.h4,
    fontWeight: 'bold',
    color: 'white'
  },
});
