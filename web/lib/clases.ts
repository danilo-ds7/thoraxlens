import type { Clase, ClaseId } from "./api";

// Datos base de las 3 clases. Se usan mientras /api/info no responde
// (por ejemplo, si el servidor está despertando). Cuando la API responde,
// sus nombres, descripciones y colores tienen prioridad.
export const CLASES_BASE: Clase[] = [
  {
    id: "benign",
    nombre: "Benigno",
    descripcion: "Nódulo o lesión pulmonar no cancerosa, como un granuloma o un hamartoma.",
    color: "#fbbf24",
  },
  {
    id: "malignant",
    nombre: "Maligno",
    descripcion: "Hallazgos que el modelo asocia con cáncer de pulmón.",
    color: "#fb7185",
  },
  {
    id: "normal",
    nombre: "Normal",
    descripcion: "Corte de tomografía sin lesiones de las categorías del conjunto de datos.",
    color: "#34d399",
  },
];

/** Contenido educativo propio para la pestaña "Aprende" (lenguaje simple). */
export interface ContenidoEducativo {
  enSimple: string;
  puntosClave: string[];
  enLaImagen: string;
}

export const CONTENIDO_EDUCATIVO: Record<ClaseId, ContenidoEducativo> = {
  benign: {
    enSimple:
      "No todo \"bulto\" en el pulmón es cáncer. Muchos nódulos son cicatrices de infecciones antiguas, pequeños tumores de crecimiento lento o acumulaciones de calcio.",
    puntosClave: [
      "La mayoría de los nódulos pulmonares que se encuentran por casualidad son benignos.",
      "Suelen controlarse con una nueva TC en meses para confirmar que no crecen.",
      "Que sea benigno lo confirma un equipo médico con seguimiento o biopsia, no una imagen aislada.",
    ],
    enLaImagen:
      "Nódulo pequeño, redondo, de bordes lisos y bien definidos; a veces con calcio (muy blanco) en el centro.",
  },
  malignant: {
    enSimple:
      "El cáncer de pulmón ocurre cuando células del pulmón crecen sin control y forman una masa. Es uno de los cánceres más frecuentes en Chile y en el mundo, y el tabaco es su principal causa.",
    puntosClave: [
      "Detectarlo temprano cambia mucho el pronóstico: por eso el triaje importa.",
      "El tipo y la etapa los define un estudio de tejido (biopsia) y otros exámenes, no una imagen.",
      "Es la clase donde un error del modelo es más costoso: un caso maligno clasificado como normal o benigno es un falso negativo.",
    ],
    enLaImagen:
      "Masa o nódulo de bordes irregulares o \"espiculados\" (como rayos), a veces grande, de densidad desigual, que puede tocar la pleura o el mediastino.",
  },
  normal: {
    enSimple:
      "Son cortes de tomografía en los que no se observa ninguna de las lesiones que el modelo aprendió a reconocer.",
    puntosClave: [
      "Que el modelo diga 'Normal' NO descarta enfermedad: solo conoce estas 3 categorías y mira un solo corte.",
      "Un pulmón puede verse normal en un corte y tener una lesión en el corte vecino.",
      "Siempre debe ser un profesional quien interprete un examen real completo.",
    ],
    enLaImagen: "Ambos pulmones oscuros (llenos de aire), con vasos finos y simétricos, sin manchas ni masas blancas.",
  },
};

/**
 * Combina las clases de la API con los datos base: así siempre tenemos
 * las 3 clases en un orden fijo, aunque la API aún no haya respondido.
 */
export function combinarClases(desdeApi?: Clase[]): Clase[] {
  if (!desdeApi?.length) return CLASES_BASE;
  return desdeApi.map((c) => ({ ...CLASES_BASE.find((b) => b.id === c.id), ...c }));
}
