/**
 * 🕒 TIME ENGINE
 * Única fuente de verdad para manejo de fechas en la App.
 * FIX V2: Compatibilidad total Hermes (Espacios y Timezone).
 */

// Genera un timestamp ISO actual
export const getNowISO = (): string => {
  return new Date().toISOString();
};

// Genera el rango para PostgreSQL
export const generateReservationRange = (
  modality: "instant" | "quote",
  scheduledStart?: Date
): string => {
  let start: Date;
  let end: Date;

  if (modality === "instant") {
    start = new Date();
    end = new Date();
    end.setHours(23, 59, 59, 999);
  } else {
    start = scheduledStart || new Date();
    end = new Date(start);
    end.setHours(end.getHours() + 2);
  }

  return `[${start.toISOString()},${end.toISOString()})`;
};

// Parsea el rango que viene de PostgreSQL
export const parsePostgresRange = (rangeStr: string) => {
  if (!rangeStr) return { start: null, end: null };

  try {
    const clean = rangeStr.replace(/[\[\]()"]/g, "");
    const [startStr, endStr] = clean.split(",");

    // 🛡️ FUNCIÓN DE SANITIZACIÓN ROBUSTA
    const safeParse = (dateString: string | undefined) => {
      if (!dateString) return null;

      // 1. Reemplazar espacio por T
      let iso = dateString.trim().replace(" ", "T");

      // 2. FIX DE TIMEZONE (+00 -> Z)
      // Hermes falla con "+00", prefiere "Z" para UTC.
      if (iso.endsWith("+00")) {
        iso = iso.replace("+00", "Z");
      }

      const date = new Date(iso);

      // Si falla, retornamos null
      if (isNaN(date.getTime())) {
        return null;
      }

      return date;
    };

    return {
      start: safeParse(startStr),
      end: safeParse(endStr),
    };
  } catch (e) {
    return { start: null, end: null };
  }
};

// Formatea para la UI
export const formatForUI = (dateInput: Date | string | null) => {
  if (!dateInput) return { date: "--", time: "--:--" };

  const dateObj =
    typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  if (isNaN(dateObj.getTime())) {
    return { date: "--", time: "--:--" };
  }

  const date = dateObj.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });

  const time = dateObj.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return { date, time };
};
