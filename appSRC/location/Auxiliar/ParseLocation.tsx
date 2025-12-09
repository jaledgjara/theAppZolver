const parsePoint = (pointStr: any): { lat: number; lng: number } => {
  // Postgres suele devolver puntos como objetos o strings dependiendo del driver.
  // En Supabase JS, si es columna 'point', a veces viene como string "(lng,lat)"
  if (typeof pointStr === "string") {
    const [x, y] = pointStr.replace(/[()]/g, "").split(",");
    return { lng: parseFloat(x), lat: parseFloat(y) };
  }
  // Si ya es objeto (en algunas versiones)
  return { lat: 0, lng: 0 };
};

export default parsePoint;
