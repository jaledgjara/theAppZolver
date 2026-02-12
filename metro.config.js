// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Definimos la ruta exacta al paquete que instalaste
const reactAsyncHookPath = path.resolve(
  projectRoot,
  "node_modules/react-async-hook",
);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  // ESTO ES EL PUENTE: Forzamos a que el nombre apunte a tu carpeta instalada
  "react-async-hook": reactAsyncHookPath,
};

// Aseguramos que Metro siempre mire en los módulos de la raíz como respaldo
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, "node_modules")];

module.exports = config;
