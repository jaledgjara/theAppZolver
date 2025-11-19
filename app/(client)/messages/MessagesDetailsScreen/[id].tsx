import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useLocalSearchParams } from 'expo-router';
import { ToolBarTitle } from '@/appCOMP/toolbar/Toolbar';
import MessageInput from '@/appSRC/messages/Screens/InputTextMessage';

const MessagesDetailsScreen = () => {
  const { id, name } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <ToolBarTitle
        titleText={name as string}
        showBackButton={true}
      />

      <View style={styles.chatArea}>
        <Text style={styles.placeholderText}></Text>
      </View>

      <MessageInput />
    </View>
  )
}

export default MessagesDetailsScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatArea: {
    flex: 1, // Esta área tomará todo el espacio restante
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#A0A0A0',
    fontSize: 14,
  },
  // Estilos del MessageInputBar y sus componentes internos (copiados y simplificados)
  outerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxHeight: 120,
    backgroundColor: '#E0E0E0',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 35,
    fontSize: 16,
    paddingHorizontal: 5,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    backgroundColor: '#007AFF', // Simulación de COLORS.primary
    borderRadius: 50,
    padding: 10,
    marginLeft: 5,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
