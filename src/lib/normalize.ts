/**
 * Normaliza un nombre para compararlo con tolerancia a tildes, mayúsculas
 * y espacios: "Junín" ≈ "JUNIN", "san  martin" ≈ "SAN MARTIN".
 */
export function normalizeName(s: string): string {
  return (
    s
      .normalize("NFD")
      // elimina las marcas diacríticas combinantes (tildes, diéresis)
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim()
  );
}
