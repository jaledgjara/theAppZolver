import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ToolBarTitle } from '@/appCOMP/toolbar/Toolbar';

export default function PaymentMethodsScreen() {
  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Métodos de Pago" showBackButton={true} />
      <View style={styles.content}>
        <Text>Aquí irán las tarjetas y cuentas bancarias.</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: 'white' }, content: { padding: 20 } });