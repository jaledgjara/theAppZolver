import React from "react";
import { ScrollView, Text, StyleSheet, View } from "react-native";
import { COLORS, SIZES } from "@/appASSETS/theme";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";

const PrivacyPolicy = () => {
  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Política de Privacidad" showBackButton={true} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.date}>Última actualización: 10 de Abril de 2026</Text>

        <Text style={styles.sectionTitle}>1. Responsable del Tratamiento</Text>
        <Text style={styles.body}>
          Sus datos personales son tratados por NexoFix Argentina, con domicilio en la República
          Argentina, con el fin de gestionar la conexión entre oferta y demanda de servicios
          profesionales para el hogar, bajo el amparo de la Ley 25.326 de Protección de Datos
          Personales y su normativa complementaria.
        </Text>

        <Text style={styles.sectionTitle}>2. Datos Recolectados</Text>
        <Text style={styles.body}>
          {"• "}Identidad: Nombre completo y dirección de correo electrónico, obtenidos mediante
          inicio de sesión con Google o Apple.{"\n"}
          {"• "}Verificación: Número de teléfono móvil, verificado mediante código SMS a través de
          Twilio.{"\n"}
          {"• "}Ubicación: Geolocalización del dispositivo, utilizada para conectarlo con
          profesionales cercanos a su zona.{"\n"}
          {"• "}Documentación (profesionales): Foto de DNI y selfie de verificación, almacenados de
          forma segura en Firebase Storage.{"\n"}
          {"• "}Datos de uso: Información técnica del dispositivo y métricas de uso anónimas para
          mejorar la experiencia.
        </Text>

        <Text style={styles.sectionTitle}>3. Finalidad del Tratamiento</Text>
        <Text style={styles.body}>
          Sus datos son utilizados exclusivamente para:{"\n"}
          {"• "}Crear y administrar su cuenta de usuario.{"\n"}
          {"• "}Verificar su identidad y número telefónico.{"\n"}
          {"• "}Conectar clientes con profesionales según ubicación y categoría de servicio.{"\n"}
          {"• "}Gestionar reservas, pagos y comunicaciones entre las partes.{"\n"}
          {"• "}Enviar notificaciones relacionadas con el servicio.{"\n"}
          {"• "}Mejorar la calidad y seguridad de la plataforma.
        </Text>

        <Text style={styles.sectionTitle}>4. Seguridad de los Datos</Text>
        <Text style={styles.body}>
          Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos:{"\n"}
          {"• "}Row Level Security (RLS) en nuestra base de datos, garantizando que solo usted y las
          personas autorizadas accedan a su información.{"\n"}
          {"• "}Autenticación segura mediante Firebase Auth (Google, Apple, email sin contraseña).
          {"\n"}
          {"• "}Tokens JWT con tiempo de vida limitado y validación estricta.{"\n"}
          {"• "}Comunicaciones cifradas mediante HTTPS/TLS.{"\n"}
          {"• "}Rate limiting y validación de entradas en todos los endpoints del servidor.
        </Text>

        <Text style={styles.sectionTitle}>5. Transferencia Internacional de Datos</Text>
        <Text style={styles.body}>
          El usuario consiente la transferencia de datos a los servidores de Firebase (Google Cloud)
          y Supabase, ubicados en Estados Unidos, los cuales cumplen con estándares internacionales
          de protección de datos, incluyendo certificaciones SOC 2 e ISO 27001.
        </Text>

        <Text style={styles.sectionTitle}>6. Procesamiento de Pagos</Text>
        <Text style={styles.body}>
          Los pagos se procesan a través de Mercado Pago. NexoFix no almacena datos de tarjetas de
          crédito ni información financiera sensible. Toda la información de pago es gestionada
          directamente por Mercado Pago conforme a sus políticas de seguridad (PCI DSS).
        </Text>

        <Text style={styles.sectionTitle}>7. Derechos ARCO</Text>
        <Text style={styles.body}>
          De acuerdo con la Ley 25.326, usted tiene derecho a:{"\n"}
          {"• "}Acceso: Solicitar información sobre sus datos almacenados.{"\n"}
          {"• "}Rectificación: Corregir datos inexactos o incompletos.{"\n"}
          {"• "}Cancelación: Solicitar la eliminación de sus datos personales.{"\n"}
          {"• "}Oposición: Oponerse al tratamiento de sus datos en determinadas circunstancias.
          {"\n\n"}
          Estos derechos pueden ejercerse de forma gratuita. El plazo de respuesta para solicitudes
          de acceso es de 10 días corridos. Para ejercer sus derechos, contáctenos a
          soporte@nexofix.com.
        </Text>

        <Text style={styles.sectionTitle}>8. Eliminación de Cuenta</Text>
        <Text style={styles.body}>
          Puede eliminar su cuenta en cualquier momento desde la sección de perfil dentro de la
          aplicación (botón "Eliminar cuenta"). Al hacerlo, se eliminarán sus datos personales de
          nuestros sistemas activos. Ciertos datos podrán conservarse por el plazo legal requerido
          para obligaciones fiscales o legales.
        </Text>

        <Text style={styles.sectionTitle}>9. Cookies y Tecnologías Similares</Text>
        <Text style={styles.body}>
          La versión web de NexoFix puede utilizar almacenamiento local del navegador para mantener
          su sesión activa. No utilizamos cookies de terceros con fines publicitarios.
        </Text>

        <Text style={styles.sectionTitle}>10. Modificaciones</Text>
        <Text style={styles.body}>
          NexoFix se reserva el derecho de modificar esta política. Las actualizaciones serán
          notificadas a través de la aplicación y entrarán en vigencia a partir de su publicación.
        </Text>

        <Text style={styles.sectionTitle}>11. Contacto</Text>
        <Text style={styles.body}>
          Para consultas sobre privacidad o protección de datos:{"\n"}
          Email: soporte@nexofix.com{"\n"}
          App: Sección Ayuda {">"} Contacto dentro de NexoFix
        </Text>
      </ScrollView>
    </View>
  );
};

export default PrivacyPolicy;

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
