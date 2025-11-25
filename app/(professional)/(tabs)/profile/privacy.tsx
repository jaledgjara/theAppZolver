import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ToolBarTitle } from '@/appCOMP/toolbar/Toolbar';

export default function PrivacyScreen() {
  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Datos y Privacidad" showBackButton={true} />
      <View style={styles.content}>
        <Text>Gestión de datos personales.</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: 'white' }, content: { padding: 20 } });