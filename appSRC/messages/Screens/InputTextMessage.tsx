import { COLORS } from "@/appASSETS/theme";
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import IconButton from "@/appCOMP/button/IconButton";


const MessageInput = () => {
  const [message, setMessage] = useState('');

  // Lógica de ejemplo para el botón de enviar/micrófono
  const handleSendPress = () => {
    if (message.trim()) {
      Alert.alert("Mensaje Enviado", message.trim());
      setMessage(''); // Limpiar el input después de enviar
    } else {
      // Si el campo está vacío, la acción predeterminada es enviar un audio
      Alert.alert("Acción", "Grabando mensaje de voz...");
    }
  };

  const sendIconName = message.trim() ? 'send' : 'mic';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
      style={styles.avoidingView}
    >
      <View style={styles.outerContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={COLORS.textSecondary}
            multiline={true}
          />

        </View>

        <IconButton
          size={50}
          backgroundColor="#007AFF"
          onPress={() => console.log("Send!")}
          icon={
            <Ionicons name="paper-plane-outline" size={26} color="#fff" />
          }
          style={{ marginLeft: 10 }}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default MessageInput;

const styles = StyleSheet.create({
  avoidingView: {
    paddingHorizontal: 0,
    backgroundColor: 'white',
    alignContent: 'center',
    height: 120,
    paddingTop: 5
  },
  outerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,     // Más espacio horizontal
    paddingVertical: 12,
  },

  inputContainer: {
    flex: 1,
    width: '100%',   // El input crece todo lo posible
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: 60,            // Permite mayor crecimiento
    backgroundColor: '#EDEDED',
    borderRadius: 25,
    paddingHorizontal: 18,     // Más cómodo para escribir
    paddingVertical: 12,       // Más alto visualmente
  },

  input: {
    flex: 1,
    maxHeight: 190,
    minHeight: 40,
    color: '#000',
    fontSize: 16,
    paddingHorizontal: 6,
    paddingTop: 0,
    paddingBottom: 0,
  },
  icon: {
    marginBottom: 5,
    marginHorizontal: 5,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    padding: 10,
    marginLeft: 5,
    justifyContent: 'center',
    alignItems: 'center',
  }
});