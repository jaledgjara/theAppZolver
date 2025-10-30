import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SIZES } from '../../appASSETS/theme';
import { ToolBarPresentation } from 'appCOMP/toolbar/ToolbarPresentation';
import { LargeButton } from 'appCOMP/button/LargeButton';
import { useAuthStore } from '@/appSRC/auth/Store/AuthStore';
import { stat } from 'fs';

const WelcomeScreen = () => {
  const router = useRouter();

  const setStatus = useAuthStore((state) => state.setStatus);

  const routerHandleSignInScreen = () => {
    setStatus("anonymous");
  };

  return (
    <View style={styles.container}>
      <ToolBarPresentation
        titleText='¡Bienvenido a Zolver!'
      />
      <View style={styles.contentContainer}>
        <Text style={styles.subtitle}>
          ¡Del problema a la solución, sin vueltas. Tu proyecto, resuelto!
        </Text>

        <View style={styles.buttonContainer}>
        <LargeButton 
          title="CONTINUAR" 
          onPress={routerHandleSignInScreen}
          iconName="arrow-forward-circle"
        />
        </View>
      </View>
    </View>
  );
}

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingBottom: 40
  },
  subtitle: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: 60,
  },
  buttonContainer: {
    justifyContent: 'center', 
    alignItems: 'center',
    width: '100%'
  },
});