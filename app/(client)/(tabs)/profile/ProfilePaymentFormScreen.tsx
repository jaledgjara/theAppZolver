// Importamos el componente reutilizable de la capa de SRC
import PaymentFormScreen from "@/appSRC/paymentMethod/Screens/PaymentFormScreen";
import { useRouter } from "expo-router";

export default function ProfilePaymentFormScreen() {
  const router = useRouter();

  return <PaymentFormScreen mode="profile" onSuccess={() => router.back()} />;
}
