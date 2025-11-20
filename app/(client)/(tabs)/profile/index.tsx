import { FlatList, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { ToolBarTitle } from '@/appCOMP/toolbar/Toolbar'
import { Ionicons } from '@expo/vector-icons'
import ProfileCard from '@/appSRC/profile/Screens/ProfileCard';
import { LargeButton } from '@/appCOMP/button/LargeButton';
import { useRouter } from 'expo-router';

const MOCK_PROFILE_OPTIONS = [
  {
    id: '1',
    // Tarjeta de crédito/débito para métodos de pago
    icon: <Ionicons name="card-outline" size={20} color="black" />,
    title: 'Métodos de Pago',
    subtitle: 'Agrega o administra tus tarjetas y cuentas.',
  },
  {
    id: '2',
    // Pin de ubicación o mapa para direcciones de envío
    icon: <Ionicons name="location-outline" size={20} color="black" />,
    title: 'Direcciones de Envío',
    subtitle: 'Gestiona tus direcciones de entrega.',
  },
  {
    id: '3',
    // Campana para notificaciones
    icon: <Ionicons name="notifications-outline" size={20} color="black" />,
    title: 'Notificaciones',
    subtitle: 'Configura tus alertas y avisos.',
  },
  {
    id: '4',
    // Candado para privacidad y datos
    icon: <Ionicons name="lock-closed-outline" size={20} color="black" />,
    title: 'Datos y Privacidad',
    subtitle: 'Administra tus datos personales.',
  },
  {
    id: '5',
    // Rueda dentada para configuraciones de la aplicación
    icon: <Ionicons name="settings-outline" size={20} color="black" />,
    title: 'Configuración de la App',
    subtitle: 'Ajustes generales, idioma y más.',
  }
];

const Profile = () => {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <ToolBarTitle
        titleText='Perfil'
      />

      <FlatList
        data={MOCK_PROFILE_OPTIONS}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ProfileCard
            icon={item.icon}
            title={item.title}
            subtitle={item.subtitle}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

export default Profile

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  }
})