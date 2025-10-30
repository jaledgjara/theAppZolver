export const COLORS = {
  // --- Colores Principales ---
  primary: '#FFC107',    // El amarillo/dorado principal para botones y acentos.
  tertiary: '#00796B',   // El verde azulado para acciones secundarias o informativas.
  
  // --- Fondos y Superficies ---
  backgroundLight: '#FFFAFA', // Un fondo de color blanco roto.
  backgroundInput: '#EBEBEB', // El fondo blanco puro para campos de texto.
  white: '#FFFFFF',

  // --- Texto ---
  textPrimary: '#212121',   // Un color de texto oscuro estándar (placeholder).
  textSecondary: '#757575', // Un gris para texto menos importante u "OFF".
  textOnPrimary: '#FFFFFF', // Texto que va sobre un fondo de color (ej. texto blanco en botón verde).
  
  // --- Bordes y Divisores ---
  border: '#BDBDBD',     // Un color de borde sutil para inputs (placeholder).
  
  // --- Colores de Estado ---
  success: '#4CAF50',     // Verde para acciones exitosas.
  error: '#F44336',       // Rojo para errores o alertas.
  warning: '#FF9800',     // Naranja para advertencias.
};

export const SIZES = {
  // base sizes
  base: 8,
  font: 14,
  radius: 12,
  padding: 24,

  // font sizes
  h1: 30,
  h2: 22,
  h3: 18,
  h4: 14,
  body1: 30,
  body2: 20,
  body3: 16,
  body4: 14,
};

export const FONTS = {
    h1: { fontFamily: 'Roboto-Black', fontSize: SIZES.h1, lineHeight: 36 },
    h2: { fontFamily: 'Roboto-Bold', fontSize: SIZES.h2, lineHeight: 30 },
    h3: { fontFamily: 'Roboto-Bold', fontSize: SIZES.h3, lineHeight: 22 },
    h4: { fontFamily: 'Roboto-Bold', fontSize: SIZES.h4, lineHeight: 22 },
    body1: { fontFamily: 'Roboto-Regular', fontSize: SIZES.body1, lineHeight: 36 },
    body2: { fontFamily: 'Roboto-Regular', fontSize: SIZES.body2, lineHeight: 30 },
    body3: { fontFamily: 'Roboto-Regular', fontSize: SIZES.body3, lineHeight: 22 },
    body4: { fontFamily: 'Roboto-Regular', fontSize: SIZES.body4, lineHeight: 22 },
};

const appTheme = { COLORS, SIZES, FONTS };

export default appTheme;