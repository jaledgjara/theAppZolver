import React from "react";
import { StyleSheet, Text, View, FlatList } from "react-native";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { COLORS, FONTS } from "@/appASSETS/theme";
import QuoteRequestCard from "@/appCOMP/cards/QuoteRequestCard";

const QUOTE_REQUESTS = [
  {
    id: "1",
    category: "Electricidad",
    description: "Instalación tablero principal",
    clientName: "Juan Pérez",
    date: "Hoy, 10:30 AM",
    status: "Pendiente" as const,
  },
  {
    id: "2",
    category: "Electricidad",
    description: "Reparación fuga baño",
    clientName: "María Gonzalez",
    date: "Ayer, 18:45 PM",
    status: "Pendiente" as const,
  },
  {
    id: "3",
    category: "Electricidad",
    description: "Revisión estufa",
    clientName: "Carlos Lopez",
    date: "24 Abr, 09:00 AM",
    status: "Pendiente" as const,
  },
];

const IndexQuoteScreen = () => {
  // Filtramos solo los pendientes (lógica de negocio simple)
  const pendingQuotes = QUOTE_REQUESTS.filter((q) => q.status === "Pendiente");

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Widget de Resumen */}
      <View style={styles.statsCard}>
        <Text style={styles.statsNumber}>{pendingQuotes.length}</Text>
        <Text style={styles.statsLabel}>Solicitudes Pendientes</Text>
        <Text style={styles.statsSubLabel}>
          Requieren tu atención inmediata
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Bandeja de entrada</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={pendingQuotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <QuoteRequestCard
            category={item.category}
            description={item.description}
            clientName={item.clientName}
            date={item.date}
            status={item.status}
            onViewDetails={() => console.log(`Ver detalle ${item.id}`)}
          />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>¡Estás al día!</Text>
            <Text style={styles.emptySubText}>
              No tienes presupuestos pendientes.
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default IndexQuoteScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  // Estilos del Widget de Estadísticas
  statsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    marginBottom: 24,
    // Sombra suave
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  statsNumber: {
    fontSize: 40,
    color: COLORS.primary,
    fontWeight: "bold",
    paddingTop: 20,
  },
  statsLabel: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    fontWeight: "700",
    marginTop: 4,
  },
  statsSubLabel: {
    ...FONTS.body4,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    fontWeight: "bold",
    marginBottom: 12,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    ...FONTS.h3,
    color: COLORS.textSecondary,
    fontWeight: "bold",
  },
  emptySubText: {
    ...FONTS.body4,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
});
