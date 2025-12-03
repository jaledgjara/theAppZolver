import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import React, { useState } from "react";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import SearchBar from "@/appCOMP/searchable/SearchBar";
import StatusPlaceholder from "@/appCOMP/contentStates/StatusPlaceholder";
import QuickChips from "@/appCOMP/quickChips/QuickChips";
import { useRouter } from "expo-router";
import { COLORS } from "@/appASSETS/theme";

// Importamos lo nuevo
import { ProfessionalCard } from "@/appSRC/home/Screens/ProfessionalCard";
import { useServiceSearch } from "@/appSRC/searchable/Hooks/useServiceSearch";
import SearchModeSelector from "@/appSRC/searchable/Screen/SearchModeSelector";

const QUICK_SUGGESTIONS = [
  "Plomería",
  "Limpieza",
  "Jardinería",
  "Electricidad",
  "Gasista",
];

const SearchScreen = () => {
  const router = useRouter();

  // 🔥 CONEXIÓN AL CEREBRO (HOOK)
  const { query, results, loading, handleSearch } = useServiceSearch();
  const [search, setSearch] = useState("");
  const [searchMode, setSearchMode] = useState<"instant" | "quote">("instant");

  const handleChipPress = (term: string) => {
    handleSearch(term); // Usamos la función del hook
  };

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Búsqueda" showBackButton={true} />

      <View style={styles.headerContainer}>
        <SearchBar
          value={query} // El valor viene del hook
          onChangeText={handleSearch} // Cada letra dispara la búsqueda (con debounce)
          placeholder="¿Qué servicio necesitas hoy?"
        />

        {/* 2. Insertamos el selector aquí */}
        <SearchModeSelector
          currentMode={searchMode}
          onModeChange={setSearchMode}
        />

        <View style={styles.recommendationContainer}>
          <QuickChips items={QUICK_SUGGESTIONS} onPress={handleChipPress} />
        </View>
      </View>

      {/* 🔥 LISTA DE RESULTADOS REALES */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        // Renderizamos la tarjeta evolucionada
        renderItem={({ item }) => (
          <ProfessionalCard
            avatar={item.avatar_url || ""}
            name={item.name} // Nombre del servicio (ej: Reparación Split)
            category={item.description} // Descripción corta
            rating={item.rating}
            price={item.price} // Precio real
            distance={item.distance_meters} // Distancia calculada por PostGIS
            onPress={() => {
              // Navegamos al perfil del profesional
              router.push({
                pathname: "/(client)/professionalDetails/[id]",
                params: { id: item.professional_id },
              });
            }}
          />
        )}
        // Mostrar Placeholder solo si no hay búsqueda activa
        ListEmptyComponent={
          !loading && query.length === 0 ? (
            <StatusPlaceholder
              icon="home-search"
              title="Buscar"
              subtitle="Comienza a escribir para encontrar servicios cercanos"
            />
          ) : !loading && query.length > 0 ? (
            // Caso: Buscó pero no encontró nada
            <StatusPlaceholder
              icon="magnify-close"
              title="Sin resultados"
              subtitle={`No encontramos profesionales para "${query}" cerca de ti.`}
            />
          ) : null
        }
        // Loader al buscar
        ListFooterComponent={
          loading ? (
            <ActivityIndicator
              size="large"
              color={COLORS.primary}
              style={{ marginTop: 20 }}
            />
          ) : null
        }
      />
    </View>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  headerContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    alignItems: "center",
  },
  recommendationContainer: {
    width: "100%",
    marginTop: 15,
    marginBottom: 10,
  },
  listContent: {
    paddingBottom: 50,
    paddingTop: 10,
  },
});
