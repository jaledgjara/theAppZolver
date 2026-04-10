import { COLORS, SIZES } from "@/appASSETS/theme";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import React from "react";
import { ScrollView, Text, StyleSheet, View } from "react-native";

const TermsAndConditions = () => {
  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Términos y Condiciones" showBackButton={true} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.date}>Última actualización: 10 de Abril de 2026</Text>

        <Text style={styles.sectionTitle}>1. Relación Contractual</Text>
        <Text style={styles.body}>
          NexoFix es una plataforma tecnológica de intermediación que conecta Clientes con
          Profesionales Independientes para la prestación de servicios para el hogar. Al utilizar la
          aplicación, usted acepta que NexoFix no presta servicios profesionales directamente, sino
          que actúa como nexo facilitador entre las partes.
        </Text>

        <Text style={styles.sectionTitle}>2. Aceptación de los Términos</Text>
        <Text style={styles.body}>
          El uso de NexoFix implica la aceptación plena e incondicional de estos Términos y
          Condiciones, así como de la Política de Privacidad. Si no está de acuerdo, deberá
          abstenerse de utilizar la plataforma.
        </Text>

        <Text style={styles.sectionTitle}>3. Registro y Validación de Identidad</Text>
        <Text style={styles.body}>
          Para garantizar la seguridad de la comunidad, es obligatorio:{"\n"}
          {"• "}Registrarse mediante una cuenta de Google o Apple válida.{"\n"}
          {"• "}Verificar su número de teléfono móvil mediante código SMS.{"\n"}
          {"• "}Para profesionales: completar la verificación de identidad con foto de DNI y selfie.
          {"\n\n"}
          El usuario es responsable de la veracidad de los datos aportados. NexoFix se reserva el
          derecho de suspender cuentas con información falsa o fraudulenta.
        </Text>

        <Text style={styles.sectionTitle}>4. Uso de la Plataforma</Text>
        <Text style={styles.body}>
          Para Clientes:{"\n"}
          {"• "}Publicar solicitudes de servicio especificando categoría, descripción y ubicación.
          {"\n"}
          {"• "}Revisar perfiles, calificaciones y presupuestos de profesionales.{"\n"}
          {"• "}Confirmar reservas y realizar pagos a través de la plataforma.{"\n"}
          {"• "}Calificar y reseñar a los profesionales luego del servicio.{"\n\n"}
          Para Profesionales:{"\n"}
          {"• "}Recibir solicitudes de servicio en su zona y categoría.{"\n"}
          {"• "}Enviar presupuestos y comunicarse con clientes.{"\n"}
          {"• "}Gestionar su agenda, tarifas y zona de cobertura.{"\n"}
          {"• "}Recibir pagos por los servicios prestados.
        </Text>

        <Text style={styles.sectionTitle}>5. Pagos y Comisiones</Text>
        <Text style={styles.body}>
          Todos los pagos se procesan a través de Mercado Pago. NexoFix podrá retener una comisión
          por cada transacción completada. Los montos, comisiones y condiciones de pago se
          informarán de forma transparente antes de confirmar cada reserva. Las políticas de
          reembolso y cancelación se aplicarán según las condiciones vigentes al momento de la
          reserva.
        </Text>

        <Text style={styles.sectionTitle}>6. Derecho de Arrepentimiento y Baja</Text>
        <Text style={styles.body}>
          Conforme a la Ley 24.240 de Defensa del Consumidor (Art. 34), el usuario tiene derecho a
          revocar la aceptación del servicio dentro de los 10 días corridos desde la contratación.
          {"\n\n"}
          NexoFix incluye un botón de eliminación de cuenta accesible desde el perfil del usuario,
          permitiendo rescindir la cuenta de forma inmediata y sin costo.
        </Text>

        <Text style={styles.sectionTitle}>7. Responsabilidad y Limitaciones</Text>
        <Text style={styles.body}>
          NexoFix no es responsable por:{"\n"}
          {"• "}La calidad, puntualidad o resultado final del trabajo realizado por el Profesional.
          {"\n"}
          {"• "}Daños o perjuicios derivados de la relación directa entre Cliente y Profesional.
          {"\n"}
          {"• "}Interrupciones del servicio por causas de fuerza mayor o mantenimiento programado.
          {"\n\n"}
          NexoFix se reserva el derecho de excluir a usuarios que incumplan las normas de trato
          digno establecidas en el Art. 8 bis de la Ley 24.240.
        </Text>

        <Text style={styles.sectionTitle}>8. Propiedad Intelectual</Text>
        <Text style={styles.body}>
          Todo el contenido de la plataforma (diseño, logos, textos, código) es propiedad de NexoFix
          Argentina. Queda prohibida su reproducción total o parcial sin autorización expresa.
        </Text>

        <Text style={styles.sectionTitle}>9. Modificaciones</Text>
        <Text style={styles.body}>
          NexoFix se reserva el derecho de modificar estos términos en cualquier momento. Los
          cambios serán notificados a través de la aplicación y entrarán en vigencia a partir de su
          publicación. El uso continuado de la plataforma implica la aceptación de los términos
          actualizados.
        </Text>

        <Text style={styles.sectionTitle}>10. Ley Aplicable y Jurisdicción</Text>
        <Text style={styles.body}>
          Estos términos se rigen por las leyes de la República Argentina. Cualquier controversia
          será sometida a los tribunales ordinarios competentes de la Ciudad Autónoma de Buenos
          Aires, sin perjuicio del derecho del consumidor a iniciar acciones ante los tribunales de
          su domicilio (Art. 36, Ley 24.240).
        </Text>

        <Text style={styles.sectionTitle}>11. Contacto</Text>
        <Text style={styles.body}>
          Para consultas sobre estos términos:{"\n"}
          Email: soporte@nexofix.com{"\n"}
          App: Sección Ayuda {">"} Contacto dentro de NexoFix
        </Text>
      </ScrollView>
    </View>
  );
};

export default TermsAndConditions;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  content: { paddingHorizontal: 20, marginTop: 20, paddingBottom: 40 },
  date: { fontSize: 12, color: COLORS.textTertiary, marginBottom: 16 },
  sectionTitle: {
    fontSize: SIZES.h3,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginTop: 20,
    marginBottom: 10,
  },
  body: { fontSize: 14, lineHeight: 22, color: COLORS.textPrimary },
});
