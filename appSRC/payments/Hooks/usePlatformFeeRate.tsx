import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/appSRC/services/supabaseClient";

const DEFAULT_FEE_RATE = 0.10;

export const usePlatformFeeRate = (): number => {
  const { data } = useQuery({
    queryKey: ["platform_fee_rate"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "platform_fee_rate")
        .single();

      if (error || !data) return DEFAULT_FEE_RATE;
      return parseFloat(data.value) || DEFAULT_FEE_RATE;
    },
    staleTime: 1000 * 60 * 10, // Cache 10 min
  });

  return data ?? DEFAULT_FEE_RATE;
};
