// appSRC/locations/Type/LocationTypes.ts

export interface Address {
  id: string;
  user_id: string;
  label: string | null;
  address_street: string;
  address_number: string;
  city?: string | null;
  province?: string | null;
  // Nuevos campos para lectura
  floor?: string | null;
  apartment?: string | null;
  instructions?: string | null;

  coords: {
    lat: number;
    lng: number;
  };
  is_default: boolean;
}

// ... (resto del código)

export interface CreateAddressDTO {
  user_id: string;
  label?: string;
  address_street: string;
  address_number: string;

  // Nuevos campos opcionales
  floor?: string;
  apartment?: string;
  instructions?: string;

  // CAMBIO: Ahora son opcionales (?)
  latitude?: number;
  longitude?: number;

  is_default?: boolean;
}

/**
 * Formatea una Address como "Calle 123, Departamento, Provincia".
 * Filtra campos vacíos y el legacy "Ubicación actual".
 */
export function formatAddress(addr: Address): string {
  const street =
    addr.address_street && addr.address_street !== "Ubicación actual"
      ? addr.address_street
      : "";
  const streetFull = addr.address_number
    ? `${street} ${addr.address_number}`.trim()
    : street;

  return (
    [streetFull, addr.city, addr.province || "Mendoza"]
      .filter(Boolean)
      .join(", ") || "Ubicación actual"
  );
}

export const LOCATION_TYPES = [
  { id: "home", label: "Casa", icon: "home-outline" },
  { id: "work", label: "Trabajo", icon: "briefcase-outline" },
  { id: "other", label: "Otro", icon: "location-outline" },
];
