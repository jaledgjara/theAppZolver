import React, { ComponentProps } from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../appASSETS/theme';
import { FONTS } from '../../appASSETS/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];


interface LargeButtonProps {
    // Propiedades esenciales
    title: string;
    onPress: () => void;
    
    // Propiedades de estilo y apariencia
    style?: StyleProp<ViewStyle>;
    backgroundColor?: string;
    textColor?: string;
    disabled?: boolean;
    
    // Propiedades opcionales del ícono
    iconName?: IoniconName; 
    iconColor?: string;
    iconSize?: number;
}

export const LargeButton: React.FC<LargeButtonProps> = ({
    title,
    onPress,
    style,
    backgroundColor = COLORS.primary,
    textColor = COLORS.white,
    disabled = false,
    iconName,
    iconColor,
    iconSize = 24,
}) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            disabled={disabled}
            style={[
                styles.buttonContainer,
                { backgroundColor: disabled ? '#CCCCCC' : backgroundColor },
                style,
            ]}
        >
            {iconName && (
                <Ionicons 
                    name={iconName} 
                    size={iconSize} 
                    color={iconColor || textColor} 
                    style={styles.iconStyle} 
                />  
            )}
            
            <Text 
                style={[
                    styles.buttonText, 
                    { color: textColor }
                ]}
            >
                {title}
            </Text>
        </TouchableOpacity>
    );
};

// ----------------------------------------------------------------------------------

const styles = StyleSheet.create({
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        marginVertical: 30,
        paddingVertical: 15,
        paddingHorizontal: 20, 
        borderRadius: 50,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    buttonText: {
        ...FONTS.h3,
        textAlign: 'center',
        fontWeight: 'bold'
    },
    iconStyle: {
        marginRight: 8,
    },
});