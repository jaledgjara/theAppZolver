import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { COLORS } from '@/appASSETS/theme'

const MiniLoaderScreen = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.textSecondary} />
    </View>
  )
}

export default MiniLoaderScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white'
  },
})