import { auth } from "@/APIconfig/firebaseAPIConfig";

export type BackendSession = {
  ok: boolean;
  uid: string;
  email: string | null;
  phone: string | null;
  role: "client" | "professional" | null;
  profile_complete: boolean;
  legal_name: string | null;
  identityStatus?: string | null;
  type_work?: string | null;
};

export async function syncUserSession(): Promise<BackendSession | null> {
  console.log("\n🔌 [SessionService] Iniciando Sincronización de Puente...");

  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No hay usuario de Firebase activo.");

    // 1. Obtener Token Fresco (CRÍTICO)
    console.log("   🔑 [SessionService] Obteniendo Token JWT fresco...");
    const token = await user.getIdToken(true);

    const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL_FUNCTIONS;
    const url = `${baseUrl}/session-sync`;

    console.log(`   📡 [SessionService] Connecting to: session-sync`);

    // 2. Llamada al Puente
    const start = Date.now();
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // 👈 Aquí viaja el Token
      },
    });
    const duration = Date.now() - start;

    if (!res.ok) {
      const text = await res.text();
      console.error(`   ❌ [SessionService] Fallo HTTP (${res.status}):`, text);
      return null;
    }

    const data = await res.json();
    console.log(`   ✅ [SessionService] Respuesta recibida en ${duration}ms`);

    // LOGS DIDÁCTICOS DEL ESTADO
    console.log("   📄 [SessionService] Payload del Servidor:", {
      role: data.role || "SIN ROL",
      phone: data.phone ? "Verificado" : "Pendiente",
      db_uid: data.uid,
    });

    return data as BackendSession;
  } catch (err: any) {
    console.error("   💥 [SessionService] Error Fatal:", err.message);
    return null;
  }
}
