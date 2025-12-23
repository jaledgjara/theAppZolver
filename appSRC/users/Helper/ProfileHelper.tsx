export const getInitials = (name: string | null | undefined): string => {
  if (!name) return "Z"; // Fallback

  const cleanName = name.trim();
  const parts = cleanName.split(" ");

  if (parts.length === 1) {
    // Si es "Manolito" -> "MA"
    return cleanName.substring(0, 2).toUpperCase();
  }

  // Si es "Manolito Javier Perez" -> "MP" (Primer y último nombre)
  const first = parts[0][0];
  const last = parts[parts.length - 1][0];
  return (first + last).toUpperCase();
};

// 2. Cálculo de Disponibilidad de Cambio de Nombre (Nueva Lógica)
export const getNameUpdateStatus = (lastUpdateDate: string | null) => {
  // Si nunca ha cambiado el nombre, está habilitado
  if (!lastUpdateDate) {
    return { canUpdate: true, hoursRemaining: 0 };
  }

  const lastUpdate = new Date(lastUpdateDate).getTime();
  const now = new Date().getTime();
  const diffInMs = now - lastUpdate;
  const hoursDiff = diffInMs / (1000 * 60 * 60);
  const HOURS_LIMIT = 24;

  if (hoursDiff >= HOURS_LIMIT) {
    return { canUpdate: true, hoursRemaining: 0 };
  }

  // Calculamos cuánto falta para cumplir las 24hs
  const hoursRemaining = Math.ceil(HOURS_LIMIT - hoursDiff);

  return {
    canUpdate: false,
    hoursRemaining,
  };
};
