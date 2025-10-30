import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { ToolBarTitle } from '@/appCOMP/toolbar/Toolbar'

const PhoneVerificationScreen = () => {
  return (
    <View style={styles.container}>
      <ToolBarTitle
        titleText='Verificación de teléfono'
        showBackButton={true}
      />
    </View>
  )
}

export default PhoneVerificationScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
})