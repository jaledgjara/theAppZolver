// --- DTO (from database) ---
export interface ReviewDTO {
  id: string;
  reservation_id: string;
  client_id: string;
  professional_id: string;
  score: number;
  comment: string | null;
  created_at: string;
  client?: { legal_name: string };
}

// --- Domain Entity (clean for UI) ---
export interface Review {
  id: string;
  reservationId: string;
  clientId: string;
  professionalId: string;
  score: number;
  comment: string | null;
  createdAt: Date;
  clientName: string;
}

// --- Payload for creating a review ---
export interface CreateReviewPayload {
  reservation_id: string;
  client_id: string;
  professional_id: string;
  score: number;
  comment?: string;
}
