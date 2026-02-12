module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          // Mantenemos tu corrección para Supabase/import.meta
          unstable_transformImportMeta: true,
        },
      ],
    ],
    plugins: [
      // ELIMINADO: "expo-router/babel" (ya incluido en el preset desde SDK 50)

      // AGREGADO: Requerido por la versión ~4.1.1 que tienes instalada
      "react-native-reanimated/plugin",
    ],
  };
};
