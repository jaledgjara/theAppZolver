import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { ToolBarTitle } from '@/appCOMP/toolbar/Toolbar'
import { LargeButton } from '@/appCOMP/button/LargeButton'
import StatusPlaceholder from '@/appCOMP/contentStates/StatusPlaceholder';
import { useHandleEmailLink } from '@/appSRC/auth/Hooks/usePasswordlessEmail';

const ConfirmationEmailScreen = () => {
  const { loading } = useHandleEmailLink();
  
  return (
    <View style={styles.container}>
      <ToolBarTitle
        titleText="Verificación del email"
        showBackButton={true}
      />
      <View style={styles.contentContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#3D5CFF" style={{ marginTop: 60 }} />
        ) : (
          <StatusPlaceholder
            icon="mail"
            title="Revisá tu bandeja de entrada"
            subtitle="Te enviamos un enlace para confirmar tu correo electrónico. Abrilo desde tu dispositivo para continuar con tu cuenta de Zolver."
          />
        )}
      </View>
    </View>
  );
};

export default ConfirmationEmailScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'flex-start', 
    alignItems: 'center',
    marginTop: 50
  }
})

