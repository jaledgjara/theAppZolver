import { supabase } from "@/appSRC/services/supabaseClient";
import {
  CreateReviewPayload,
  Review,
  ReviewDTO,
} from "../Type/ReviewType";

// ============================================================================
// MAPPER: DTO → Domain Entity
// ============================================================================

const mapReviewFromDTO = (dto: ReviewDTO): Review => ({
  id: dto.id,
  reservationId: dto.reservation_id,
  clientId: dto.client_id,
  professionalId: dto.professional_id,
  score: dto.score,
  comment: dto.comment,
  createdAt: new Date(dto.created_at),
  clientName: dto.client?.legal_name ?? "Usuario",
});

// ============================================================================
// CREATE
// ============================================================================

export const createReviewService = async (
  payload: CreateReviewPayload
): Promise<Review> => {
  console.log("[REVIEW-SERVICE] createReviewService called with payload:", JSON.stringify(payload));

  const { data, error } = await supabase
    .from("reviews")
    .insert(payload)
    .select("*, client:user_accounts!client_id(legal_name)")
    .single();

  if (error) {
    console.error("[REVIEW-SERVICE] Error creating review:", error.message, error.details, error.hint);
    throw new Error(`Error al crear reseña: ${error.message}`);
  }

  console.log("[REVIEW-SERVICE] Review created successfully, raw data:", JSON.stringify(data));
  return mapReviewFromDTO(data as ReviewDTO);
};

// ============================================================================
// FETCH: Single review by reservation (to check if already reviewed)
// ============================================================================

export const fetchReviewByReservation = async (
  reservationId: string
): Promise<Review | null> => {
  console.log("[REVIEW-SERVICE] fetchReviewByReservation for:", reservationId);

  const { data, error } = await supabase
    .from("reviews")
    .select("*, client:user_accounts!client_id(legal_name)")
    .eq("reservation_id", reservationId)
    .maybeSingle();

  if (error) {
    console.error("[REVIEW-SERVICE] Error fetching review:", error.message, error.details, error.hint);
    throw new Error(`Error al buscar reseña: ${error.message}`);
  }

  console.log("[REVIEW-SERVICE] fetchReviewByReservation result:", data ? "Found review" : "No review found");
  if (!data) return null;
  return mapReviewFromDTO(data as ReviewDTO);
};

// ============================================================================
// FETCH: All reviews for a professional
// ============================================================================

export const fetchReviewsByProfessional = async (
  professionalId: string
): Promise<Review[]> => {
  console.log("[REVIEW-SERVICE] fetchReviewsByProfessional for:", professionalId);

  const { data, error } = await supabase
    .from("reviews")
    .select("*, client:user_accounts!client_id(legal_name)")
    .eq("professional_id", professionalId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[REVIEW-SERVICE] Error fetching reviews:", error.message, error.details, error.hint);
    throw new Error(`Error al cargar reseñas: ${error.message}`);
  }

  console.log("[REVIEW-SERVICE] fetchReviewsByProfessional found:", (data as ReviewDTO[]).length, "reviews");
  return (data as ReviewDTO[]).map(mapReviewFromDTO);
};
