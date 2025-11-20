// SectionCard.tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import SectionItem, { SectionItemProps } from './SectionItem';
import { COLORS } from '@/appASSETS/theme';

interface SectionCardProps {
  title: string;
  date?: string; // optional
  data: SectionItemProps[]; // list of items
}

const SectionCard: React.FC<SectionCardProps> = ({ title, date, data }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {date && <Text style={styles.date}>{date}</Text>}

      <View style={styles.listContainer}>
        <FlatList
          data={data}
          keyExtractor={(item, index) => `${item.title}-${index}`}
          renderItem={({ item }) => <SectionItem {...item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

export default SectionCard;

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    backgroundColor: '#FFF',      // ← NECESARIO PARA QUE LA SOMBRA ENVUELVA TODO
    borderRadius: 12,             // ← IMPORTANTE (si querés sombra bonita)
    padding: 16,                  // ← opcional, pero hace que título/fecha no queden pegados
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  date: {
    fontSize: 16,
    marginTop: 4,
    marginBottom: 12,
    color: COLORS.textSecondary,
  },
  listContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#E9E9E9',
  },
});
