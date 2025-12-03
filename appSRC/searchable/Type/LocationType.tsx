export type ServiceResult = {
  id: string;
  name: string;
  description: string;
  price: number;
  rating: number;
  professional_id: string;
  avatar_url: string | null;
  distance_meters: number | null;
  similarity_score: number;
};
