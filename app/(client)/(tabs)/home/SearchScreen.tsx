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
import SearchModeSelector from "@/appSRC/searchable/Screen/SearchModeSelector";
import { useServiceSearch } from "@/appSRC/searchable/Hooks/useServiceSearch";
import { useServiceSelection } from "@/appSRC/categories/Hooks/useServiceCatalog";

const SearchScreen = () => {
  const router = useRouter();
  const { categories, loadingCategories } = useServiceSelection();
  const { query, results, loading, mode, handleTextSearch, handleModeChange } =
    useServiceSearch();

  const handleChipPress = (term: string) => {
    handleTextSearch(term);
  };

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Búsqueda" showBackButton={true} />

      <View style={styles.headerContainer}>
        {/* Barra de búsqueda de texto */}
        <SearchBar
          value={query}
          onChangeText={handleTextSearch}
          placeholder="¿Qué servicio necesitas hoy?"
        />

        {/* ⚡️ SELECTOR DE MODO (Zolver Ya vs Presupuesto) */}
        <SearchModeSelector
          currentMode={mode}
          onModeChange={handleModeChange}
        />

        {/* Sección de Sugerencias (Chips) */}
        <View style={styles.recommendationContainer}>
          {loadingCategories ? (
            <ActivityIndicator color={COLORS.primary} size="small" />
          ) : (
            <QuickChips
              items={
                categories.length > 0
                  ? categories.map((cat) => cat.name)
                  : ["Plomería", "Gasista"]
              } // Fallback visual
              onPress={handleChipPress}
            />
          )}
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <ProfessionalCard
            avatar={item.photo_url || "https://via.placeholder.com/150"}
            name={item.legal_name}
            category={item.specialization_title}
            rating={item.rating}
            // price={0} // Precio a convenir según la lógica nueva
            distance={item.dist_meters} // Distancia real desde PostGIS
            onPress={() => {
              router.push({
                pathname: "/(client)/professionalDetails/[id]",
                params: {
                  id: item.user_id,
                  mode: mode,
                },
              });
            }}
          />
        )}
        ListEmptyComponent={
          !loading && query.length === 0 ? (
            <StatusPlaceholder
              icon="home-search"
              title="Buscar"
              subtitle="Comienza a escribir para encontrar servicios cercanos"
            />
          ) : !loading && query.length > 0 ? (
            <StatusPlaceholder
              icon="magnify-close"
              title="Sin resultados"
              subtitle={`No encontramos profesionales para "${query}" cerca de ti.`}
            />
          ) : null
        }
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
