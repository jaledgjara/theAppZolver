import { COLORS, SIZES } from "@/appASSETS/theme";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import React from "react";
import { ScrollView, Text, StyleSheet, View } from "react-native";

const TermsAndConditions = () => {
  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Términos y Condiciones" showBackButton={true} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}>
        <Text style={styles.date}>
          Última actualización: 14 de Enero de 2026
        </Text>

        <Text style={styles.sectionTitle}>1. Relación Contractual</Text>
        <Text style={styles.body}>
          Zolver es una plataforma tecnológica de intermediación. Al utilizar la
          App, usted acepta que Zolver no presta servicios profesionales
          directamente, sino que actúa como nexo entre Clientes y Profesionales
          Independientes.
        </Text>

        <Text style={styles.sectionTitle}>
          2. Registro y Validación (Twilio/Firebase)
        </Text>
        <Text style={styles.body}>
          Para garantizar la seguridad, es obligatorio validar su identidad
          mediante un número telefónico activo. Este proceso se realiza a través
          de Twilio y Firebase Auth. El usuario es responsable de la veracidad
          de los datos aportados.
        </Text>

        <Text style={styles.sectionTitle}>
          3. Derecho de Arrepentimiento y Baja
        </Text>
        <Text style={styles.body}>
          Conforme a la Ley 24.240 (Art. 34), el usuario tiene derecho a revocar
          la aceptación del servicio dentro de los 10 días corridos. Zolver
          incluye un "Botón de Baja" accesible en el perfil para rescindir la
          cuenta de forma inmediata.
        </Text>

        <Text style={styles.sectionTitle}>4. Responsabilidad</Text>
        <Text style={styles.body}>
          Zolver no es responsable por la calidad del trabajo final del
          Profesional. No obstante, se reserva el derecho de excluir a usuarios
          que incumplan las normas de trato digno establecidas en el Art. 8 bis
          de la Ley 24.240.
        </Text>
      </ScrollView>
    </View>
  );
};

export default TermsAndConditions;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  content: { paddingHorizontal: 20 },
  date: { fontSize: 12, color: COLORS.textSecondary, marginTop: 20 },
  sectionTitle: {
    fontSize: SIZES.h3,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginTop: 15,
    marginBottom: 10,
  },
  body: { fontSize: 14, lineHeight: 20 },
});
