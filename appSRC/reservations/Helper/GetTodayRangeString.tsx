/**
 * UTILITY: Genera el string de rango para "El día de hoy".
 * AHORA CON LOGS para verificar Timezones.
 */
export const getTodayRangeString = (): string => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const range = `[${start.toISOString()},${end.toISOString()})`;
  console.log("📅 [DEBUG] Rango de 'Hoy' generado (UTC):", range);
  return range;
};
