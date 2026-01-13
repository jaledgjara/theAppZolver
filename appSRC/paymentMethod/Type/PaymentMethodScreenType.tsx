type PaymentFormMode = "checkout" | "profile";

interface PaymentMethodListViewProps {
  mode: PaymentFormMode;
  onConfirmSelection?: (cardId: string) => void;
  price?: string;
}

interface PaymentFormProps {
  mode: PaymentFormMode;
  onSuccess?: () => void;
}
