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
      // Strip all console.* calls in production builds to prevent
      // info leaks (UIDs, payment IDs) and improve performance.
      ...(process.env.NODE_ENV === "production" || process.env.BABEL_ENV === "production"
        ? [["transform-remove-console", { exclude: ["error"] }]]
        : []),

      // AGREGADO: Requerido por la versión ~4.1.1 que tienes instalada
      "react-native-reanimated/plugin",
    ],
  };
};
