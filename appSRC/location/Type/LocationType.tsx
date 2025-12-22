// appSRC/locations/Type/LocationTypes.ts

export interface Address {
  id: string;
  user_id: string;
  label: string | null;
  address_street: string;
  address_number: string;
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

export const LOCATION_TYPES = [
  { id: "home", label: "Casa", icon: "home-outline" },
  { id: "work", label: "Trabajo", icon: "briefcase-outline" },
  { id: "other", label: "Otro", icon: "location-outline" },
];
