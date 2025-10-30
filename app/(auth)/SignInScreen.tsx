import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router';
import { ToolBarTitle } from '@/appCOMP/toolbar/Toolbar';
import { COLORS, SIZES } from '@/appASSETS/theme';
import AuthButton from '@/appSRC/auth/Screen/AuthButton';
import { Ionicons } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/appSRC/auth/Store/AuthStore';
import { useAppleSignIn } from '@/appSRC/auth/Hooks/useAppleSignIn';


const SignInScreen = () => {
  const router = useRouter();

  const { handleAppleSignIn } = useAppleSignIn();

  const handleUserBasicForm = () => {
    router.push('/(auth)/UserBasicInfoScreen');
  };
  const setStatus = useAuthStore((state) => state.setStatus);
  
    const routerHandleGoBack = () => {
      setStatus("unknown");
    };
  
  return (
    <View style={styles.container}>
      <ToolBarTitle
        titleText='¡Conectate a Zolver!'
        showBackButton={true}
        onBackPress={routerHandleGoBack}
      />
      <View style={styles.contentContainer}>
        <Text style={styles.subtitle}>Accedé a tus servicios y profesionales rápidamente desde tus dispositivos.</Text>

        <View style={styles.buttonContainer}>
          <AuthButton
            title="Continuar con email"
            icon={<Ionicons name="mail" size={22} color="#FFFFFF"/>}
            onPress={handleUserBasicForm}
            style={{ backgroundColor: '#FBBF24', borderColor: COLORS.primary, marginBottom: 15 }}
            textColor="white"
          />
          <AuthButton
            title="Continuar con Google"
            icon={<AntDesign name="google" size={22} color="#FFFFFF" />}
            onPress={handleUserBasicForm}
            style={{ backgroundColor: '#3872F1', marginBottom: 15 }}
            textColor="white"
          />
          <AuthButton
            title="Continuar con Apple"
            icon={<MaterialCommunityIcons name="apple" size={24} color="#FFFFFF" />}
            onPress={handleAppleSignIn}
            style={{ backgroundColor: '#1A202C', borderColor: '#1A202C' }}
            textColor="#FFFFFF"
          />                 
        </View>
      </View>

    </View>
  )
}

export default SignInScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingBottom: 67,
    paddingHorizontal: 20
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
  }
});