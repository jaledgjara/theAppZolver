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
    // Query optimizada: Relación directa via auth_uid
    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
        *,
        participant1:user_accounts!participant1_id ( id, legal_name, role, auth_uid ),
        participant2:user_accounts!participant2_id ( id, legal_name, role, auth_uid )
      `
      )
      // ✅ Supabase ahora entiende esto porque la FK apunta a auth_uid
      .or(`participant1_id.eq.${authUserId},participant2_id.eq.${authUserId}`)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      throw new Error(error.message);
    }

    if (!data) return [];

    return data.map((row: any) => {
      // ✅ Comparación directa de Strings (Auth UIDs)
      const isP1Me = row.participant1_id === authUserId;
      const rawPartner = isP1Me ? row.participant2 : row.participant1;

      const partnerProfile: PartnerProfileSummary = {
        id: rawPartner?.auth_uid || "deleted", // Usamos auth_uid para consistencia
        name: rawPartner?.legal_name || "Usuario Desconocido",
        avatar: null,
        role: rawPartner?.role || "client",
      };

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
