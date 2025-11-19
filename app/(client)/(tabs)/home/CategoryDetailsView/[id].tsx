import { FlatList, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ToolBarTitle } from '@/appCOMP/toolbar/Toolbar';
import { ProfessionalCard } from '@/appSRC/home/Screens/ProfessionalCard';

const PROFESSIONALS_DATA = [
  {
    id: '1',
    name: 'Carlos Gómez',
    category: 'Pintor',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    rating: 5,
  },
  {
    id: '2',
    name: 'María López',
    category: 'Pintor',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    rating: 4,
  },
  {
    id: '3',
    name: 'Jorge Martínez',
    category: 'Pintor',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    rating: 4,
  },
  {
    id: '4',
    name: 'Laura Sánchez',
    category: 'Pintor',
    avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
    rating: 5,
  },
];


const CategoryDetailsView = () => {
  const { id, name } = useLocalSearchParams();
  const router = useRouter();

  // Normalize params: ensure they are always strings
  const categoryId = Array.isArray(id) ? id[0] : id;
  const categoryName = Array.isArray(name) ? name[0] : name;

  return (
    <View style={styles.container}>
      <ToolBarTitle
        titleText={categoryName ?? 'Categoría'}
        showBackButton={true}
      />

      <FlatList
        data={PROFESSIONALS_DATA}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 10 }}
        renderItem={({ item }) => (
          <ProfessionalCard
            avatar={item.avatar}
            name={item.name}
            category={item.category}
            rating={item.rating}
            onPress={() => router.push(`/professional/${item.id}`)}
          />
        )}
      />
    </View>
  );
};

export default CategoryDetailsView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  }, 
})