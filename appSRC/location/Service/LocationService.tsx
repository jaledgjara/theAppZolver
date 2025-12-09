// appSRC/location/Service/LocationService.ts

import { supabase } from "@/appSRC/services/supabaseClient";
import { Address, CreateAddressDTO } from "../Type/LocationType";

export const LocationService = {
  /**
   * 1. Obtener direcciones asegurando traer LATITUDE y LONGITUDE
   */
  async fetchUserAddresses(userId: string): Promise<Address[]> {
    console.log("📡 [Service] Pidiendo direcciones a Supabase...");

    // 🔥 CLAVE: Incluir 'latitude, longitude' en el select explícitamente
    const { data, error } = await supabase
      .from("user_addresses")
      .select(
        "id, user_id, label, address_street, address_number, floor, apartment, instructions, is_default, latitude, longitude"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ [Service] Error Supabase:", error);
      throw error;
    }

    // 🟢 LOG DE VERIFICACIÓN
    if (data && data.length > 0) {
      console.log(`✅ [Service] Recibidas ${data.length} direcciones.`);
      console.log("   └─ Top 1 Raw (DB):", JSON.stringify(data[0]));
    } else {
      console.log(
        "⚠️ [Service] No se encontraron direcciones para este usuario."
      );
    }

    // Mapear de base de datos (plana) a tu tipo Address (anidado)
    return (data || []).map((dbItem: any) => ({
      id: dbItem.id,
      user_id: dbItem.user_id,
      label: dbItem.label,
      address_street: dbItem.address_street,
      address_number: dbItem.address_number,
      floor: dbItem.floor,
      apartment: dbItem.apartment,
      instructions: dbItem.instructions,
      is_default: dbItem.is_default,
      // 📍 TRANSFORMACIÓN CRÍTICA
      coords: {
        lat: dbItem.latitude || 0,
        lng: dbItem.longitude || 0,
      },
    }));
  },

  /**
   * 2. Guardar dirección y devolver el objeto COMPLETO con coordenadas
   */
  async addAddress(dto: CreateAddressDTO): Promise<Address | null> {
    console.log(
      "💾 [Service] Guardando nueva dirección...",
      dto.address_street
    );

    // 1. Insertamos en Supabase (guardando lat/long en columnas planas)
    const { data, error } = await supabase
      .from("user_addresses")
      .insert({
        user_id: dto.user_id,
        label: dto.label,
        address_street: dto.address_street,
        address_number: dto.address_number,
        floor: dto.floor,
        apartment: dto.apartment,
        instructions: dto.instructions,
        is_default: dto.is_default,
        latitude: dto.latitude, // 👈 Guardamos Latitud
        longitude: dto.longitude, // 👈 Guardamos Longitud
      })
      .select()
      .single();

    if (error) {
      console.error("❌ [Service] Error adding address:", error);
      return null;
    }

    console.log("✅ [Service] Dirección guardada con ID:", data.id);

    // 2. Retornamos el objeto Address con la estructura 'coords' que usa la App
    //    Esto permite que el Store se actualice sin tener que recargar desde la DB.
    return {
      id: data.id,
      user_id: data.user_id,
      label: data.label,
      address_street: data.address_street,
      address_number: data.address_number,
      floor: data.floor,
      apartment: data.apartment,
      instructions: data.instructions,
      is_default: data.is_default,
      coords: {
        lat: data.latitude, // 👈 Mapeo crítico para el Store
        lng: data.longitude,
      },
    };
  },

  /**
   * 3. Eliminar dirección
   */
  async deleteAddress(addressId: string): Promise<boolean> {
    const { error } = await supabase
      .from("user_addresses")
      .delete()
      .eq("id", addressId);

    if (error) {
      console.error("❌ [Service] Error deleting address:", error);
      return false;
    }
    return true;
  },
};
