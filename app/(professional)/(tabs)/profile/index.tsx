import { FlatList, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { ToolBarTitle } from '@/appCOMP/toolbar/Toolbar'

// mockProfileProfessional.ts
import { Ionicons } from "@expo/vector-icons";
import ProfileCard from '@/appSRC/profile/Screens/ProfileCard';
import { useRouter } from 'expo-router';

export const MOCK_PROFILE_PRO_OPTIONS = [
  {
    id: "1",
    icon: <Ionicons name="card-outline" size={20} color="black" />,
    title: "Métodos de Pago",
    subtitle: "Agrega o administra tus tarjetas y cuentas.",
    route: "(professional)/profile/payment-methods",
  },
  {
    id: "2",
    icon: <Ionicons name="construct-outline" size={20} color="black" />,
    title: "Servicios",
    subtitle: "Define tus tipos de servicios, extras y precios.",
    route: "(professional)/profile/services",
  },
  {
    id: "3",
    icon: <Ionicons name="notifications-outline" size={20} color="black" />,
    title: "Notificaciones",
    subtitle: "Configura tus alertas y avisos.",
    route: "(professional)/profile/notifications",
  },
  {
    id: "4",
    icon: <Ionicons name="lock-closed-outline" size={20} color="black" />,
    title: "Datos y Privacidad",
    subtitle: "Administra tus datos personales.",
    route: "(professional)/profile/privacy",
  },
  {
    id: "5",
    icon: <Ionicons name="settings-outline" size={20} color="black" />,
    title: "Configuración de la App",
    subtitle: "Ajustes generales, idioma y más.",
    route: "(professional)/profile/app-settings",
  },
];



const ProfileProfessional = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Perfil" />

      <FlatList
        data={MOCK_PROFILE_PRO_OPTIONS}
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
  );
};


export default ProfileProfessional

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1
  },
})