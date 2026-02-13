import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "@/appASSETS/theme";

// Habilitar animaciones en Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── 1. DATA LAYER (Tus preguntas originales + Estructura Web) ───

const FAQ_DATA = [
  {
    id: "1",
    question: "¿Cómo solicito un servicio?",
    answer:
      "Explora las categorías en el inicio, selecciona al profesional que mejor se adapte a tus necesidades y presiona el botón de reservar. El proceso es inmediato.",
  },
  {
    id: "2",
    question: "¿Es seguro el pago?",
    answer:
      "Sí, utilizamos procesamiento seguro y división de pagos (Split Payments) para proteger cada transacción. Tu dinero se retiene hasta que el servicio finaliza.",
  },
  {
    id: "3",
    question: "¿Cómo contacto al profesional?",
    answer:
      "Una vez realizada la reserva, se habilitará un chat directo dentro de la sección de Mensajes para coordinar detalles específicos del trabajo.",
  },
  // Agregué una extra para balancear visualmente la web
  {
    id: "4",
    question: "¿Puedo cancelar una reserva?",
    answer:
      "Sí, puedes cancelar desde la sección 'Mis Reservas'. Dependiendo de la antelación con la que canceles, podría aplicar una pequeña tasa de servicio.",
  },
];

// ─── 2. UI COMPONENTS (Accordion Item) ───

function FaqItem({ item }: { item: (typeof FAQ_DATA)[0] }) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    // Animación suave nativa
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <Pressable style={styles.faqItem} onPress={toggleExpand}>
      <View style={styles.faqHeader}>
        <Text
          style={[styles.faqQuestion, expanded && styles.faqQuestionActive]}>
          {item.question}
        </Text>
        <Ionicons
          name={expanded ? "remove-circle-outline" : "add-circle-outline"}
          size={28}
          color={expanded ? COLORS.primary : COLORS.textSecondary}
        />
      </View>

      {/* Contenido desplegable */}
      {expanded && (
        <View style={styles.faqBody}>
          <Text style={styles.faqAnswer}>{item.answer}</Text>
        </View>
      )}
    </Pressable>
  );
}

function ContactOption({ icon, title, subtitle, action }: any) {
  return (
    <Pressable style={styles.contactCard} onPress={action}>
      <View style={styles.contactIcon}>
        <Ionicons name={icon} size={28} color={COLORS.primary} />
      </View>
      <View>
        <Text style={styles.contactTitle}>{title}</Text>
        <Text style={styles.contactSub}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

// ─── 3. PAGE COMPONENT ───

export default function SupportPage() {
  const handleEmail = () => Linking.openURL("mailto:soporte@zolver.app");
  const handleWhatsapp = () => Linking.openURL("https://wa.me/5491100000000"); // Tu número real

  return (
    <View style={styles.container}>
      {/* HERO HEADER */}
      <View style={styles.header}>
        <Text style={styles.tagline}>CENTRO DE AYUDA</Text>
        <Text style={styles.title}>¿Cómo podemos ayudarte?</Text>
        <Text style={styles.subtitle}>
          Resuelve tus dudas sobre Zolver. Si no encuentras lo que buscas,
          nuestro equipo está listo para asistirte.
        </Text>
      </View>

      {/* FAQ SECTION */}
      <View style={styles.faqSection}>
        {FAQ_DATA.map((item) => (
          <FaqItem key={item.id} item={item} />
        ))}
      </View>

      {/* CONTACT CTA SECTION */}
      <View style={styles.contactSection}>
        <Text style={styles.contactHeader}>¿Sigues con dudas?</Text>
        <View style={styles.contactGrid}>
          <ContactOption
            icon="mail-outline"
            title="Envíanos un Email"
            subtitle="Respuesta en 24hs"
            action={handleEmail}
          />
          <ContactOption
            icon="logo-whatsapp"
            title="Chat de Soporte"
            subtitle="Lun a Vie, 9am - 6pm"
            action={handleWhatsapp}
          />
        </View>
      </View>
    </View>
  );
}

// ─── STYLES ───

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 80,
    paddingHorizontal: SIZES.padding,
    alignItems: "center",
    width: "100%",
    maxWidth: 1000, // Un poco más angosto para lectura cómoda
    alignSelf: "center",
  },

  // HEADER
  header: {
    alignItems: "center",
    marginBottom: 60,
    maxWidth: 700,
  },
  tagline: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 1.5,
    marginBottom: 16,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 48,
    fontWeight: "900",
    color: COLORS.textPrimary,
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 28,
  },

  // FAQ LIST
  faqSection: {
    width: "100%",
    marginBottom: 80,
    gap: 16,
  },
  faqItem: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#eee",
    // Sombra sutil
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 16,
  },
  faqQuestionActive: {
    color: COLORS.primary, // Resaltar pregunta activa
  },
  faqBody: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f5f5f5",
  },
  faqAnswer: {
    fontSize: 16,
    color: "#555",
    lineHeight: 26,
  },

  // CONTACT SECTION
  contactSection: {
    width: "100%",
    alignItems: "center",
    backgroundColor: COLORS.backgroundLight || "#FAFAFA",
    padding: 50,
    borderRadius: 30,
  },
  contactHeader: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 30,
  },
  contactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
    justifyContent: "center",
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 16,
    minWidth: 280,
    gap: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    cursor: "pointer", // UX para web
  },
  contactIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  contactSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
