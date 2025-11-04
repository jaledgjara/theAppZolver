import { StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import { ToolBarTitle } from '@/appCOMP/toolbar/Toolbar'
import { router, useRouter } from 'expo-router'
import AuthInput from '@/appSRC/auth/Screen/AuthInput'
import { LargeButton } from '@/appCOMP/button/LargeButton'
import { usePasswordlessEmail } from '@/appSRC/auth/Hooks/usePasswordlessEmail'

const SignInEmailScreen = () => {
  const [email, setEmail] = useState("");
  const { sendEmailLink, loading, error } = usePasswordlessEmail();

  return (
    <View style={styles.container}>
      <ToolBarTitle
        titleText="Continuar con email"
        showBackButton={true}
        onBackPress={router.back}
      />
      <View style={styles.contentContainer}>
        <AuthInput
          label="Email"
          iconName="mail"
          placeholder="ejemplo@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          error={error ?? undefined}
        />

        <LargeButton 
          title={'ENVIAR EMAIL'} 
          iconName='mail'
          onPress={() => sendEmailLink(email)} 
          loading={loading}
        />
      </View>

    </View>
  );
};

export default SignInEmailScreen

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
    paddingBottom: 45,
    marginTop: 30,
  }
})