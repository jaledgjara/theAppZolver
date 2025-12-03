export interface ProfessionalResult {
  id: string;
  user_id: string;
  legal_name: string;
  specialization_title: string;
  biography: string | null;
  rating: number;
  reviews_count: number;
  photo_url: string | null;
  base_lat: number;
  base_lng: number;
  dist_meters: number | null;
  is_urgent: boolean;
  category_name: string;
}
