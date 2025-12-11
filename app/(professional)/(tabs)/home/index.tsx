import React from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
} from "react-native";
// 1. Imports de Lógica y Datos
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { useProDashboard } from "@/appSRC/reservations/Hooks/useProDashboard";
// 2. Imports de Componentes UI
import SectionCard from "@/appSRC/homeProf/Screens/SectionCard";
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";
import StatusPlaceholder from "@/appCOMP/contentStates/StatusPlaceholder";
import { COLORS } from "@/appASSETS/theme";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";

const ProfessionalHomeScreen = () => {
  // A. Contexto Global
  const { user } = useAuthStore();

  // B. El "Thinker" (Hook de Lógica)
  const { data, isLoading, isRefreshing, error, refetch } = useProDashboard(
    user?.uid
  );

  // C. Estado de Carga Bloqueante
  if (isLoading) {
    return <MiniLoaderScreen />;
  }

  // D. Manejo de Errores
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: COLORS.error }}>{error}</Text>
      </View>
    );
  }

  // E. Renderizado Declarativo
  return (
    <View style={styles.container}>
      <ToolBarTitle titleText={"Inicio"} />

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refetch}
            colors={[COLORS.primary]} // Android
            tintColor={COLORS.primary} // iOS
          />
        }>
        {/* SECCIÓN 1: AGENDA DE HOY */}
        <View>
          {data.today.length === 0 ? (
            <StatusPlaceholder
              icon="calendar-blank-outline"
              title="Agenda despejada"
              subtitle="No tienes servicios programados para el día de hoy. ¡Buen descanso!"
            />
          ) : (
            <SectionCard
              title="Reservaciones de hoy"
              data={data.today.map((res) => ({
                title: res.title || "Servicio sin título",
                // Formato: 14:00 hs
                subtitle: `${res.schedule.startDate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })} hs`,
                isTime: true, // Icono de reloj
                status: "Confirmado", // Badge Verde
                onPress: () => console.log("Ir a detalle hoy", res.id),
              }))}
            />
          )}
        </View>

        {/* SECCIÓN 2: PENDIENTES */}
        {data.pending.length > 0 && (
          <SectionCard
            title="Confirmaciones pendientes"
            data={data.pending.map((res) => ({
              // Intentamos mostrar nombre del servicio o cliente
              title: res.title || "Solicitud Nueva",
              subtitle: `Solicitud de ${res.serviceCategory}`,
              status: "Pendiente", // Badge Naranja
              onPress: () => console.log("Ir a detalle pendiente", res.id),
            }))}
          />
        )}

        {/* SECCIÓN 3: ALERTAS */}
        {data.alerts.length > 0 && (
          <SectionCard
            title="Alertas recientes"
            data={data.alerts.map((res) => ({
              title:
                res.status === "canceled_client"
                  ? "Cancelación de cliente"
                  : "Disputa abierta",
              // Mapeamos el título original al subtítulo para dar contexto
              subtitle: res.title || "Ver detalles",
              status: res.status === "canceled_client" ? "Cancelado" : "Alerta", // Badge Rojo/Amarillo
              onPress: () => console.log("Ver alerta", res.id),
            }))}
          />
        )}

        {/* Espacio extra al final */}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
  },
  contentContainer: {
    padding: 16,
    gap: 24,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ProfessionalHomeScreen;
