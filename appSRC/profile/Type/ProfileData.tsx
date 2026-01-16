import { id } from "date-fns/locale";
import { MenuItem } from "../Type/ProfileType";

export const PROFESSIONAL_MENU_ITEMS: MenuItem[] = [
  {
    id: "1",
    icon: "card-outline",
    title: "Métodos de Pago",
    subtitle: "Agrega o administra tus tarjetas y cuentas.",
    route: "/(professional)/(tabs)/profile/payment-methods",
  },
  {
    id: "2",
    icon: "construct-outline",
    title: "Administrar Servicios",
    subtitle: "Define tus tipos de servicios, extras y precios.",
    route: "/(professional)/(tabs)/profile/services",
  },
  {
    id: "3",
    icon: "notifications-outline",
    title: "Notificaciones",
    subtitle: "Configura tus alertas y avisos.",
    route: "/(professional)/(tabs)/profile/notifications",
  },
  {
    id: "4",
    icon: "lock-closed-outline",
    title: "Datos y Privacidad",
    subtitle: "Administra tus datos personales.",
    route: "/(professional)/(tabs)/profile/privacy",
  },
  {
    id: "5",
    icon: "headset-outline",
    title: "Soporte al cliente",
    subtitle: "Contactemos con soporte técnico para dudas.",
    route: "/(professional)/(tabs)/profile/help-center",
  },
  {
    id: "6",
    icon: "settings-outline",
    title: "Configuración de la App|",
    subtitle: "Cerrar sesión y más opciones.",
    route: "/(professional)/(tabs)/profile/app-settings",
  },
];

export const CLIENT_MENU_ITEMS: MenuItem[] = [
  {
    id: "1",
    icon: "card-outline",
    title: "Métodos de Pago",
    subtitle: "Agrega o administra tus tarjetas y cuentas.",
    route: "/(client)/(tabs)/profile/payment-methods",
  },
  {
    id: "2",
    icon: "location-outline",
    title: "Direcciones",
    subtitle: "Gestiona tus ubicaciones frecuentes.",
    route: "/(client)/(tabs)/profile/locations",
  },
  {
    id: "3",
    icon: "notifications-outline",
    title: "Notificaciones",
    subtitle: "Configura tus alertas y avisos.",
    route: "/(client)/(tabs)/profile/notifications",
  },
  {
    id: "4",
    icon: "lock-closed-outline",
    title: "Datos y Privacidad",
    subtitle: "Administra tus datos personales.",
    route: "/(client)/(tabs)/profile/privacy",
  },
  {
    id: "5",
    icon: "headset-outline",
    title: "Soporte al cliente",
    subtitle: "Contactemos con soporte técnico para dudas.",
    route: "/(client)/(tabs)/profile/help-center",
  },
  {
    id: "6",
    icon: "settings-outline",
    title: "Configuración de la App",
    subtitle: "Cerrar sesión y más opciones.",
    route: "/(client)/(tabs)/profile/app-settings",
  },
];

export const PROFESSIONAL_EDIT_OPTIONS = [
  {
    id: "1",
    icon: "person-outline",
    title: "Perfil Público",
    subtitle: "Foto, Bio, Especialidad y Portfolio",
    route: "/(professional)/profile-edit/person-outline",
  },
  {
    id: "2",
    icon: "briefcase-outline",
    title: "Configuración de Trabajo",
    subtitle: "Precio y Tipo de Trabajo (Instant/Quote)",
    route: "/(professional)/profile-edit/briefcase-outline",
  },
  {
    id: "3",
    icon: "map-outline",
    title: "Área de Servicio",
    subtitle: "Mapa y Radio de Cobertura",
    route: "/(professional)/profile-edit/map-outline",
  },
];
