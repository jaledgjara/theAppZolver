import { COLORS, SIZES } from '@/appASSETS/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';

interface SearchBarProps {
  value: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  onPress?: () => void; 
}

/**
 * SearchBar
 * - Two modes:
 *   1) Navigational mode → full bar is pressable (like Airbnb home search)
 *   2) Editable mode → normal text input
 * - Visual improvements: softer radius, subtle shadow, balanced padding.
 */
const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = "Buscar...",
  onPress
}) => {

  const isNavigationalMode = !!onPress;
  const ContainerComponent = onPress ? TouchableOpacity : View;

  // Dynamic container style applied properly
  const containerStyle: ViewStyle = {
    ...styles.container,
    marginTop: isNavigationalMode ? 55 : 10,
    marginHorizontal: isNavigationalMode ? 25 : 0
  };

  return (
    <ContainerComponent 
      onPress={onPress}
      activeOpacity={0.8}
      style={containerStyle}
    >
      <View style={styles.contentWrapper}>
        <Ionicons
          name="search"
          size={22}
          color="#9CA3AF"
          style={styles.icon}
        />

        {isNavigationalMode ? (
          <Text style={styles.placeholderText}>{placeholder}</Text>
        ) : (
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            placeholderTextColor="rgba(156, 163, 175, 0.7)" // softer gray
          />
        )}
      </View>
    </ContainerComponent>
  );
};

export default SearchBar;

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: 24,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',

    // subtle depth
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 2, height: 2 },
    shadowRadius: 10,
    elevation: 1,
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    color: COLORS.textPrimary,
    fontSize: SIZES.h3 + 1,
    padding: 0,
  },
  placeholderText: {
    flex: 1,
    color: "rgba(156,163,175,0.8)",
    fontSize: SIZES.h3 + 1,
  },
});
