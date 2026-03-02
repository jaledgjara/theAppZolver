import { supabase } from "@/appSRC/services/supabaseClient";
import { auth } from "@/APIconfig/firebaseAPIConfig";
import type { OnboardingState } from "../Type/ProfessionalAuthUser";

// Helper robusto usando FormData (Estándar en React Native)
const uploadFile = async (uri: string | null, path: string) => {
  if (!uri) {
    console.log(`⚠️ [Upload] No URI provided for ${path}, skipping.`);
    return null;
  }

  try {
    console.log(`Cx [Upload] Iniciando subida para: ${path}`);
    const formData = new FormData();
    formData.append("file", {
      uri,
      name: path.split("/").pop() || "image.jpg",
      type: "image/jpeg",
    } as any);

    const { data, error } = await supabase.storage
      .from("professional_docs")
      .upload(path, formData, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) {
      console.error(`❌ [Upload] Falló Supabase para ${path}:`, error.message);
      throw error;
    }

    const { data: UrlData } = supabase.storage
      .from("professional_docs")
      .getPublicUrl(path);

    console.log(`✅ [Upload] Éxito: ${UrlData.publicUrl}`);
    return UrlData.publicUrl;
  } catch (error: any) {
    console.error(`💥 [Upload] Excepción en ${path}:`, error.message || error);
    return null;
  }
};

export const ProfessionalProfileService = {
  saveFullProfile: async (userId: string, profileData: OnboardingState) => {
    console.log("==========================================");
    console.log("🚀 [Service] INICIANDO SAVE FULL PROFILE");
    console.log("👤 User ID:", userId);

    // 1. Obtener Token de Firebase para la Edge Function
    const token = await auth.currentUser?.getIdToken(true);
    if (!token) throw new Error("No Firebase Token available");
    console.log(
      "🔑 Token obtenido (first 10):",
      token.substring(0, 10) + "..."
    );

    // 2. Subir Documentos (Esto puede seguir siendo cliente-lado si las políticas de Storage lo permiten,
    // o puedes moverlo. Asumimos que Storage funciona por ahora si es público o tiene policy Auth).
    console.log("📤 [Service] Subiendo documentos de identidad...");
    const [frontUrl, backUrl] = await Promise.all([
      uploadFile(profileData.dniFrontUri, `${userId}/identity/dni_front.jpg`),
      uploadFile(profileData.dniBackUri, `${userId}/identity/dni_back.jpg`),
    ]);

    if (profileData.dniFrontUri && !frontUrl) {
      throw new Error("Falló la subida del frente del documento de identidad.");
    }
    if (profileData.dniBackUri && !backUrl) {
      throw new Error("Falló la subida del dorso del documento de identidad.");
    }

    // 3. Subir Portafolio
    console.log("📤 [Service] Subiendo portafolio...");
    const portfolioUploads = (profileData.portfolioUris || []).map(
      (uri: string, index: number) =>
        uploadFile(uri, `${userId}/portfolio/img_${index}.jpg`)
    );
    const portfolioUrls = (await Promise.all(portfolioUploads)).filter(
      (url) => url !== null
    );

    console.log(
      "✅ [Service] Archivos subidos. Preparando llamada a Edge Function..."
    );

    // 4. Llamar a la Edge Function
    const functionsBase =
      process.env.EXPO_PUBLIC_SUPABASE_URL_FUNCTIONS ||
      process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(
        ".co",
        ".co/functions/v1"
      ) ||
      "";

    const url = `${functionsBase}/save-profile`;

    const payload = {
      profileData,
      portfolioUrls,
      docFrontUrl: frontUrl,
      docBackUrl: backUrl,
    };

    console.log("📡 [Service] POST a:", url);
    console.log("📦 [Service] Payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // 🔥 TOKEN DE FIREBASE
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log("📥 [Service] Respuesta Raw:", responseText);

    if (!response.ok) {
      throw new Error(`Edge Function Failed: ${responseText}`);
    }

    const json = JSON.parse(responseText);
    console.log("🎉 [Service] ¡Perfil guardado con éxito!", json);
    return { success: true };
  },
};
