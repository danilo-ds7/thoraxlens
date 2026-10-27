import type { ClaseId } from "./api";

// Pistas visuales estáticas (sin LLM) para el desafío: qué mirar en un corte de
// tomografía de tórax para reconocer cada clase. Lenguaje simple y educativo.

export interface Rasgos {
  /** rasgo más característico, en una línea */
  clave: string;
  /** lista corta de qué buscar en la imagen */
  buscar: string[];
}

export const RASGOS: Record<ClaseId, Rasgos> = {
  normal: {
    clave: "Pulmones oscuros y simétricos, sin manchas ni masas blancas.",
    buscar: [
      "Ambos pulmones se ven oscuros (aire) y de tamaño parecido.",
      "Solo se ven vasos finos y ramificados, como las ramas de un árbol.",
      "No hay ninguna mancha blanca redondeada dentro del pulmón.",
    ],
  },
  benign: {
    clave: "Un nódulo pequeño, redondo y de bordes lisos.",
    buscar: [
      "Mancha blanca pequeña (en general menor a una moneda) y aislada.",
      "Bordes lisos y bien definidos: se distingue claramente del pulmón.",
      "Forma redonda u ovalada, densidad uniforme.",
      "A veces un punto muy blanco en el centro (calcio).",
    ],
  },
  malignant: {
    clave: "Una masa de bordes irregulares o espiculados, a menudo grande.",
    buscar: [
      "Mancha blanca grande o de forma irregular, no redonda.",
      "Bordes \"espiculados\": con rayos o puntas que salen hacia el pulmón.",
      "Densidad desigual: zonas más claras y más oscuras dentro de la misma masa.",
      "Puede tocar o deformar la pleura (borde del pulmón) o el mediastino (centro del tórax).",
    ],
  },
};

// Consejos para distinguir cada par de clases (el orden del par no importa)
const DIFERENCIAS: Record<string, string> = {
  "benign|malignant":
    "Mira los bordes: lisos y redondos sugieren benigno; irregulares, espiculados o una masa grande y heterogénea sugieren maligno.",
  "benign|normal":
    "Recorre ambos pulmones buscando una mancha blanca pequeña y redonda que no sea un vaso: si la hay, probablemente es un nódulo benigno; si todo es oscuro y simétrico, es normal.",
  "malignant|normal":
    "Busca una masa blanca con bordes irregulares o que deforme el pulmón: eso sugiere maligno. Un pulmón normal no tiene manchas, solo vasos finos.",
};

/** Consejo breve para distinguir dos clases (o null si son la misma). */
export function diferencia(a: ClaseId, b: ClaseId): string | null {
  if (a === b) return null;
  const clave = [a, b].sort().join("|");
  return DIFERENCIAS[clave] ?? null;
}
