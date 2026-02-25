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

// ============================================================================
// FETCH: First completed reservation without a review (for global alert)
// ============================================================================

export interface PendingReviewReservation {
  reservationId: string;
  clientId: string;
  professionalId: string;
  professionalName: string;
}

export const fetchPendingReview = async (
  clientId: string
): Promise<PendingReviewReservation | null> => {
  console.log("[REVIEW-SERVICE] fetchPendingReview for client:", clientId);

  // Find completed reservations that have no review yet
  const { data, error } = await supabase
    .from("reservations")
    .select("id, client_id, professional_id, professional:user_accounts!professional_id(legal_name)")
    .eq("client_id", clientId)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[REVIEW-SERVICE] Error fetching pending reviews:", error.message);
    return null;
  }

  if (!data || data.length === 0) {
    console.log("[REVIEW-SERVICE] No completed reservations found");
    return null;
  }

  // Check which ones already have a review
  const reservationIds = data.map((r: { id: string }) => r.id);
  const { data: existingReviews, error: reviewError } = await supabase
    .from("reviews")
    .select("reservation_id")
    .in("reservation_id", reservationIds);

  if (reviewError) {
    console.error("[REVIEW-SERVICE] Error checking existing reviews:", reviewError.message);
    return null;
  }

  const reviewedIds = new Set((existingReviews ?? []).map((r: { reservation_id: string }) => r.reservation_id));

  // Find first unreviewed reservation
  const pending = data.find((r: { id: string }) => !reviewedIds.has(r.id));
  if (!pending) {
    console.log("[REVIEW-SERVICE] All completed reservations already reviewed");
    return null;
  }

  const professional = pending.professional as { legal_name: string } | null;
  console.log("[REVIEW-SERVICE] Found pending review for reservation:", pending.id);

  return {
    reservationId: pending.id,
    clientId: pending.client_id,
    professionalId: pending.professional_id,
    professionalName: professional?.legal_name ?? "Profesional",
  };
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
