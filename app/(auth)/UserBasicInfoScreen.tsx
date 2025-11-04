import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { ToolBarTitle } from '@/appCOMP/toolbar/Toolbar'
import { useRouter } from 'expo-router';
import { COLORS, FONTS } from '@/appASSETS/theme';
import AuthInput from '@/appSRC/auth/Screen/AuthInput';
import { LargeButton } from '@/appCOMP/button/LargeButton';
import CustomPhoneInput from '@/appSRC/auth/Screen/CustomPhoneInput';
import { useSignOut } from '@/appSRC/auth/Hooks/useSignOut';

const UserBasicInfoScreen = () => {
  const router = useRouter();
  const { handleSignOut } = useSignOut();
  const routerHandleSignInScreen = () => {
    router.push('/(auth)/PhoneVerificationScreen');
  };
  return (
    <View style={styles.container}>
      <ToolBarTitle
        titleText='Formulario de usuario'
        showBackButton={true}
        onBackPress={handleSignOut}
      />
      <View style={styles.contentContainer}>

        <View style={styles.infoContainer}>
          <Text style={styles.title}>Email</Text>
          <Text style={styles.subtitle}>emailDelUsuario@email.com</Text>
        </View>

        <CustomPhoneInput/>
      </View>

      <View style={styles.buttonContainer}>
        <LargeButton 
          title="Verificar teléfono" 
          onPress={routerHandleSignInScreen}
          iconName="phone-portrait-outline"
        />
      </View>

    </View>
  )
}

export default UserBasicInfoScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  buttonContainer: {
    justifyContent: 'center', 
    alignItems: 'center',
    width: '100%',
    paddingBottom: 50,
    paddingHorizontal: 20
  },
  infoContainer: {
    marginBottom: 16,
    width: '100%',
  },
  title: {
    ...FONTS.h3,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  subtitle: {
    ...FONTS.body3,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
});