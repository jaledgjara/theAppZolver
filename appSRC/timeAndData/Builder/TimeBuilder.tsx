/**
 * 🕒 TIME ENGINE
 * Única fuente de verdad para manejo de fechas en la App.
 */

// Genera un timestamp ISO actual con Log
export const getNowISO = (): string => {
  const now = new Date();
  const iso = now.toISOString();
  console.log(`🕒 [TIME-ENGINE] getNowISO generated: ${iso}`);
  return iso;
};

// Genera el rango para PostgreSQL
export const generateReservationRange = (
  modality: "instant" | "quote",
  scheduledStart?: Date
): string => {
  console.log(`🕒 [TIME-ENGINE] Generando Rango. Modalidad: ${modality}`);

  let start: Date;
  let end: Date;

  if (modality === "instant") {
    // CORRECCIÓN CRÍTICA: Instantánea empieza AHORA, no a las 00:00
    start = new Date();

    // Termina al final del día
    end = new Date();
    end.setHours(23, 59, 59, 999);
  } else {
    // Agendada: Empieza a la hora elegida, dura 2 horas por defecto
    start = scheduledStart || new Date();
    end = new Date(start);
    end.setHours(end.getHours() + 2);
  }

  const rangeStr = `[${start.toISOString()},${end.toISOString()})`;
  console.log(`🕒 [TIME-ENGINE] Rango Final DB: ${rangeStr}`);
  return rangeStr;
};

// Parsea el rango que viene de PostgreSQL '["2024...","2024...")'
export const parsePostgresRange = (rangeStr: string) => {
  if (!rangeStr) return { start: null, end: null };

  try {
    const clean = rangeStr.replace(/[\[\]()"]/g, "");
    const [startStr, endStr] = clean.split(",");

    const start = startStr ? new Date(startStr) : null;
    const end = endStr ? new Date(endStr) : null;

    return { start, end };
  } catch (e) {
    console.error("❌ [TIME-ENGINE] Error parseando rango:", rangeStr);
    return { start: null, end: null };
  }
};

// Formatea para la UI (Tarjeta)
export const formatForUI = (dateInput: Date | string | null) => {
  if (!dateInput) return { date: "--", time: "--:--" };

  const dateObj =
    typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  // Validar fecha inválida
  if (isNaN(dateObj.getTime())) {
    console.error("❌ [TIME-ENGINE] Fecha inválida recibida:", dateInput);
    return { date: "Error", time: "--:--" };
  }

  const date = dateObj.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
  const time = dateObj.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }); // AM/PM explicit

  return { date, time };
};
