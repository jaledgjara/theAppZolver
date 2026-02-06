import { supabase } from "@/appSRC/services/supabaseClient";
import { ConversationDTO, Conversation } from "../Type/ConversationType";
import {
  mapConversationDTOToDomain,
  PartnerProfileSummary,
} from "../Mapper/ConversationMapper";

export const ConversationService = {
  // OBTENER MIS CONVERSACIONES
  // ✅ Recibimos authUserId directo y lo usamos directo. Sin conversiones.
  getMyConversations: async (authUserId: string): Promise<Conversation[]> => {
    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
        *,
        p1:user_accounts!participant1_id (
          auth_uid, 
          legal_name,
          role,
          professional_profiles (photo_url)
        ),
        p2:user_accounts!participant2_id (
          auth_uid, 
          legal_name,
          role,
          professional_profiles (photo_url)
        )
      `
      )
      .or(`participant1_id.eq.${authUserId},participant2_id.eq.${authUserId}`)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);
    if (!data) return [];

    return data.map((row: any) => {
      const isP1Me = row.participant1_id === authUserId;
      const rawPartner = isP1Me ? row.p2 : row.p1;

      // ✅ EXTRACCIÓN RESILIENTE (1:1 vs 1:N)
      // En relaciones 1:1 con UNIQUE, Supabase a veces devuelve un objeto en lugar de un array.
      let partnerPhoto = null;
      if (rawPartner?.professional_profiles) {
        if (Array.isArray(rawPartner.professional_profiles)) {
          partnerPhoto = rawPartner.professional_profiles[0]?.photo_url;
        } else {
          // Si Supabase lo devolvió como objeto plano
          partnerPhoto = (rawPartner.professional_profiles as any).photo_url;
        }
      }

      const partnerProfile: PartnerProfileSummary = {
        id: rawPartner?.auth_uid || "deleted",
        name: rawPartner?.legal_name || "Usuario Zolver",
        role: (rawPartner?.role as "client" | "professional") || "client",
        avatar: partnerPhoto,
      };

      // LOG DE CONTROL FINAL
      console.log(
        `✅ [Zolver Debug] Partner: ${partnerProfile.name} | Role: ${partnerProfile.role} | Path: ${partnerProfile.avatar}`
      );

      return mapConversationDTOToDomain(
        row as ConversationDTO,
        authUserId,
        partnerProfile,
        false
      );
    });
  },

  // OBTENER O CREAR
  // ✅ Mucho más simple: Insertamos lo que viene del AuthStore
  getOrCreateConversation: async (
    myAuthId: string,
    partnerAuthId: string
  ): Promise<string> => {
    // A. Buscar existente
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .or(
        `and(participant1_id.eq.${myAuthId},participant2_id.eq.${partnerAuthId}),and(participant1_id.eq.${partnerAuthId},participant2_id.eq.${myAuthId})`
      )
      .maybeSingle();

    if (existing) return existing.id;

    // B. Crear nueva (Directo, sin lookups)
    const { data: newConv, error } = await supabase
      .from("conversations")
      .insert({
        participant1_id: myAuthId,
        participant2_id: partnerAuthId,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) throw error;
    return newConv.id;
  },
};
