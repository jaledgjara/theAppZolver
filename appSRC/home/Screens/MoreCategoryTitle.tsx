import { COLORS, SIZES } from '@/appASSETS/theme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';


interface SectionHeaderProps {
  title: string;
  linkText?: string;       // optional text like "Ver todo"
  linkIcon?: React.ReactNode;  // optional icon
  onLinkPress?: () => void;
}

/**
 * SectionHeader
 * Supports:
 *  - text links (e.g. "Ver más")
 *  - icon links (e.g. <Ionicons name="chevron-forward" />)
 */
const SectionHeader = ({ title, linkText, linkIcon, onLinkPress }: SectionHeaderProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {(linkText || linkIcon) && (
        <TouchableOpacity onPress={onLinkPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          {linkIcon ? (
            linkIcon
          ) : (
            <Text style={styles.link}>{linkText}</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SectionHeader;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 60,
  },
  title: {
    fontSize: SIZES.h2,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  link: {
    fontSize: SIZES.h3 + 1,
    color: COLORS.primary,
    fontWeight: '600',
  }
});
