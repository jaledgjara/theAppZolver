import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Clipboard,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES } from "@/appASSETS/theme";

export interface HelpCenterProps {
  mode: "client" | "professional";
}

export type HelpMethodType = "email" | "whatsapp";

export interface HelpMethodUI {
  id: HelpMethodType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  description: string;
}

export const HELP_METHODS_CONFIG: HelpMethodUI[] = [
  {
    id: "email",
    label: "Email",
    icon: "mail-outline",
    value: "soporte@zolver.com",
    description: "Copiar correo",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: "logo-whatsapp",
    value: "+5491123456789",
    description: "Abrir chat",
  },
];

export const QUESTIONS_AND_ANSWERS = [
  {
    id: "1",
    title: "¿Cómo solicito un servicio? ",
    answer:
      "Explora las categorías en el inicio, selecciona al profesional que mejor se adapte a tus necesidades y presiona el botón de reservar.",
  },
  {
    id: "2",
    title: "¿Es seguro el pago?",
    answer:
      "Sí, utilizamos procesamiento seguro y división de pagos (Split Payments) para proteger cada transacción en la plataforma.",
  },
  {
    id: "3",
    title: "¿Cómo contacto al profesional? ",
    answer:
      "Una vez realizada la reserva, se habilitará un chat directo dentro de la sección de Mensajes para coordinar detalles.",
  },
];
