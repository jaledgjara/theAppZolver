import React from "react";
// Importamos el componente reutilizable de appSRC
// Asegúrese de que la ruta de importación coincida con donde guardó su componente compartido
import { AddLocationScreen as AddLocationForm } from "@/appSRC/location/Screens/AddLocationScreen";

export default function AddLocationProfileRoute() {
  // Inyectamos la dependencia de origen: HOME
  return <AddLocationForm origin="profile" />;
}
