export type LearningPillar = "Técnica" | "Ritmo" | "Oído" | "Lectura" | "Aplicación";

export type ExerciseKind = "sequence" | "rhythm" | "ear" | "reading" | "voicing" | "improv" | "pedal";

export type CurriculumUnit = {
  id: string;
  level: number;
  pillar: LearningPillar;
  title: string;
  summary: string;
  objective: string;
  tempo: number;
  fingering?: string;
};

export type ExerciseDefinition = {
  id: string;
  unitId: string;
  kind: ExerciseKind;
  title: string;
  instructions: string;
  target: number[];
  tempo?: number;
};

export type AttemptResult = {
  id: string;
  unitId: string;
  date: string;
  pitchAccuracy: number;
  timingAccuracy: number;
  velocityAccuracy: number;
  pedalAccuracy: number;
  tempo: number;
  usedHelp: boolean;
  passed: boolean;
};

export type SkillMastery = {
  unitId: string;
  status: "nuevo" | "en_progreso" | "aprobado" | "dominado";
  passes: number;
  attempts: number;
  bestAccuracy: number;
  bestTempo: number;
  lastPracticed: string;
  passedDates: string[];
  nextReview: string;
};

export type PracticeProfile = {
  diagnosticComplete: boolean;
  currentLevel: number;
  sessionMinutes: 10 | 20 | 30;
  velocityCalibration: { soft: number; medium: number; loud: number } | null;
};

export type DailySession = {
  date: string;
  minutes: 10 | 20 | 30;
  unitIds: string[];
  completedUnitIds: string[];
  completed: boolean;
};

export const PILLARS: Array<{ name: LearningPillar; symbol: string; description: string }> = [
  { name: "Técnica", symbol: "T", description: "Escalas, arpegios, digitación y control." },
  { name: "Ritmo", symbol: "R", description: "Pulso, metrónomo, síncopa y comping." },
  { name: "Oído", symbol: "O", description: "Escuchar, reconocer y reproducir." },
  { name: "Lectura", symbol: "L", description: "Pentagrama, cifrado y lead sheets." },
  { name: "Aplicación", symbol: "A", description: "Acompañar, conectar e improvisar." },
];

export const LEVELS = [
  { level: 1, name: "Fundamentos", caption: "Mapa del teclado, pulso, pentacordios y tríadas." },
  { level: 2, name: "Acompañamiento", caption: "Escalas, inversiones, pedal y patrones pop." },
  { level: 3, name: "Fluidez", caption: "Arpegios, séptimas, síncopas y dos manos." },
  { level: 4, name: "Color", caption: "Extensiones, ii–V–I, modos y lead sheets." },
  { level: 5, name: "Lenguaje", caption: "Voicings avanzados, intercambio modal y comping." },
] as const;

export const CURRICULUM: CurriculumUnit[] = [
  { id: "n1-tecnica", level: 1, pillar: "Técnica", title: "Cinco dedos, una posición", summary: "Ubica Do central y toca un pentacordio relajado.", objective: "Do–Re–Mi–Fa–Sol y regreso sin perder continuidad.", tempo: 60, fingering: "MD 1–2–3–4–5 · regreso 5–4–3–2–1" },
  { id: "n1-ritmo", level: 1, pillar: "Ritmo", title: "Pulso estable", summary: "Cuatro ataques iguales después de una cuenta previa.", objective: "Mantener negras estables sobre un acorde de Do.", tempo: 60 },
  { id: "n1-oido", level: 1, pillar: "Oído", title: "Mayor o menor", summary: "Escucha el color y reprodúcelo en el teclado.", objective: "Distinguir y tocar una tríada mayor o menor.", tempo: 60 },
  { id: "n1-lectura", level: 1, pillar: "Lectura", title: "Do, Re, Mi, Sol", summary: "Relaciona cuatro notas del pentagrama con el teclado.", objective: "Leer una frase corta en clave de Sol.", tempo: 56 },
  { id: "n1-aplicacion", level: 1, pillar: "Aplicación", title: "Los tres pilares", summary: "Tónica, subdominante y dominante en una vuelta.", objective: "Completar I–IV–V–I con tríadas.", tempo: 62 },

  { id: "n2-tecnica", level: 2, pillar: "Técnica", title: "Escala mayor de una octava", summary: "Cruza el pulgar y conserva el mismo sonido.", objective: "Escala mayor ascendente y descendente.", tempo: 72, fingering: "Do mayor MD 1–2–3–1–2–3–4–5" },
  { id: "n2-ritmo", level: 2, pillar: "Ritmo", title: "Dos acordes por compás", summary: "Alterna blancas sin correr el segundo ataque.", objective: "Acompañamiento pop en blancas.", tempo: 72 },
  { id: "n2-oido", level: 2, pillar: "Oído", title: "Raíz e inversión", summary: "Encuentra el bajo y reconoce el mismo acorde reordenado.", objective: "Reproducir una tríada en cualquier inversión.", tempo: 66 },
  { id: "n2-lectura", level: 2, pillar: "Lectura", title: "Cifrado americano", summary: "Convierte C, Am, F y G en posiciones reales.", objective: "Leer símbolos y responder sin notas escritas.", tempo: 68 },
  { id: "n2-aplicacion", level: 2, pillar: "Aplicación", title: "Pop universal", summary: "Una vuelta completa con conducción cercana.", objective: "I–V–vi–IV evitando saltos innecesarios.", tempo: 74 },

  { id: "n3-tecnica", level: 3, pillar: "Técnica", title: "Arpegios y séptimas", summary: "Abre la mano sin fijar tensión.", objective: "Tónica, tercera, quinta y séptima en secuencia.", tempo: 82, fingering: "MD 1–2–3–5 · mano flexible" },
  { id: "n3-ritmo", level: 3, pillar: "Ritmo", title: "Anticipación pop", summary: "Ataca antes del tiempo fuerte y conserva el pulso.", objective: "Patrón de negras con anticipación final.", tempo: 84 },
  { id: "n3-oido", level: 3, pillar: "Oído", title: "Séptimas con función", summary: "Diferencia maj7, m7 y dominante.", objective: "Escuchar el color y construirlo desde la raíz.", tempo: 72 },
  { id: "n3-lectura", level: 3, pillar: "Lectura", title: "Lead sheet a dos manos", summary: "Melodía simple arriba, fundamentales abajo.", objective: "Leer cifrado y notas sin detener el pulso.", tempo: 72 },
  { id: "n3-aplicacion", level: 3, pillar: "Aplicación", title: "Conducción de voces", summary: "Conecta cuatro acordes moviendo cada voz lo mínimo.", objective: "Imaj7–vi7–ii7–V7 con voicings cercanos.", tempo: 78 },

  { id: "n4-tecnica", level: 4, pillar: "Técnica", title: "Voicings de cuatro notas", summary: "Distribuye guía y color dentro de 49 teclas.", objective: "Tercera, séptima y extensiones con registro controlado.", tempo: 88 },
  { id: "n4-ritmo", level: 4, pillar: "Ritmo", title: "Comping sincopado", summary: "Deja espacio y responde a contratiempos.", objective: "Dos compases con ataques fuera del pulso.", tempo: 92 },
  { id: "n4-oido", level: 4, pillar: "Oído", title: "ii–V–I de oído", summary: "Reconoce preparación, tensión y resolución.", objective: "Reproducir la función en otra tonalidad.", tempo: 78 },
  { id: "n4-lectura", level: 4, pillar: "Lectura", title: "Melodía y extensiones", summary: "Lee una nota superior y elige un voicing compatible.", objective: "Conservar la melodía como voz más aguda.", tempo: 76 },
  { id: "n4-aplicacion", level: 4, pillar: "Aplicación", title: "Improvisar con objetivo", summary: "Usa notas del acorde en tiempos fuertes.", objective: "Crear una frase de cuatro compases sobre ii–V–I.", tempo: 82 },

  { id: "n5-tecnica", level: 5, pillar: "Técnica", title: "Drop-2 y voicings sin raíz", summary: "Construye texturas amplias sin perder las notas guía.", objective: "Mover tercera y séptima por semitono o tono.", tempo: 96 },
  { id: "n5-ritmo", level: 5, pillar: "Ritmo", title: "Desplazamiento y estilo", summary: "Cambia el lugar del ataque sin perder la forma.", objective: "Adaptar una vuelta a soul, bossa y gospel.", tempo: 100 },
  { id: "n5-oido", level: 5, pillar: "Oído", title: "Tensión alterada", summary: "Distingue novenas y dominantes alterados.", objective: "Resolver la tensión hacia su acorde objetivo.", tempo: 82 },
  { id: "n5-lectura", level: 5, pillar: "Lectura", title: "Lead sheet abierto", summary: "Interpreta cifrado, barras y ritmo con libertad controlada.", objective: "Crear una realización completa sin notas duplicadas de más.", tempo: 88 },
  { id: "n5-aplicacion", level: 5, pillar: "Aplicación", title: "Rearmonizar y modular", summary: "Combina dominantes secundarias e intercambio modal.", objective: "Transformar una vuelta manteniendo su dirección.", tempo: 90 },
];

export const EMPTY_PROFILE: PracticeProfile = {
  diagnosticComplete: false,
  currentLevel: 1,
  sessionMinutes: 20,
  velocityCalibration: null,
};

export function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function unitsForLevel(level: number) {
  return CURRICULUM.filter((unit) => unit.level === level);
}
