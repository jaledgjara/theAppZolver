export type PaymentFormMode = "checkout" | "profile";

export interface PaymentMethodListViewProps {
  mode: PaymentFormMode;
  /** Called when user confirms card selection in checkout mode. */
  onConfirmSelection?: (cardId: string, cvv: string) => void;
  /** Service subtotal (numeric) for the CheckoutSummaryCard. */
  subtotal?: number;
  /** Estimated hours label for the summary. */
  hoursLabel?: string;
  /** Left-side label for the summary info row. Defaults to "Tiempo estimado". */
  infoLabel?: string;
  /** Right-side suffix for the summary info value. Defaults to " hs". */
  infoSuffix?: string;
  /** Loading state for the pay button. */
  paymentLoading?: boolean;
  /** Platform fee rate (0.10 = 10%) for the checkout summary card. */
  feeRate?: number;
  /** Override the "add new card" screen path (defaults by mode). */
  formScreenPath?: string;
}

export interface PaymentFormProps {
  mode: PaymentFormMode;
  onSuccess?: () => void;
}
