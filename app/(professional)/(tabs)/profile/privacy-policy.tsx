import React from "react";
import { ScrollView, Text, StyleSheet, View } from "react-native";
import { COLORS, SIZES } from "@/appASSETS/theme";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";

const PrivacyPolicy = () => {
  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Política de Privacidad" showBackButton={true} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>1. Responsable del Tratamiento</Text>
        <Text style={styles.body}>
          Sus datos son tratados por Zolver Argentina, con el fin de gestionar
          la conexión entre oferta y demanda de servicios, bajo el amparo de la
          Ley 25.326.
        </Text>

        <Text style={styles.sectionTitle}>2. Datos Recolectados</Text>
        <Text style={styles.body}>
          • Identidad: Nombre y email (vía Google/Apple).{"\n"}• Verificación:
          Número telefónico (vía Twilio).{"\n"}• Ubicación: Geolocalización para
          el "matching" de servicios cercanos.
        </Text>

        <Text style={styles.sectionTitle}>3. Seguridad (Supabase RLS)</Text>
        <Text style={styles.body}>
          Sus datos están protegidos mediante Row Level Security (RLS) en
          Supabase, garantizando que solo usted y las personas autorizadas por
          la lógica de negocio tengan acceso a su información personal.
        </Text>

        <Text style={styles.sectionTitle}>4. Derechos ARCO</Text>
        <Text style={styles.body}>
          Usted tiene derecho a acceder, rectificar o suprimir sus datos
          gratuitamente. El plazo de respuesta para el acceso es de 10 días
          corridos. Para consultas, contactar a soporte@zolver.com.
        </Text>

        <Text style={styles.sectionTitle}>5. Transferencia Internacional</Text>
        <Text style={styles.body}>
          El usuario consiente la transferencia de datos a los servidores de
          Firebase y Supabase (EE.UU.), los cuales cumplen con estándares
          internacionales de protección.
        </Text>
      </ScrollView>
    </View>
  );
};

export default PrivacyPolicy;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  content: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: {
    fontSize: SIZES.h3,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginTop: 15,
    marginBottom: 10,
  },
  body: { fontSize: 14, lineHeight: 20 },
});
