/**
 * UTILITY: Genera el rango para una reserva INSTANTÁNEA.
 * CORRECCIÓN: Usamos la hora actual como inicio, no las 00:00.
 */
export const getTodayRangeString = (): string => {
  // 1. Inicio: HORA ACTUAL (Ej: 16:30)
  const start = new Date();
  // ⚠️ IMPORTANTE: No hacemos start.setHours(0,0,0,0) aquí.

  // 2. Fin: Final del día (Ej: 23:59)
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  // Formato estricto para Postgres: ["ISO","ISO")
  const range = `[${start.toISOString()},${end.toISOString()})`;

  console.log("📅 [DEBUG] Rango Instantáneo generado (Hora Real):", range);
  return range;
};
