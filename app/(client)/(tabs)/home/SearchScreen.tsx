import { StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import { ToolBarTitle } from '@/appCOMP/toolbar/Toolbar'
import SearchBar from '@/appCOMP/searchable/SearchBar'
import StatusPlaceholder from '@/appCOMP/contentStates/StatusPlaceholder'
import QuickChips from '@/appCOMP/quickChips/QuickChips'

const QUICK_SUGGESTIONS = [
  "Plomería",
  "Limpieza",
  "Jardinería",
  "Electricidad",
  "Pintura",
  "Mudanzas",
  "Gasista",
];

const SearchScreen = () => {
  const [search, setSearch] = useState("");

  const handleChipPress = (term: string) => {
    setSearch(term);
  };

  return (
    <View style={styles.container}>
      
      <ToolBarTitle
        titleText="Búsqueda"
        showBackButton={true}
      />
      
      <View style={styles.contentContainer}>
        
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="¿Qué servicio necesitas hoy?"
        />

        <View style={styles.recommendationContainer}>
          <QuickChips 
            items={QUICK_SUGGESTIONS}
            onPress={handleChipPress}
          />
        </View>

        {search.length === 0 && (
          <StatusPlaceholder 
            icon="home-search"
            title="Buscar"
            subtitle="Comienza a escribir para encontrar servicios"
          />
        )}

      </View>

    </View>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  }, 
  contentContainer: {
    paddingHorizontal: 20,
    marginTop: 47,
    alignItems: 'center',
  },
  recommendationContainer: {
    width: '100%',
    marginTop: 25,
    justifyContent: 'space-around',
    paddingBottom: 50
  },
});
