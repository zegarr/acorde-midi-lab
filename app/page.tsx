"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MusicStaff from "./MusicStaff";
import {
  addDays,
  CURRICULUM,
  EMPTY_PROFILE,
  LEVELS,
  PILLARS,
  unitsForLevel,
  type AttemptResult,
  type CurriculumUnit,
  type DailySession,
  type LearningPillar,
  type PracticeProfile,
  type SkillMastery,
} from "./learning";

type ChordCategory = "Base" | "Séptimas" | "Extendidos" | "Color";

type ChordDefinition = {
  id: string;
  suffix: string;
  name: string;
  short: string;
  intervals: number[];
  formula: string[];
  category: ChordCategory;
  explanation: string;
};

type MidiInputLike = {
  id: string;
  name?: string | null;
  manufacturer?: string | null;
  onmidimessage: ((event: { data: Uint8Array }) => void) | null;
};

type MidiAccessLike = {
  inputs: Map<string, MidiInputLike>;
  onstatechange: (() => void) | null;
};

const CHORDS: ChordDefinition[] = [
  { id: "major", suffix: "", name: "Mayor", short: "Maj", intervals: [0, 4, 7], formula: ["1", "3", "5"], category: "Base", explanation: "Dos terceras apiladas: una mayor y una menor. Suena estable, abierto y luminoso." },
  { id: "minor", suffix: "m", name: "Menor", short: "min", intervals: [0, 3, 7], formula: ["1", "♭3", "5"], category: "Base", explanation: "Baja la tercera del acorde mayor un semitono. Ese pequeño cambio transforma por completo su color." },
  { id: "diminished", suffix: "dim", name: "Disminuido", short: "dim", intervals: [0, 3, 6], formula: ["1", "♭3", "♭5"], category: "Base", explanation: "Dos terceras menores apiladas. Es simétrico, tenso y suele pedir una resolución." },
  { id: "augmented", suffix: "+", name: "Aumentado", short: "aug", intervals: [0, 4, 8], formula: ["1", "3", "♯5"], category: "Base", explanation: "Dos terceras mayores apiladas. Su quinta aumentada crea una sensación suspendida e inestable." },
  { id: "sus2", suffix: "sus2", name: "Suspendido 2", short: "sus2", intervals: [0, 2, 7], formula: ["1", "2", "5"], category: "Color", explanation: "Reemplaza la tercera por la segunda. Al no ser mayor ni menor, queda abierto y ambiguo." },
  { id: "sus4", suffix: "sus4", name: "Suspendido 4", short: "sus4", intervals: [0, 5, 7], formula: ["1", "4", "5"], category: "Color", explanation: "Reemplaza la tercera por la cuarta. La cuarta suele querer bajar hacia la tercera." },
  { id: "power", suffix: "5", name: "Quinta / power chord", short: "5", intervals: [0, 7], formula: ["1", "5"], category: "Color", explanation: "Solo raíz y quinta. No define modo mayor o menor y funciona muy bien con sonidos densos." },
  { id: "sixth", suffix: "6", name: "Sexta mayor", short: "6", intervals: [0, 4, 7, 9], formula: ["1", "3", "5", "6"], category: "Color", explanation: "Una tríada mayor con sexta añadida. Suena cálido, clásico y menos conclusivo que una séptima mayor." },
  { id: "minor-sixth", suffix: "m6", name: "Menor sexta", short: "m6", intervals: [0, 3, 7, 9], formula: ["1", "♭3", "5", "6"], category: "Color", explanation: "La sexta natural agrega luz a la tríada menor y produce un color muy usado en jazz y bossa." },
  { id: "add9", suffix: "add9", name: "Mayor add9", short: "add9", intervals: [0, 4, 7, 14], formula: ["1", "3", "5", "9"], category: "Color", explanation: "Añade la novena sin incluir la séptima. Es espacioso y conserva la claridad de la tríada." },
  { id: "major7", suffix: "maj7", name: "Séptima mayor", short: "maj7", intervals: [0, 4, 7, 11], formula: ["1", "3", "5", "7"], category: "Séptimas", explanation: "Tríada mayor más séptima mayor. Su semitono con la raíz crea un color sofisticado y sereno." },
  { id: "dominant7", suffix: "7", name: "Séptima dominante", short: "7", intervals: [0, 4, 7, 10], formula: ["1", "3", "5", "♭7"], category: "Séptimas", explanation: "La tercera mayor y la séptima menor forman un tritono: tensión con una fuerte dirección de resolución." },
  { id: "minor7", suffix: "m7", name: "Séptima menor", short: "m7", intervals: [0, 3, 7, 10], formula: ["1", "♭3", "5", "♭7"], category: "Séptimas", explanation: "Tríada menor más séptima menor. Es suave, estable y fundamental en jazz, soul y pop." },
  { id: "minor-major7", suffix: "m(maj7)", name: "Menor con séptima mayor", short: "mMaj7", intervals: [0, 3, 7, 11], formula: ["1", "♭3", "5", "7"], category: "Séptimas", explanation: "Combina una tríada menor con séptima mayor. Su cercanía con la raíz le da un color dramático." },
  { id: "half-diminished", suffix: "m7♭5", name: "Semidisminuido", short: "m7♭5", intervals: [0, 3, 6, 10], formula: ["1", "♭3", "♭5", "♭7"], category: "Séptimas", explanation: "Tríada disminuida con séptima menor. Aparece naturalmente en el séptimo grado de la escala mayor." },
  { id: "diminished7", suffix: "dim7", name: "Séptima disminuida", short: "dim7", intervals: [0, 3, 6, 9], formula: ["1", "♭3", "♭5", "𝄫7"], category: "Séptimas", explanation: "Cuatro notas separadas por terceras menores. Su simetría permite múltiples lecturas y resoluciones." },
  { id: "major9", suffix: "maj9", name: "Novena mayor", short: "maj9", intervals: [0, 4, 7, 11, 14], formula: ["1", "3", "5", "7", "9"], category: "Extendidos", explanation: "Extiende el maj7 con una novena. Mantiene la calma del acorde y añade espacio en el registro alto." },
  { id: "dominant9", suffix: "9", name: "Novena dominante", short: "9", intervals: [0, 4, 7, 10, 14], formula: ["1", "3", "5", "♭7", "9"], category: "Extendidos", explanation: "Un dominante 7 con novena natural. Conserva la tensión funcional, pero con un color más amplio." },
  { id: "minor9", suffix: "m9", name: "Novena menor", short: "m9", intervals: [0, 3, 7, 10, 14], formula: ["1", "♭3", "5", "♭7", "9"], category: "Extendidos", explanation: "Extiende el m7 con una novena natural. Es profundo, redondo y muy reconocible en neo-soul." },
  { id: "dominant-flat9", suffix: "7♭9", name: "Dominante bemol nueve", short: "7♭9", intervals: [0, 4, 7, 10, 13], formula: ["1", "3", "5", "♭7", "♭9"], category: "Extendidos", explanation: "La novena bemol intensifica la tensión del dominante y señala con claridad el acorde de llegada." },
  { id: "eleventh", suffix: "11", name: "Oncena dominante", short: "11", intervals: [0, 4, 7, 10, 14, 17], formula: ["1", "3", "5", "♭7", "9", "11"], category: "Extendidos", explanation: "Lleva la pila de terceras hasta la oncena. En la práctica suele omitirse la tercera o la quinta para respirar." },
  { id: "minor11", suffix: "m11", name: "Menor oncena", short: "m11", intervals: [0, 3, 7, 10, 14, 17], formula: ["1", "♭3", "5", "♭7", "9", "11"], category: "Extendidos", explanation: "Una extensión amplia del m7. La oncena encaja naturalmente con la tercera menor y crea un sonido modal." },
  { id: "thirteenth", suffix: "13", name: "Trecena dominante", short: "13", intervals: [0, 4, 7, 10, 14, 21], formula: ["1", "3", "5", "♭7", "9", "13"], category: "Extendidos", explanation: "El dominante llega hasta la trecena. En voicings reales se omiten notas para conservar raíz, tercera, séptima y color." },
];

const ROOTS = [
  { name: "C", pc: 0 }, { name: "D♭", pc: 1 }, { name: "D", pc: 2 }, { name: "E♭", pc: 3 },
  { name: "E", pc: 4 }, { name: "F", pc: 5 }, { name: "F♯", pc: 6 }, { name: "G", pc: 7 },
  { name: "A♭", pc: 8 }, { name: "A", pc: 9 }, { name: "B♭", pc: 10 }, { name: "B", pc: 11 },
];

const NOTE_NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
const SOLFEGE: Record<string, string> = { C: "Do", D: "Re", E: "Mi", F: "Fa", G: "Sol", A: "La", B: "Si" };
const NATURAL_PCS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];
const MAJOR_QUALITIES = ["major", "minor", "minor", "major", "major", "minor", "diminished"];
const MINOR_QUALITIES = ["minor", "diminished", "major", "minor", "minor", "major", "major"];
const MAJOR_DEGREES = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
const MINOR_DEGREES = ["i", "ii°", "III", "iv", "v", "VI", "VII"];
const CATEGORY_FILTERS = ["Todos", "Base", "Séptimas", "Extendidos", "Color"] as const;
const THEORY_LESSONS = [
  { n: "01", title: "Intervalos", kicker: "La unidad mínima", summary: "Mide la distancia entre dos notas." },
  { n: "02", title: "Tríadas", kicker: "El esqueleto", summary: "Construye mayor, menor, disminuido y aumentado." },
  { n: "03", title: "Séptimas", kicker: "Dirección y color", summary: "Añade una tercera más a la pila." },
  { n: "04", title: "Extensiones", kicker: "Más allá de la octava", summary: "9, 11 y 13 son grados compuestos." },
  { n: "05", title: "Inversiones", kicker: "Mismas notas, otro bajo", summary: "Conecta acordes con menos movimiento." },
  { n: "06", title: "En cualquier escala", kicker: "El método transferible", summary: "Aplica fórmulas, no memorices dibujos." },
];

type Difficulty = "Inicial" | "Intermedio" | "Avanzado";
type SoundVariant = "piano" | "electrico" | "organo";

type ProgressionStep = {
  numeral: string;
  degree: number;
  offset: number;
  chordId: string;
  function: string;
};

type ProgressionDefinition = {
  id: string;
  name: string;
  style: string;
  mode: "mayor" | "menor";
  difficulty: Difficulty;
  description: string;
  steps: ProgressionStep[];
};

type PracticeDay = {
  rounds: number;
  chords: number;
  progressions: Record<string, number>;
};

type PracticeHistory = {
  totalRounds: number;
  totalChords: number;
  learned: Record<string, { hits: number; lastPracticed: string }>;
  days: Record<string, PracticeDay>;
};

const PROGRESSIONS: ProgressionDefinition[] = [
  { id: "pilares", name: "Los tres pilares", style: "Folk · rock · blues", mode: "mayor", difficulty: "Inicial", description: "Tónica, subdominante y dominante: la gramática armónica más directa.", steps: [
    { numeral: "I", degree: 1, offset: 0, chordId: "major", function: "Tónica" }, { numeral: "IV", degree: 4, offset: 5, chordId: "major", function: "Subdominante" }, { numeral: "V", degree: 5, offset: 7, chordId: "major", function: "Dominante" }, { numeral: "I", degree: 1, offset: 0, chordId: "major", function: "Resolución" },
  ] },
  { id: "pop", name: "Pop universal", style: "Pop · indie · electrónica", mode: "mayor", difficulty: "Inicial", description: "Una de las vueltas más reconocibles: estable, direccional y emotiva.", steps: [
    { numeral: "I", degree: 1, offset: 0, chordId: "major", function: "Tónica" }, { numeral: "V", degree: 5, offset: 7, chordId: "major", function: "Impulso" }, { numeral: "vi", degree: 6, offset: 9, chordId: "minor", function: "Relativa menor" }, { numeral: "IV", degree: 4, offset: 5, chordId: "major", function: "Apertura" },
  ] },
  { id: "doo-wop", name: "Vuelta de los 50", style: "Doo-wop · balada · soul", mode: "mayor", difficulty: "Inicial", description: "Una cadencia clásica que conecta la tónica con su relativa menor.", steps: [
    { numeral: "I", degree: 1, offset: 0, chordId: "major", function: "Tónica" }, { numeral: "vi", degree: 6, offset: 9, chordId: "minor", function: "Relativa" }, { numeral: "IV", degree: 4, offset: 5, chordId: "major", function: "Subdominante" }, { numeral: "V", degree: 5, offset: 7, chordId: "major", function: "Dominante" },
  ] },
  { id: "menor-clasica", name: "Cadencia menor", style: "Clásica · cine · canción", mode: "menor", difficulty: "Inicial", description: "La dominante mayor eleva el séptimo grado y conduce con fuerza hacia la tónica menor.", steps: [
    { numeral: "i", degree: 1, offset: 0, chordId: "minor", function: "Tónica menor" }, { numeral: "iv", degree: 4, offset: 5, chordId: "minor", function: "Subdominante" }, { numeral: "V", degree: 5, offset: 7, chordId: "major", function: "Dominante" }, { numeral: "i", degree: 1, offset: 0, chordId: "minor", function: "Resolución" },
  ] },
  { id: "epica-menor", name: "Épica menor", style: "Cine · rock · videojuegos", mode: "menor", difficulty: "Inicial", description: "Una vuelta descendente que explora los acordes mayores de la escala menor natural.", steps: [
    { numeral: "i", degree: 1, offset: 0, chordId: "minor", function: "Tónica" }, { numeral: "VI", degree: 6, offset: 8, chordId: "major", function: "Color" }, { numeral: "III", degree: 3, offset: 3, chordId: "major", function: "Relativa mayor" }, { numeral: "VII", degree: 7, offset: 10, chordId: "major", function: "Retorno" },
  ] },
  { id: "andalus-simple", name: "Descenso andaluz", style: "Flamenco · rock · cine", mode: "menor", difficulty: "Inicial", description: "Bajo descendente y dominante final: una tensión muy fácil de reconocer.", steps: [
    { numeral: "i", degree: 1, offset: 0, chordId: "minor", function: "Tónica" }, { numeral: "VII", degree: 7, offset: 10, chordId: "major", function: "Descenso" }, { numeral: "VI", degree: 6, offset: 8, chordId: "major", function: "Descenso" }, { numeral: "V", degree: 5, offset: 7, chordId: "major", function: "Dominante" },
  ] },
  { id: "dos-cinco-uno", name: "ii–V–I", style: "Jazz · bossa · standards", mode: "mayor", difficulty: "Intermedio", description: "Preparación, tensión y resolución. La célula funcional más importante del jazz.", steps: [
    { numeral: "ii7", degree: 2, offset: 2, chordId: "minor7", function: "Preparación" }, { numeral: "V7", degree: 5, offset: 7, chordId: "dominant7", function: "Tensión" }, { numeral: "Imaj7", degree: 1, offset: 0, chordId: "major7", function: "Resolución" },
  ] },
  { id: "turnaround", name: "Turnaround clásico", style: "Jazz · soul · gospel", mode: "mayor", difficulty: "Intermedio", description: "Una rueda funcional que siempre vuelve a empezar con naturalidad.", steps: [
    { numeral: "Imaj7", degree: 1, offset: 0, chordId: "major7", function: "Tónica" }, { numeral: "vi7", degree: 6, offset: 9, chordId: "minor7", function: "Prolongación" }, { numeral: "ii7", degree: 2, offset: 2, chordId: "minor7", function: "Preparación" }, { numeral: "V7", degree: 5, offset: 7, chordId: "dominant7", function: "Dominante" },
  ] },
  { id: "dominante-secundaria", name: "Dominante secundaria", style: "Pop · gospel · jazz", mode: "mayor", difficulty: "Intermedio", description: "V/vi convierte momentáneamente al sexto grado en un centro de llegada.", steps: [
    { numeral: "Imaj7", degree: 1, offset: 0, chordId: "major7", function: "Tónica" }, { numeral: "V7/vi", degree: 3, offset: 4, chordId: "dominant7", function: "Dominante secundaria" }, { numeral: "vi7", degree: 6, offset: 9, chordId: "minor7", function: "Tónica temporal" }, { numeral: "IVmaj7", degree: 4, offset: 5, chordId: "major7", function: "Apertura" },
  ] },
  { id: "dos-cinco-menor", name: "iiø–V–i", style: "Jazz menor · tango · cine", mode: "menor", difficulty: "Intermedio", description: "El semidisminuido prepara al dominante y la sensible conduce a la tónica menor.", steps: [
    { numeral: "iiø7", degree: 2, offset: 2, chordId: "half-diminished", function: "Preparación" }, { numeral: "V7", degree: 5, offset: 7, chordId: "dominant7", function: "Tensión" }, { numeral: "i(mMaj7)", degree: 1, offset: 0, chordId: "minor-major7", function: "Resolución" },
  ] },
  { id: "menor-septimas", name: "Órbita menor", style: "Neo-soul · R&B", mode: "menor", difficulty: "Intermedio", description: "Séptimas suaves alrededor del centro menor con una dominante clara al final.", steps: [
    { numeral: "i7", degree: 1, offset: 0, chordId: "minor7", function: "Tónica" }, { numeral: "iv7", degree: 4, offset: 5, chordId: "minor7", function: "Subdominante" }, { numeral: "VImaj7", degree: 6, offset: 8, chordId: "major7", function: "Color" }, { numeral: "V7", degree: 5, offset: 7, chordId: "dominant7", function: "Dominante" },
  ] },
  { id: "tres-seis-dos-cinco", name: "Cadena de dominantes", style: "Bebop · gospel · jazz", mode: "mayor", difficulty: "Avanzado", description: "El círculo de quintas encadena funciones hasta aterrizar en la tónica.", steps: [
    { numeral: "iii7", degree: 3, offset: 4, chordId: "minor7", function: "Inicio" }, { numeral: "VI7", degree: 6, offset: 9, chordId: "dominant7", function: "Dominante de ii" }, { numeral: "ii7", degree: 2, offset: 2, chordId: "minor7", function: "Preparación" }, { numeral: "V7", degree: 5, offset: 7, chordId: "dominant7", function: "Dominante" }, { numeral: "Imaj9", degree: 1, offset: 0, chordId: "major9", function: "Resolución" },
  ] },
  { id: "ciclo-completo", name: "Ciclo armónico", style: "Jazz moderno · reharmonización", mode: "mayor", difficulty: "Avanzado", description: "Una ruta larga con semidisminuido y dominantes encadenadas por quintas.", steps: [
    { numeral: "Imaj7", degree: 1, offset: 0, chordId: "major7", function: "Tónica" }, { numeral: "♯ivø7", degree: 4, offset: 6, chordId: "half-diminished", function: "Enlace cromático" }, { numeral: "VII7", degree: 7, offset: 11, chordId: "dominant7", function: "Dominante de iii" }, { numeral: "iii7", degree: 3, offset: 4, chordId: "minor7", function: "Centro relativo" }, { numeral: "VI7", degree: 6, offset: 9, chordId: "dominant7", function: "Dominante de ii" }, { numeral: "ii7", degree: 2, offset: 2, chordId: "minor7", function: "Preparación" }, { numeral: "V7", degree: 5, offset: 7, chordId: "dominant7", function: "Tensión" }, { numeral: "Imaj7", degree: 1, offset: 0, chordId: "major7", function: "Resolución" },
  ] },
  { id: "colores-altos", name: "Colores extendidos", style: "Neo-soul · fusión", mode: "mayor", difficulty: "Avanzado", description: "Novena y trecena muestran cómo la función se conserva aunque el voicing sea más rico.", steps: [
    { numeral: "Imaj9", degree: 1, offset: 0, chordId: "major9", function: "Tónica" }, { numeral: "VI7♭9", degree: 6, offset: 9, chordId: "dominant-flat9", function: "Dominante de ii" }, { numeral: "ii9", degree: 2, offset: 2, chordId: "minor9", function: "Preparación" }, { numeral: "V13", degree: 5, offset: 7, chordId: "thirteenth", function: "Dominante extendida" },
  ] },
  { id: "menor-extendida", name: "Cadencia menor extendida", style: "Jazz contemporáneo · cine", mode: "menor", difficulty: "Avanzado", description: "La cadencia menor completa con novenas, alteración dominante y resolución dramática.", steps: [
    { numeral: "iiø7", degree: 2, offset: 2, chordId: "half-diminished", function: "Preparación" }, { numeral: "V7♭9", degree: 5, offset: 7, chordId: "dominant-flat9", function: "Máxima tensión" }, { numeral: "i(mMaj7)", degree: 1, offset: 0, chordId: "minor-major7", function: "Resolución" },
  ] },
  { id: "andalus-extendida", name: "Andaluza extendida", style: "Flamenco-jazz · fusión", mode: "menor", difficulty: "Avanzado", description: "El descenso tradicional vestido con extensiones y una dominante alterada.", steps: [
    { numeral: "im9", degree: 1, offset: 0, chordId: "minor9", function: "Tónica" }, { numeral: "VII13", degree: 7, offset: 10, chordId: "thirteenth", function: "Descenso" }, { numeral: "VImaj9", degree: 6, offset: 8, chordId: "major9", function: "Color" }, { numeral: "V7♭9", degree: 5, offset: 7, chordId: "dominant-flat9", function: "Dominante" },
  ] },
];

const EMPTY_HISTORY: PracticeHistory = { totalRounds: 0, totalChords: 0, learned: {}, days: {} };
const STORAGE_KEY = "acorde-practice-v2";
const LEARNING_STORAGE_KEY = "acorde-learning-v3";
const READING_NOTES = ["C4", "D4", "E4", "G4"];
const READING_MIDI = [60, 62, 64, 67];
const SCALE_PATTERNS: Record<number, number[]> = {
  1: [60, 62, 64, 65, 67, 65, 64, 62, 60],
  2: [60, 62, 64, 65, 67, 69, 71, 72, 71, 69, 67, 65, 64, 62, 60],
  3: [60, 64, 67, 71, 72, 71, 67, 64, 60],
  4: [62, 65, 69, 72, 74, 72, 69, 65, 62],
  5: [53, 59, 64, 69, 74, 69, 64, 59, 53],
};
const LEVEL_PROGRESSION_IDS: Record<number, string> = { 1: "pilares", 2: "pop", 3: "turnaround", 4: "dos-cinco-uno", 5: "ciclo-completo" };
const MINOR_LEVEL_PROGRESSION_IDS: Record<number, string> = { 1: "menor-clasica", 2: "epica-menor", 3: "menor-septimas", 4: "dos-cinco-menor", 5: "menor-extendida" };
const EAR_CHORDS_BY_LEVEL: Record<number, string[]> = {
  1: ["major", "minor"],
  2: ["major", "minor", "diminished", "sus4"],
  3: ["major7", "minor7", "dominant7"],
  4: ["half-diminished", "dominant7", "minor-major7"],
  5: ["dominant-flat9", "major9", "thirteenth"],
};
const RHYTHM_PATTERNS: Record<number, { offsets: number[]; label: string }> = {
  1: { offsets: [0, 1, 2, 3], label: "1 · 2 · 3 · 4" },
  2: { offsets: [0, 2], label: "1 · — · 3 · —" },
  3: { offsets: [0, 1.5, 2.5, 3.5], label: "1 · 2& · 3& · 4&" },
  4: { offsets: [0, .5, 1.75, 3], label: "1 · 1& · 2a · 4" },
  5: { offsets: [0, .75, 2, 3.25], label: "1 · 1a · 3 · 4e" },
};

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function sequenceAccuracy(played: number[], target: number[], exactRegister = false) {
  if (!target.length) return 0;
  const correct = target.reduce((count, note, index) => count + (played[index] !== undefined && (exactRegister ? played[index] === note : mod(played[index]) === mod(note)) ? 1 : 0), 0);
  return Math.round((correct / Math.max(target.length, played.length || 1)) * 100);
}

function daysBetween(a: string, b: string) {
  return Math.round((new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 86400000);
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function resolveProgressionStep(keyRoot: { name: string; pc: number }, step: ProgressionStep) {
  const pc = mod(keyRoot.pc + step.offset);
  const name = spellFromDegree(keyRoot.name, step.degree, pc);
  const chord = CHORDS.find((item) => item.id === step.chordId) ?? CHORDS[0];
  return { pc, name, chord, notes: chord.intervals.map((interval) => 48 + pc + interval) };
}

function withClosestVoicings<T extends { notes: number[] }>(items: T[]) {
  let previous: number[] | null = null;
  return items.map((item) => {
    if (!previous || previous.length !== item.notes.length) {
      previous = item.notes;
      return item;
    }
    const candidates: number[][] = [];
    for (let inversion = 0; inversion < item.notes.length; inversion += 1) {
      const voiced = item.notes.map((note, index) => index < inversion ? note + 12 : note).sort((a, b) => a - b);
      [-12, 0, 12].forEach((shift) => candidates.push(voiced.map((note) => note + shift)));
    }
    const best = candidates.sort((a, b) => a.reduce((sum, note, index) => sum + Math.abs(note - previous![index]), 0) - b.reduce((sum, note, index) => sum + Math.abs(note - previous![index]), 0))[0];
    previous = best;
    return { ...item, notes: best };
  });
}

function mod(value: number, size = 12) {
  return ((value % size) + size) % size;
}

function rootPcFromName(name: string) {
  const letter = name[0];
  const accidental = name.slice(1);
  return mod(NATURAL_PCS[letter] + (accidental === "♯" ? 1 : accidental === "♭" ? -1 : 0));
}

function spellFromDegree(rootName: string, degree: number, desiredPc: number) {
  const rootLetterIndex = LETTERS.indexOf(rootName[0]);
  const letter = LETTERS[mod(rootLetterIndex + degree - 1, 7)];
  const naturalPc = NATURAL_PCS[letter];
  let delta = mod(desiredPc - naturalPc);
  if (delta > 6) delta -= 12;
  const accidental = delta === 0 ? "" : delta === 1 ? "♯" : delta === -1 ? "♭" : delta === 2 ? "𝄪" : delta === -2 ? "𝄫" : "";
  return `${letter}${accidental}`;
}

function degreeNumber(formula: string) {
  const match = formula.match(/\d+/);
  return match ? Number(match[0]) : 1;
}

function spellChord(rootName: string, chord: ChordDefinition) {
  const rootPc = rootPcFromName(rootName);
  return chord.intervals.map((interval, index) =>
    spellFromDegree(rootName, degreeNumber(chord.formula[index]), mod(rootPc + interval)),
  );
}

function spellScale(rootName: string, intervals: number[]) {
  const rootPc = rootPcFromName(rootName);
  return intervals.map((interval, index) => spellFromDegree(rootName, index + 1, mod(rootPc + interval)));
}

function midiLabel(note: number) {
  return `${NOTE_NAMES[mod(note)]}${Math.floor(note / 12) - 1}`;
}

function noteToSolfege(note: string) {
  return SOLFEGE[note[0]] ?? note;
}

function sameSet(a: number[], b: number[]) {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function detectHarmony(notes: number[]) {
  if (!notes.length) return { title: "Silencio", detail: "Toca una nota o un acorde" };
  const ordered = [...notes].sort((a, b) => a - b);
  if (ordered.length === 1) {
    return { title: midiLabel(ordered[0]), detail: `${NOTE_NAMES[mod(ordered[0])]} · ${noteToSolfege(NOTE_NAMES[mod(ordered[0])])}` };
  }
  const pcs = [...new Set(ordered.map((note) => mod(note)))].sort((a, b) => a - b);
  const bassPc = mod(ordered[0]);
  const matches: string[] = [];
  for (let root = 0; root < 12; root += 1) {
    for (const chord of CHORDS) {
      const chordPcs = [...new Set(chord.intervals.map((interval) => mod(root + interval)))].sort((a, b) => a - b);
      if (sameSet(pcs, chordPcs)) {
        const inversion = bassPc !== root ? `/${NOTE_NAMES[bassPc]}` : "";
        matches.push(`${NOTE_NAMES[root]}${chord.suffix}${inversion}`);
      }
    }
  }
  if (!matches.length) return { title: pcs.map((pc) => NOTE_NAMES[pc]).join(" · "), detail: `${ordered.length} notas · acorde por identificar` };
  return { title: matches.slice(0, 2).join("  /  "), detail: matches.length > 1 ? "Dos lecturas posibles según el contexto" : "Acorde reconocido" };
}

function inversionName(index: number, count: number) {
  if (index === 0) return "Fundamental";
  if (index === 1) return "1ª inversión";
  if (index === 2) return "2ª inversión";
  if (index === 3) return "3ª inversión";
  return `${index}ª inversión de ${count - 1}`;
}

function PianoKeyboard({ targetNotes, activeNotes, noteNames, onDown, onUp, rangeStart = 36 }: {
  targetNotes: number[];
  activeNotes: Set<number>;
  noteNames: Map<number, string>;
  onDown: (note: number) => void;
  onUp: (note: number) => void;
  rangeStart?: number;
}) {
  const allNotes = useMemo(() => Array.from({ length: 49 }, (_, index) => index + rangeStart), [rangeStart]);
  const whiteNotes = allNotes.filter((note) => ![1, 3, 6, 8, 10].includes(mod(note)));
  const blackNotes = allNotes.filter((note) => [1, 3, 6, 8, 10].includes(mod(note)));
  const targetPcs = new Set(targetNotes.map((note) => mod(note)));
  const isTarget = (note: number) => targetNotes.includes(note);
  const isActivePitch = (note: number) => [...activeNotes].some((active) => mod(active) === mod(note));
  const keyClass = (note: number) => [
    isTarget(note) ? "is-target" : "",
    isActivePitch(note) ? (targetPcs.has(mod(note)) ? "is-correct" : "is-wrong") : "",
  ].filter(Boolean).join(" ");

  return (
    <div className="piano-scroll" aria-label="Teclado de piano de 49 teclas">
      <div className="piano">
        <div className="white-keys">
          {whiteNotes.map((note) => (
            <button
              className={`piano-key white-key ${keyClass(note)}`}
              key={note}
              aria-label={`Tocar ${midiLabel(note)}`}
              onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); onDown(note); }}
              onPointerUp={() => onUp(note)}
              onPointerCancel={() => onUp(note)}
              onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && !event.repeat) onDown(note); }}
              onKeyUp={(event) => { if (event.key === "Enter" || event.key === " ") onUp(note); }}
            >
              {(isTarget(note) || isActivePitch(note) || mod(note) === 0) && (
                <span className="key-label">{noteNames.get(mod(note)) ?? midiLabel(note)}</span>
              )}
            </button>
          ))}
        </div>
        {blackNotes.map((note) => {
          const whitesBefore = allNotes.filter((candidate) => candidate < note && ![1, 3, 6, 8, 10].includes(mod(candidate))).length;
          const left = (whitesBefore / whiteNotes.length) * 100;
          return (
            <button
              className={`piano-key black-key ${keyClass(note)}`}
              key={note}
              style={{ left: `calc(${left}% - 12px)` }}
              aria-label={`Tocar ${midiLabel(note)}`}
              onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); onDown(note); }}
              onPointerUp={() => onUp(note)}
              onPointerCancel={() => onUp(note)}
              onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && !event.repeat) onDown(note); }}
              onKeyUp={(event) => { if (event.key === "Enter" || event.key === " ") onUp(note); }}
            >
              {(isTarget(note) || isActivePitch(note)) && <span className="key-label">{noteNames.get(mod(note)) ?? midiLabel(note)}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TheoryLesson({ lesson, rootName, chord, spelledNotes, mode }: {
  lesson: number;
  rootName: string;
  chord: ChordDefinition;
  spelledNotes: string[];
  mode: "mayor" | "menor";
}) {
  const scaleIntervals = mode === "mayor" ? MAJOR_SCALE : MINOR_SCALE;
  const scale = spellScale(rootName, scaleIntervals);

  if (lesson === 0) return (
    <div className="lesson-body">
      <p className="eyebrow coral">LECCIÓN 01 · FUNDAMENTO</p>
      <h2>Un intervalo es una distancia, no un dibujo.</h2>
      <p className="lesson-lead">Cuenta semitonos desde una raíz. Cuando cambias la tonalidad, la distancia se conserva aunque las teclas sean otras.</p>
      <div className="interval-ruler">
        {["1", "♭2", "2", "♭3", "3", "4", "♭5", "5", "♭6", "6", "♭7", "7"].map((label, index) => (
          <div className={chord.intervals.map((i) => mod(i)).includes(index) ? "active" : ""} key={label}><strong>{index}</strong><span>{label}</span></div>
        ))}
      </div>
      <div className="rule-card"><span>REGLA</span><p>1 semitono = una tecla contigua. 2 semitonos = un tono. La octava reaparece a los 12 semitonos.</p></div>
    </div>
  );

  if (lesson === 1) return (
    <div className="lesson-body">
      <p className="eyebrow coral">LECCIÓN 02 · CONSTRUCCIÓN</p>
      <h2>Las tríadas nacen apilando terceras.</h2>
      <p className="lesson-lead">Toma los grados 1, 3 y 5 de una escala. Cambia la distancia de las terceras y obtienes las cuatro familias básicas.</p>
      <div className="comparison-grid">
        {CHORDS.slice(0, 4).map((item) => <div key={item.id}><span>{item.formula.join(" · ")}</span><strong>{rootName}{item.suffix || ""}</strong><small>{item.name}</small></div>)}
      </div>
      <p className="lesson-note">En {rootName} {mode}, la escala es <strong>{scale.join(" · ")}</strong>. Numera esas notas y conserva los números al transponer.</p>
    </div>
  );

  if (lesson === 2) return (
    <div className="lesson-body">
      <p className="eyebrow coral">LECCIÓN 03 · FUNCIÓN</p>
      <h2>La séptima revela hacia dónde quiere ir el acorde.</h2>
      <p className="lesson-lead">Añade otra tercera sobre la quinta. La séptima mayor está a 11 semitonos; la menor, a 10.</p>
      <div className="seventh-stack"><div>1<small>raíz</small></div><i>+ 3ª</i><div>3<small>carácter</small></div><i>+ 3ª</i><div>5<small>soporte</small></div><i>+ 3ª</i><div>7<small>dirección</small></div></div>
      <div className="rule-card"><span>ESCUCHA</span><p>Compara {rootName}maj7 con {rootName}7. Solo cambia un semitono, pero el segundo crea tensión de dominante.</p></div>
    </div>
  );

  if (lesson === 3) return (
    <div className="lesson-body">
      <p className="eyebrow coral">LECCIÓN 04 · COLOR</p>
      <h2>9, 11 y 13 son notas de la escala una octava arriba.</h2>
      <p className="lesson-lead">9 = 2, 11 = 4 y 13 = 6. El número alto indica que aparecen después de la séptima en la pila de terceras.</p>
      <div className="extension-line"><div><b>2</b><span>→</span><strong>9</strong></div><div><b>4</b><span>→</span><strong>11</strong></div><div><b>6</b><span>→</span><strong>13</strong></div></div>
      <p className="lesson-note">Un voicing no necesita tocar todo. Conserva las notas que definen la función —sobre todo 3ª y 7ª— y el color que quieres oír.</p>
    </div>
  );

  if (lesson === 4) return (
    <div className="lesson-body">
      <p className="eyebrow coral">LECCIÓN 05 · MOVIMIENTO</p>
      <h2>Invertir es cambiar el bajo sin cambiar la identidad.</h2>
      <p className="lesson-lead">Sube la nota más grave una octava. Las clases de nota siguen siendo las mismas, pero cambia el peso y la conexión con el siguiente acorde.</p>
      <div className="inversion-demo">
        {spelledNotes.slice(0, Math.min(4, spelledNotes.length)).map((note, index, notes) => {
          const rotated = [...notes.slice(index), ...notes.slice(0, index)];
          return <div key={`${note}-${index}`}><span>{index === 0 ? "Raíz" : `${index}ª inv.`}</span><strong>{rotated.join(" – ")}</strong><small>Bajo: {rotated[0]}</small></div>;
        })}
      </div>
    </div>
  );

  return (
    <div className="lesson-body">
      <p className="eyebrow coral">LECCIÓN 06 · MÉTODO</p>
      <h2>Para transponer, conserva la fórmula.</h2>
      <p className="lesson-lead">No memorices una forma aislada. Elige una nueva raíz y vuelve a medir cada intervalo de la fórmula.</p>
      <div className="method-steps"><div><b>1</b><span>Elige raíz</span><strong>{rootName}</strong></div><div><b>2</b><span>Aplica fórmula</span><strong>{chord.formula.join(" · ")}</strong></div><div><b>3</b><span>Obtén notas</span><strong>{spelledNotes.join(" · ")}</strong></div></div>
      <div className="rule-card"><span>RESULTADO</span><p>{rootName}{chord.suffix} siempre conserva estas distancias: {chord.intervals.join(" – ")} semitonos desde la raíz.</p></div>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<"ruta" | "practica" | "progresiones" | "teoria">("ruta");
  const [keyRootIndex, setKeyRootIndex] = useState(0);
  const [rootIndex, setRootIndex] = useState(0);
  const [mode, setMode] = useState<"mayor" | "menor">("mayor");
  const [selectedChordId, setSelectedChordId] = useState("major7");
  const [inversion, setInversion] = useState(0);
  const [category, setCategory] = useState<(typeof CATEGORY_FILTERS)[number]>("Todos");
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [lastVelocity, setLastVelocity] = useState(0);
  const [midiState, setMidiState] = useState<"idle" | "connecting" | "connected" | "waiting" | "unsupported" | "error">("idle");
  const [deviceName, setDeviceName] = useState("Alesis Q49 / teclado MIDI");
  const [audioOn, setAudioOn] = useState(true);
  const [soundVariant, setSoundVariant] = useState<SoundVariant>("piano");
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lesson, setLesson] = useState(0);
  const [showMidiHelp, setShowMidiHelp] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("Inicial");
  const [progressionId, setProgressionId] = useState("pilares");
  const [progressionStep, setProgressionStep] = useState(0);
  const [roundChecks, setRoundChecks] = useState<boolean[]>([false, false, false, false]);
  const [roundComplete, setRoundComplete] = useState(false);
  const [progressionSessionActive, setProgressionSessionActive] = useState(false);
  const [tempo, setTempo] = useState(78);
  const [dailyGoal, setDailyGoal] = useState(3);
  const [history, setHistory] = useState<PracticeHistory>(EMPTY_HISTORY);
  const [hydrated, setHydrated] = useState(false);
  const [demoStep, setDemoStep] = useState<number | null>(null);
  const [isPlayingProgression, setIsPlayingProgression] = useState(false);
  const [learningProfile, setLearningProfile] = useState<PracticeProfile>(EMPTY_PROFILE);
  const [mastery, setMastery] = useState<Record<string, SkillMastery>>({});
  const [attempts, setAttempts] = useState<AttemptResult[]>([]);
  const [dailySessions, setDailySessions] = useState<Record<string, DailySession>>({});
  const [routePillar, setRoutePillar] = useState<LearningPillar>("Técnica");
  const [routePlayed, setRoutePlayed] = useState<number[]>([]);
  const [routeVelocities, setRouteVelocities] = useState<number[]>([]);
  const [routeFeedback, setRouteFeedback] = useState("Conecta el MIDI o usa el teclado en pantalla para comenzar.");
  const [routePassed, setRoutePassed] = useState(false);
  const [routeAttemptDone, setRouteAttemptDone] = useState(false);
  const [routeUsedHelp, setRouteUsedHelp] = useState(false);
  const [learningSessionActive, setLearningSessionActive] = useState(false);
  const [learningSessionIndex, setLearningSessionIndex] = useState(0);
  const [diagnosticStep, setDiagnosticStep] = useState(-1);
  const [routeApplicationStep, setRouteApplicationStep] = useState(0);
  const [rhythmRunning, setRhythmRunning] = useState(false);
  const [rhythmCountdown, setRhythmCountdown] = useState<number | null>(null);
  const [rhythmEvents, setRhythmEvents] = useState<Array<{ note: number; at: number; velocity: number }>>([]);
  const [sustainDown, setSustainDown] = useState(false);
  const [midiRange, setMidiRange] = useState({ min: 36, max: 84 });
  const [calibrationStage, setCalibrationStage] = useState<"idle" | "soft" | "medium" | "loud">("idle");
  const [calibrationSamples, setCalibrationSamples] = useState<number[]>([]);

  const midiAccessRef = useRef<MidiAccessLike | null>(null);
  const sustainedRef = useRef(new Set<number>());
  const sustainOnRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const voicesRef = useRef(new Map<number, { oscillators: OscillatorNode[]; gain: GainNode; release: number }>());
  const audioOnRef = useRef(audioOn);
  const soundVariantRef = useRef<SoundVariant>(soundVariant);
  const solvedRef = useRef(false);
  const progressionSolvedRef = useRef(false);
  const progressionAdvanceTimerRef = useRef<number | null>(null);
  const demoTimersRef = useRef<number[]>([]);
  const demoVoicesRef = useRef(new Set<number>());
  const rhythmTimersRef = useRef<number[]>([]);
  const rhythmStartRef = useRef(0);
  const importProgressRef = useRef<HTMLInputElement | null>(null);

  const keyRoot = ROOTS[keyRootIndex];
  const filteredProgressions = useMemo(() => PROGRESSIONS.filter((progression) => progression.mode === mode && progression.difficulty === difficulty), [mode, difficulty]);
  const selectedProgression = PROGRESSIONS.find((progression) => progression.id === progressionId) ?? filteredProgressions[0] ?? PROGRESSIONS[0];
  const currentProgressionStep = selectedProgression.steps[Math.min(progressionStep, selectedProgression.steps.length - 1)];
  const progressionRootPc = mod(keyRoot.pc + currentProgressionStep.offset);
  const progressionRootName = spellFromDegree(keyRoot.name, currentProgressionStep.degree, progressionRootPc);
  const root = view === "progresiones" ? { name: progressionRootName, pc: progressionRootPc } : ROOTS[rootIndex];
  const selectedChord = view === "progresiones"
    ? (CHORDS.find((chord) => chord.id === currentProgressionStep.chordId) ?? CHORDS[0])
    : (CHORDS.find((chord) => chord.id === selectedChordId) ?? CHORDS[0]);
  const spelledNotes = useMemo(() => spellChord(root.name, selectedChord), [root.name, selectedChord]);
  const scaleIntervals = mode === "mayor" ? MAJOR_SCALE : MINOR_SCALE;
  const scaleNames = useMemo(() => spellScale(keyRoot.name, scaleIntervals), [keyRoot.name, scaleIntervals]);

  const targetNotes = useMemo(() => {
    const raw = selectedChord.intervals.map((interval) => 36 + root.pc + interval);
    const voiced = raw.map((note, index) => index < inversion ? note + 12 : note);
    return voiced.sort((a, b) => a - b);
  }, [selectedChord, root.pc, inversion]);

  const targetPitchClasses = useMemo(() => [...new Set(selectedChord.intervals.map((interval) => mod(root.pc + interval)))].sort((a, b) => a - b), [selectedChord, root.pc]);
  const activePitchClasses = useMemo(() => [...new Set([...activeNotes].map((note) => mod(note)))].sort((a, b) => a - b), [activeNotes]);
  const missingPcs = targetPitchClasses.filter((pc) => !activePitchClasses.includes(pc));
  const extraPcs = activePitchClasses.filter((pc) => !targetPitchClasses.includes(pc));
  const isCorrect = activePitchClasses.length > 0 && missingPcs.length === 0 && extraPcs.length === 0;
  const harmony = useMemo(() => detectHarmony([...activeNotes]), [activeNotes]);
  const filteredChords = category === "Todos" ? CHORDS : CHORDS.filter((chord) => chord.category === category);
  const noteNameMap = useMemo(() => {
    const result = new Map<number, string>();
    selectedChord.intervals.forEach((interval, index) => result.set(mod(root.pc + interval), spelledNotes[index]));
    return result;
  }, [selectedChord, root.pc, spelledNotes]);

  const diatonicChords = useMemo(() => {
    const qualities = mode === "mayor" ? MAJOR_QUALITIES : MINOR_QUALITIES;
    const degrees = mode === "mayor" ? MAJOR_DEGREES : MINOR_DEGREES;
    return scaleNames.map((note, index) => ({ note, degree: degrees[index], chord: CHORDS.find((item) => item.id === qualities[index]) ?? CHORDS[0] }));
  }, [mode, scaleNames]);

  const todayKey = localDateKey();
  const todayData = history.days[todayKey] ?? { rounds: 0, chords: 0, progressions: {} };
  const todayProgressionRounds = todayData.progressions[selectedProgression.id] ?? 0;
  const learnedCount = Object.keys(history.learned).length;
  const progressionChords = useMemo(() => selectedProgression.steps.map((step) => ({ step, ...resolveProgressionStep(keyRoot, step) })), [keyRoot, selectedProgression.steps]);
  const lastSevenDays = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = localDateKey(date);
    return { key, label: date.toLocaleDateString("es-UY", { weekday: "short" }).slice(0, 2), rounds: history.days[key]?.rounds ?? 0 };
  }), [history.days]);
  const practiceStreak = useMemo(() => {
    let count = 0;
    const cursor = new Date();
    while (history.days[localDateKey(cursor)]?.rounds) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [history.days]);

  const currentLearningLevel = Math.min(5, Math.max(1, learningProfile.currentLevel));
  const currentLevelUnits = useMemo(() => unitsForLevel(currentLearningLevel), [currentLearningLevel]);
  const plannedUnitIds = useMemo(() => currentLevelUnits.map((unit) => unit.id), [currentLevelUnits]);
  const todayLearningSession = dailySessions[todayKey];
  const learningUnitIds = todayLearningSession?.unitIds?.length ? todayLearningSession.unitIds : plannedUnitIds;
  const selectedRouteUnit = currentLevelUnits.find((unit) => unit.pillar === routePillar) ?? currentLevelUnits[0] ?? CURRICULUM[0];
  const currentLearningUnit = learningSessionActive
    ? (CURRICULUM.find((unit) => unit.id === learningUnitIds[Math.min(learningSessionIndex, learningUnitIds.length - 1)]) ?? selectedRouteUnit)
    : selectedRouteUnit;
  const activeRoutePillar = currentLearningUnit.pillar;
  const routeProgression = PROGRESSIONS.find((item) => item.id === (mode === "menor" ? MINOR_LEVEL_PROGRESSION_IDS[currentLearningLevel] : LEVEL_PROGRESSION_IDS[currentLearningLevel])) ?? PROGRESSIONS[0];
  const routeProgressionChords = useMemo(() => {
    const resolved = routeProgression.steps.map((step) => ({ step, ...resolveProgressionStep(keyRoot, step) }));
    return currentLearningLevel === 3 ? withClosestVoicings(resolved) : resolved;
  }, [keyRoot, routeProgression.steps, currentLearningLevel]);
  const currentRouteApplication = routeProgressionChords[Math.min(routeApplicationStep, routeProgressionChords.length - 1)];
  const rhythmPattern = RHYTHM_PATTERNS[currentLearningLevel] ?? RHYTHM_PATTERNS[1];
  const routeTargetSequence = useMemo(() => {
    if (activeRoutePillar === "Lectura") return READING_MIDI;
    if (activeRoutePillar === "Ritmo") return Array(rhythmPattern.offsets.length).fill(60 + keyRoot.pc);
    if (activeRoutePillar === "Técnica") return (SCALE_PATTERNS[currentLearningLevel] ?? SCALE_PATTERNS[1]).map((note) => note + keyRoot.pc);
    return [];
  }, [activeRoutePillar, currentLearningLevel, keyRoot.pc, rhythmPattern.offsets.length]);
  const earChoices = EAR_CHORDS_BY_LEVEL[currentLearningLevel] ?? EAR_CHORDS_BY_LEVEL[1];
  const earChord = CHORDS.find((chord) => chord.id === earChoices[new Date().getDate() % earChoices.length]) ?? CHORDS[0];
  const earRootPc = keyRoot.pc;
  const earTargetNotes = earChord.intervals.map((interval) => 48 + earRootPc + interval);
  const improvScaleNotes = scaleIntervals.map((interval) => 60 + keyRoot.pc + interval);
  const routeTargetPitchClasses = activeRoutePillar === "Oído"
    ? [...new Set(earTargetNotes.map((note) => mod(note)))].sort((a, b) => a - b)
    : activeRoutePillar === "Aplicación" && currentLearningLevel < 4
      ? [...new Set(currentRouteApplication.chord.intervals.map((interval) => mod(currentRouteApplication.pc + interval)))].sort((a, b) => a - b)
      : [];
  const routeChordCorrect = activeRoutePillar === "Aplicación" && currentLearningLevel === 3
    ? sameSet([...activeNotes].sort((a, b) => a - b), [...currentRouteApplication.notes].sort((a, b) => a - b))
    : routeTargetPitchClasses.length > 0 && sameSet(activePitchClasses, routeTargetPitchClasses);
  const routeKeyboardTargets = activeRoutePillar === "Oído"
    ? earTargetNotes
    : activeRoutePillar === "Aplicación"
      ? (currentLearningLevel >= 4 ? improvScaleNotes : currentRouteApplication.notes)
      : routeTargetSequence;
  const routeObservedMax = Math.max(midiRange.max, ...routeKeyboardTargets, ...activeNotes);
  const routeObservedMin = Math.min(midiRange.min, ...routeKeyboardTargets, ...activeNotes);
  const routeKeyboardStart = routeObservedMax > 84
    ? Math.max(12, Math.ceil((routeObservedMax - 48) / 12) * 12)
    : routeObservedMin < 36
      ? Math.max(12, Math.floor(routeObservedMin / 12) * 12)
      : 36;
  const routeSequenceScore = sequenceAccuracy(routePlayed, routeTargetSequence, activeRoutePillar === "Lectura");
  const learningCompletedToday = todayLearningSession?.completedUnitIds?.length ?? 0;
  const learningProgressPercent = Math.round((learningCompletedToday / Math.max(1, learningUnitIds.length)) * 100);
  const masteredUnits = Object.values(mastery).filter((item) => item.status === "dominado").length;
  const dueReviews = Object.values(mastery).filter((item) => item.nextReview && item.nextReview <= todayKey && item.status !== "dominado").length;
  const learningDays = Object.values(dailySessions).filter((session) => session.completed).length;
  const pillarScores = useMemo(() => PILLARS.map((pillar) => {
    const units = CURRICULUM.filter((unit) => unit.pillar === pillar.name);
    const values = units.map((unit) => mastery[unit.id]?.bestAccuracy ?? 0).filter(Boolean);
    return { ...pillar, score: Math.round(average(values)), mastered: units.filter((unit) => mastery[unit.id]?.status === "dominado").length };
  }), [mastery]);

  useEffect(() => {
    try {
      const currentRaw = localStorage.getItem(LEARNING_STORAGE_KEY);
      const raw = currentRaw ?? localStorage.getItem(STORAGE_KEY);
      const migratingLegacy = !currentRaw && Boolean(raw);
      if (raw) {
        const saved = JSON.parse(raw) as {
          settings?: { view?: "ruta" | "practica" | "progresiones" | "teoria"; keyRootIndex?: number; rootIndex?: number; mode?: "mayor" | "menor"; difficulty?: Difficulty; progressionId?: string; tempo?: number; dailyGoal?: number; audioOn?: boolean; soundVariant?: SoundVariant };
          history?: PracticeHistory;
          learning?: { profile?: PracticeProfile; mastery?: Record<string, SkillMastery>; attempts?: AttemptResult[]; dailySessions?: Record<string, DailySession> };
        };
        const settings = saved.settings;
        if (settings?.view && !migratingLegacy) setView(settings.view);
        if (typeof settings?.keyRootIndex === "number" && ROOTS[settings.keyRootIndex]) setKeyRootIndex(settings.keyRootIndex);
        if (typeof settings?.rootIndex === "number" && ROOTS[settings.rootIndex]) setRootIndex(settings.rootIndex);
        if (settings?.mode === "mayor" || settings?.mode === "menor") setMode(settings.mode);
        if (settings?.difficulty && ["Inicial", "Intermedio", "Avanzado"].includes(settings.difficulty)) setDifficulty(settings.difficulty);
        if (settings?.progressionId && PROGRESSIONS.some((item) => item.id === settings.progressionId)) setProgressionId(settings.progressionId);
        if (typeof settings?.tempo === "number") setTempo(Math.min(140, Math.max(50, settings.tempo)));
        if (typeof settings?.dailyGoal === "number") setDailyGoal(Math.min(8, Math.max(1, settings.dailyGoal)));
        if (typeof settings?.audioOn === "boolean") setAudioOn(settings.audioOn);
        if (settings?.soundVariant && ["piano", "electrico", "organo"].includes(settings.soundVariant)) setSoundVariant(settings.soundVariant);
        if (saved.history?.days && saved.history?.learned) setHistory(saved.history);
        if (saved.learning?.profile) setLearningProfile({ ...EMPTY_PROFILE, ...saved.learning.profile, currentLevel: Math.min(5, Math.max(1, saved.learning.profile.currentLevel ?? 1)) });
        if (saved.learning?.mastery) setMastery(saved.learning.mastery);
        if (Array.isArray(saved.learning?.attempts)) setAttempts(saved.learning.attempts.slice(-400));
        if (saved.learning?.dailySessions) setDailySessions(saved.learning.dailySessions);
      }
    } catch {
      setHistory(EMPTY_HISTORY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(LEARNING_STORAGE_KEY, JSON.stringify({
      version: 3,
      settings: { view, keyRootIndex, rootIndex, mode, difficulty, progressionId, tempo, dailyGoal, audioOn, soundVariant },
      history,
      learning: { profile: learningProfile, mastery, attempts: attempts.slice(-400), dailySessions },
    }));
  }, [hydrated, view, keyRootIndex, rootIndex, mode, difficulty, progressionId, tempo, dailyGoal, audioOn, soundVariant, history, learningProfile, mastery, attempts, dailySessions]);

  const finishRouteAttempt = useCallback((passed: boolean, metrics?: Partial<AttemptResult>) => {
    if (routeAttemptDone) return;
    const dateKey = localDateKey();
    const pitchAccuracy = metrics?.pitchAccuracy ?? (routeTargetSequence.length ? sequenceAccuracy(routePlayed, routeTargetSequence, activeRoutePillar === "Lectura") : passed ? 100 : 0);
    const velocityTarget = learningProfile.velocityCalibration?.medium;
    const velocityAccuracy = metrics?.velocityAccuracy ?? (velocityTarget && routeVelocities.length ? Math.max(0, Math.round(100 - Math.abs(average(routeVelocities) - velocityTarget) * 2)) : 100);
    const result: AttemptResult = {
      id: `${Date.now()}-${currentLearningUnit.id}`,
      unitId: currentLearningUnit.id,
      date: dateKey,
      pitchAccuracy,
      timingAccuracy: metrics?.timingAccuracy ?? 100,
      velocityAccuracy,
      pedalAccuracy: metrics?.pedalAccuracy ?? (sustainDown ? 100 : 0),
      tempo: metrics?.tempo ?? currentLearningUnit.tempo,
      usedHelp: routeUsedHelp,
      passed,
    };
    setAttempts((previous) => [...previous.slice(-399), result]);
    setMastery((previous) => {
      const old = previous[currentLearningUnit.id];
      const passedDates = passed ? [...new Set([...(old?.passedDates ?? []), dateKey])] : (old?.passedDates ?? []);
      const passes = (old?.passes ?? 0) + (passed ? 1 : 0);
      const status: SkillMastery["status"] = passedDates.length >= 2 ? "dominado" : passes >= 2 ? "aprobado" : (old?.status === "aprobado" ? "aprobado" : "en_progreso");
      return {
        ...previous,
        [currentLearningUnit.id]: {
          unitId: currentLearningUnit.id,
          status,
          passes,
          attempts: (old?.attempts ?? 0) + 1,
          bestAccuracy: Math.max(old?.bestAccuracy ?? 0, Math.round(average([pitchAccuracy, result.timingAccuracy, velocityAccuracy]))),
          bestTempo: Math.max(old?.bestTempo ?? 0, result.tempo),
          lastPracticed: dateKey,
          passedDates,
          nextReview: addDays(dateKey, passed ? (status === "dominado" ? 14 : 3) : 1),
        },
      };
    });
    setRoutePassed(passed);
    setRouteAttemptDone(true);
    setRouteFeedback(passed ? "¡Bloque superado! Quedó guardado en tu ruta." : "Buen intento. Revisa la guía y vuelve a probar.");
    if (passed) {
      setDailySessions((previous) => {
        const session = previous[dateKey] ?? { date: dateKey, minutes: learningProfile.sessionMinutes, unitIds: plannedUnitIds, completedUnitIds: [], completed: false };
        const completedUnitIds = [...new Set([...session.completedUnitIds, currentLearningUnit.id])];
        return { ...previous, [dateKey]: { ...session, completedUnitIds, completed: session.unitIds.every((id) => completedUnitIds.includes(id)) } };
      });
    }
  }, [routeAttemptDone, routeTargetSequence, routePlayed, activeRoutePillar, learningProfile.velocityCalibration, learningProfile.sessionMinutes, routeVelocities, currentLearningUnit, sustainDown, routeUsedHelp, plannedUnitIds]);

  const resetRouteAttempt = useCallback(() => {
    setRoutePlayed([]);
    setRouteVelocities([]);
    setRhythmEvents([]);
    setRouteApplicationStep(0);
    setRoutePassed(false);
    setRouteAttemptDone(false);
    setRouteUsedHelp(false);
    setRouteFeedback("Escucha la cuenta, mira el objetivo y toca cuando estés listo.");
  }, []);

  const startLearningSession = useCallback(() => {
    const dateKey = localDateKey();
    setDailySessions((previous) => ({
      ...previous,
      [dateKey]: previous[dateKey] ?? { date: dateKey, minutes: learningProfile.sessionMinutes, unitIds: plannedUnitIds, completedUnitIds: [], completed: false },
    }));
    const completed = dailySessions[dateKey]?.completedUnitIds ?? [];
    const firstPending = plannedUnitIds.findIndex((id) => !completed.includes(id));
    setLearningSessionIndex(firstPending >= 0 ? firstPending : 0);
    setLearningSessionActive(true);
    resetRouteAttempt();
  }, [dailySessions, learningProfile.sessionMinutes, plannedUnitIds, resetRouteAttempt]);

  const advanceLearningSession = useCallback(() => {
    const completed = dailySessions[localDateKey()]?.completedUnitIds ?? [];
    const nextIndex = learningUnitIds.findIndex((id, index) => index > learningSessionIndex && !completed.includes(id));
    if (nextIndex >= 0) {
      setLearningSessionIndex(nextIndex);
      resetRouteAttempt();
    } else {
      setLearningSessionActive(false);
      setRouteFeedback("Sesión terminada. Mañana mezclaremos estos conceptos de otra forma.");
    }
  }, [dailySessions, learningSessionIndex, learningUnitIds, resetRouteAttempt]);

  useEffect(() => {
    resetRouteAttempt();
  }, [currentLearningUnit.id, keyRoot.pc, resetRouteAttempt]);

  useEffect(() => {
    if (diagnosticStep >= 0 || routeAttemptDone || activeRoutePillar === "Ritmo" || !routeTargetSequence.length || routePlayed.length < routeTargetSequence.length) return;
    const score = sequenceAccuracy(routePlayed, routeTargetSequence, activeRoutePillar === "Lectura");
    finishRouteAttempt(score === 100, { pitchAccuracy: score });
  }, [diagnosticStep, routeAttemptDone, activeRoutePillar, routeTargetSequence, routePlayed, finishRouteAttempt]);

  useEffect(() => {
    if (diagnosticStep >= 0 || routeAttemptDone || activeRoutePillar !== "Aplicación" || currentLearningLevel < 4 || routePlayed.length < 12) return;
    const scalePcs = new Set(scaleIntervals.map((interval) => mod(keyRoot.pc + interval)));
    const inScale = routePlayed.slice(0, 12).filter((note) => scalePcs.has(mod(note))).length;
    const distinct = new Set(routePlayed.slice(0, 12).map((note) => mod(note))).size;
    const pitchAccuracy = Math.round((inScale / 12) * 100);
    finishRouteAttempt(pitchAccuracy >= 80 && distinct >= 4, { pitchAccuracy, timingAccuracy: 100, tempo: currentLearningUnit.tempo });
  }, [diagnosticStep, routeAttemptDone, activeRoutePillar, currentLearningLevel, routePlayed, scaleIntervals, keyRoot.pc, currentLearningUnit.tempo, finishRouteAttempt]);

  useEffect(() => {
    if (view !== "ruta" || routeAttemptDone || !routeChordCorrect) return;
    if (activeRoutePillar === "Oído") finishRouteAttempt(true, { pitchAccuracy: 100 });
    if (activeRoutePillar === "Aplicación") {
      if (routeApplicationStep >= routeProgressionChords.length - 1) finishRouteAttempt(true, { pitchAccuracy: 100 });
      else setRouteApplicationStep((step) => step + 1);
    }
  }, [view, routeAttemptDone, routeChordCorrect, activeRoutePillar, routeApplicationStep, routeProgressionChords.length, finishRouteAttempt]);

  useEffect(() => {
    if (diagnosticStep !== 1 || !sameSet(activePitchClasses, [0, 4, 7])) return;
    setDiagnosticStep(2);
    setRoutePlayed([]);
    setRouteFeedback("Muy bien. Último paso: toca Do mayor ascendente, de Do a Do.");
  }, [diagnosticStep, activePitchClasses]);

  useEffect(() => {
    const ready = currentLevelUnits.every((unit) => ["aprobado", "dominado"].includes(mastery[unit.id]?.status ?? ""));
    if (ready && currentLearningLevel < 5) setLearningProfile((profile) => ({ ...profile, currentLevel: profile.currentLevel + 1 }));
  }, [currentLevelUnits, mastery, currentLearningLevel]);

  useEffect(() => {
    if (!rhythmRunning || rhythmEvents.length < rhythmPattern.offsets.length) return;
    const beatMs = 60000 / currentLearningUnit.tempo;
    const timingErrors = rhythmEvents.slice(0, rhythmPattern.offsets.length).map((event, index) => Math.abs(event.at - (rhythmStartRef.current + rhythmPattern.offsets[index] * beatMs)) / beatMs);
    const timingAccuracy = Math.max(0, Math.round(100 - average(timingErrors) * 140));
    const pitchAccuracy = Math.round((rhythmEvents.slice(0, rhythmPattern.offsets.length).filter((event) => mod(event.note) === keyRoot.pc).length / rhythmPattern.offsets.length) * 100);
    setRhythmRunning(false);
    finishRouteAttempt(timingAccuracy >= 68 && pitchAccuracy === 100, { timingAccuracy, pitchAccuracy, tempo: currentLearningUnit.tempo });
  }, [rhythmRunning, rhythmEvents, rhythmPattern.offsets, currentLearningUnit.tempo, keyRoot.pc, finishRouteAttempt]);

  useEffect(() => {
    const compatible = PROGRESSIONS.find((item) => item.id === progressionId && item.mode === mode && item.difficulty === difficulty);
    if (!compatible && filteredProgressions[0]) setProgressionId(filteredProgressions[0].id);
  }, [difficulty, mode, progressionId, filteredProgressions]);

  useEffect(() => {
    setProgressionStep(0);
    setRoundChecks(Array(selectedProgression.steps.length).fill(false));
    setRoundComplete(false);
    setProgressionSessionActive(false);
    progressionSolvedRef.current = false;
  }, [selectedProgression.id, selectedProgression.steps.length]);

  useEffect(() => { audioOnRef.current = audioOn; }, [audioOn]);
  useEffect(() => { soundVariantRef.current = soundVariant; }, [soundVariant]);
  useEffect(() => { setInversion(0); solvedRef.current = false; }, [selectedChordId, rootIndex, progressionStep, view]);
  useEffect(() => {
    if (isCorrect && !solvedRef.current) {
      solvedRef.current = true;
      setCorrectCount((count) => count + 1);
      setStreak((count) => count + 1);
      const chordKey = `${root.name}${selectedChord.suffix || "maj"}`;
      const dateKey = localDateKey();
      setHistory((previous) => {
        const currentDay = previous.days[dateKey] ?? { rounds: 0, chords: 0, progressions: {} };
        const learned = previous.learned[chordKey] ?? { hits: 0, lastPracticed: dateKey };
        return {
          ...previous,
          totalChords: previous.totalChords + 1,
          learned: { ...previous.learned, [chordKey]: { hits: learned.hits + 1, lastPracticed: dateKey } },
          days: { ...previous.days, [dateKey]: { ...currentDay, chords: currentDay.chords + 1 } },
        };
      });
    }
    if (activeNotes.size === 0) solvedRef.current = false;
  }, [isCorrect, activeNotes.size, root.name, selectedChord.suffix]);

  useEffect(() => {
    if (view !== "progresiones" || !progressionSessionActive || roundComplete || !isCorrect || progressionSolvedRef.current) return;
    progressionSolvedRef.current = true;
    setRoundChecks((previous) => previous.map((checked, index) => index === progressionStep ? true : checked));
    progressionAdvanceTimerRef.current = window.setTimeout(() => {
      if (progressionStep >= selectedProgression.steps.length - 1) {
        const dateKey = localDateKey();
        setRoundComplete(true);
        setProgressionSessionActive(false);
        setHistory((previous) => {
          const currentDay = previous.days[dateKey] ?? { rounds: 0, chords: 0, progressions: {} };
          return {
            ...previous,
            totalRounds: previous.totalRounds + 1,
            days: {
              ...previous.days,
              [dateKey]: {
                ...currentDay,
                rounds: currentDay.rounds + 1,
                progressions: { ...currentDay.progressions, [selectedProgression.id]: (currentDay.progressions[selectedProgression.id] ?? 0) + 1 },
              },
            },
          };
        });
      } else {
        setProgressionStep((step) => step + 1);
      }
    }, 650);
  }, [view, progressionSessionActive, roundComplete, isCorrect, progressionStep, selectedProgression.id, selectedProgression.steps.length]);

  useEffect(() => { progressionSolvedRef.current = false; }, [progressionStep]);

  const ensureAudio = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioContextRef.current) audioContextRef.current = new AudioContext();
    if (audioContextRef.current.state === "suspended") void audioContextRef.current.resume();
    return audioContextRef.current;
  }, []);

  const soundOn = useCallback((note: number, velocity = 90) => {
    if (!audioOnRef.current || voicesRef.current.has(note)) return;
    const context = ensureAudio();
    if (!context) return;
    const gain = context.createGain();
    const frequency = 440 * 2 ** ((note - 69) / 12);
    const variant = soundVariantRef.current;
    const oscillatorSpecs: Array<{ type: OscillatorType; ratio: number; detune?: number }> = variant === "electrico"
      ? [{ type: "sine", ratio: 1 }, { type: "triangle", ratio: 2, detune: 4 }]
      : variant === "organo"
        ? [{ type: "sine", ratio: 1 }, { type: "sine", ratio: 2 }, { type: "square", ratio: .5, detune: -3 }]
        : [{ type: "triangle", ratio: 1 }];
    const oscillators = oscillatorSpecs.map((spec) => {
      const oscillator = context.createOscillator();
      oscillator.type = spec.type;
      oscillator.frequency.value = frequency * spec.ratio;
      oscillator.detune.value = spec.detune ?? 0;
      oscillator.connect(gain);
      oscillator.start();
      return oscillator;
    });
    const peak = variant === "piano" ? Math.max(0.018, velocity / 1270) : variant === "electrico" ? Math.max(0.012, velocity / 2450) : Math.max(0.009, velocity / 3200);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(peak, context.currentTime + (variant === "organo" ? 0.045 : 0.018));
    if (variant === "electrico") gain.gain.exponentialRampToValueAtTime(peak * .68, context.currentTime + .55);
    gain.connect(context.destination);
    voicesRef.current.set(note, { oscillators, gain, release: variant === "organo" ? .24 : variant === "electrico" ? .32 : .14 });
  }, [ensureAudio]);

  const soundOff = useCallback((note: number) => {
    const voice = voicesRef.current.get(note);
    const context = audioContextRef.current;
    if (!voice || !context) return;
    voice.gain.gain.cancelScheduledValues(context.currentTime);
    voice.gain.gain.setValueAtTime(Math.max(voice.gain.gain.value, 0.0001), context.currentTime);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + voice.release);
    voice.oscillators.forEach((oscillator) => oscillator.stop(context.currentTime + voice.release + .02));
    voicesRef.current.delete(note);
  }, []);

  const cancelProgressionPlayback = useCallback(() => {
    demoTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    demoTimersRef.current = [];
    demoVoicesRef.current.forEach((note) => soundOff(note));
    demoVoicesRef.current.clear();
    setDemoStep(null);
    setIsPlayingProgression(false);
  }, [soundOff]);

  const auditionProgressionStep = useCallback((index: number) => {
    cancelProgressionPlayback();
    audioOnRef.current = true;
    setAudioOn(true);
    ensureAudio();
    const step = selectedProgression.steps[index];
    const resolved = resolveProgressionStep(keyRoot, step);
    setDemoStep(index);
    resolved.notes.forEach((note) => { demoVoicesRef.current.add(note); soundOn(note, 76); });
    const timer = window.setTimeout(() => {
      resolved.notes.forEach((note) => { soundOff(note); demoVoicesRef.current.delete(note); });
      setDemoStep(null);
    }, 950);
    demoTimersRef.current.push(timer);
  }, [cancelProgressionPlayback, ensureAudio, keyRoot, selectedProgression.steps, soundOff, soundOn]);

  const playProgression = useCallback(() => {
    cancelProgressionPlayback();
    audioOnRef.current = true;
    setAudioOn(true);
    ensureAudio();
    setIsPlayingProgression(true);
    const beatMs = 60000 / tempo;
    selectedProgression.steps.forEach((step, index) => {
      const resolved = resolveProgressionStep(keyRoot, step);
      const startTimer = window.setTimeout(() => {
        setDemoStep(index);
        resolved.notes.forEach((note) => { demoVoicesRef.current.add(note); soundOn(note, 70); });
      }, index * beatMs);
      const stopTimer = window.setTimeout(() => {
        resolved.notes.forEach((note) => { soundOff(note); demoVoicesRef.current.delete(note); });
      }, index * beatMs + beatMs * 0.78);
      demoTimersRef.current.push(startTimer, stopTimer);
    });
    const finishTimer = window.setTimeout(() => {
      setDemoStep(null);
      setIsPlayingProgression(false);
    }, selectedProgression.steps.length * beatMs);
    demoTimersRef.current.push(finishTimer);
  }, [cancelProgressionPlayback, ensureAudio, keyRoot, selectedProgression.steps, soundOff, soundOn, tempo]);

  const auditionRouteExercise = useCallback(() => {
    cancelProgressionPlayback();
    audioOnRef.current = true;
    setAudioOn(true);
    ensureAudio();
    const sequential = activeRoutePillar === "Técnica" || activeRoutePillar === "Lectura";
    const notes = activeRoutePillar === "Oído" ? earTargetNotes : activeRoutePillar === "Aplicación" ? currentRouteApplication.notes : routeTargetSequence;
    if (sequential) {
      notes.forEach((note, index) => {
        const start = window.setTimeout(() => { demoVoicesRef.current.add(note); soundOn(note, 72); }, index * 230);
        const stop = window.setTimeout(() => { soundOff(note); demoVoicesRef.current.delete(note); }, index * 230 + 180);
        demoTimersRef.current.push(start, stop);
      });
    } else {
      notes.forEach((note) => { demoVoicesRef.current.add(note); soundOn(note, 72); });
      const stop = window.setTimeout(() => notes.forEach((note) => { soundOff(note); demoVoicesRef.current.delete(note); }), 1000);
      demoTimersRef.current.push(stop);
    }
  }, [cancelProgressionPlayback, ensureAudio, activeRoutePillar, earTargetNotes, currentRouteApplication.notes, routeTargetSequence, soundOn, soundOff]);

  const playRouteProgression = useCallback(() => {
    cancelProgressionPlayback();
    audioOnRef.current = true;
    setAudioOn(true);
    ensureAudio();
    const beatMs = 60000 / currentLearningUnit.tempo;
    routeProgressionChords.forEach(({ notes }, index) => {
      const start = window.setTimeout(() => {
        setDemoStep(index);
        notes.forEach((note) => { demoVoicesRef.current.add(note); soundOn(note, 68); });
      }, index * beatMs);
      const stop = window.setTimeout(() => notes.forEach((note) => { soundOff(note); demoVoicesRef.current.delete(note); }), index * beatMs + beatMs * .76);
      demoTimersRef.current.push(start, stop);
    });
    const finish = window.setTimeout(() => setDemoStep(null), routeProgressionChords.length * beatMs);
    demoTimersRef.current.push(finish);
  }, [cancelProgressionPlayback, ensureAudio, currentLearningUnit.tempo, routeProgressionChords, soundOn, soundOff]);

  const playMetronomeClick = useCallback((accent = false) => {
    const context = ensureAudio();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = accent ? 1260 : 880;
    gain.gain.setValueAtTime(0.07, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.055);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.06);
  }, [ensureAudio]);

  const startRhythmTrainer = useCallback(() => {
    rhythmTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    rhythmTimersRef.current = [];
    resetRouteAttempt();
    setRhythmEvents([]);
    setRhythmRunning(false);
    const beatMs = 60000 / currentLearningUnit.tempo;
    Array.from({ length: 4 }, (_, index) => {
      const timer = window.setTimeout(() => {
        setRhythmCountdown(4 - index);
        playMetronomeClick(index === 0);
      }, index * beatMs);
      rhythmTimersRef.current.push(timer);
    });
    const start = window.setTimeout(() => {
      setRhythmCountdown(null);
      rhythmStartRef.current = performance.now();
      setRhythmRunning(true);
      playMetronomeClick(true);
    }, 4 * beatMs);
    rhythmTimersRef.current.push(start);
    for (let index = 1; index < 4; index += 1) {
      const click = window.setTimeout(() => playMetronomeClick(false), (4 + index) * beatMs);
      rhythmTimersRef.current.push(click);
    }
    setRouteFeedback(`Cuenta cuatro pulsos. Después toca la tónica con el patrón ${rhythmPattern.label}.`);
  }, [currentLearningUnit.tempo, playMetronomeClick, resetRouteAttempt, rhythmPattern.label]);

  const startDiagnostic = useCallback(() => {
    resetRouteAttempt();
    setDiagnosticStep(0);
    setRouteFeedback("Paso 1 de 3: encuentra y toca Do central (C4).");
  }, [resetRouteAttempt]);

  const skipDiagnostic = useCallback(() => {
    setDiagnosticStep(-1);
    setLearningProfile((profile) => ({ ...profile, diagnosticComplete: true, currentLevel: Math.max(1, profile.currentLevel) }));
  }, []);

  const exportProgress = useCallback(() => {
    const raw = localStorage.getItem(LEARNING_STORAGE_KEY);
    if (!raw) return;
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `acorde-progreso-${localDateKey()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, []);

  const importProgress = useCallback(async (file: File) => {
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as { version?: number; learning?: unknown };
      if (parsed.version !== 3 || !parsed.learning) throw new Error("Formato inválido");
      localStorage.setItem(LEARNING_STORAGE_KEY, raw);
      window.location.reload();
    } catch {
      setRouteFeedback("Ese archivo no corresponde a una copia válida de ACORDE 3.");
    }
  }, []);

  const registerRouteNote = useCallback((note: number, velocity: number) => {
    setMidiRange((range) => ({ min: Math.min(range.min, note), max: Math.max(range.max, note) }));
    if (calibrationStage !== "idle") {
      if (calibrationStage === "soft") {
        setCalibrationSamples([velocity]);
        setCalibrationStage("medium");
        setRouteFeedback("Ahora toca una nota con intensidad media.");
      } else if (calibrationStage === "medium") {
        setCalibrationSamples((samples) => [...samples, velocity]);
        setCalibrationStage("loud");
        setRouteFeedback("Por último, toca una nota fuerte pero cómoda.");
      } else {
        const [soft = 35, medium = 75] = calibrationSamples;
        setLearningProfile((profile) => ({ ...profile, velocityCalibration: { soft, medium, loud: velocity } }));
        setCalibrationStage("idle");
        setCalibrationSamples([]);
        setRouteFeedback("Curva de dinámica calibrada para tu Q49.");
      }
      return;
    }
    if (diagnosticStep === 0) {
      if (note === 60) {
        setDiagnosticStep(1);
        setRouteFeedback("Paso 2 de 3: toca el acorde Do mayor en cualquier inversión.");
      } else setRouteFeedback("Busca Do central: está inmediatamente a la izquierda del grupo de dos teclas negras más cercano al centro.");
      return;
    }
    if (diagnosticStep === 2) {
      const expected = [0, 2, 4, 5, 7, 9, 11, 0];
      setRoutePlayed((previous) => {
        if (mod(note) !== expected[previous.length]) {
          setRouteFeedback("La secuencia se desvió. Vuelve a comenzar desde Do.");
          return [];
        }
        const next = [...previous, note];
        if (next.length === expected.length) {
          setDiagnosticStep(3);
          setLearningProfile((profile) => ({ ...profile, diagnosticComplete: true, currentLevel: Math.max(3, profile.currentLevel) }));
          setRouteFeedback("Diagnóstico completo: comenzaremos en Fluidez. Puedes cambiar el nivel cuando quieras.");
        }
        return next;
      });
      return;
    }
    if (view !== "ruta" || routeAttemptDone) return;
    if (activeRoutePillar === "Ritmo" && rhythmRunning) {
      setRhythmEvents((events) => [...events, { note, at: performance.now(), velocity }].slice(0, rhythmPattern.offsets.length));
      return;
    }
    if (activeRoutePillar === "Técnica" || activeRoutePillar === "Lectura") {
      setRoutePlayed((played) => [...played, note]);
      setRouteVelocities((velocities) => [...velocities, velocity]);
    }
    if (activeRoutePillar === "Aplicación" && currentLearningLevel >= 4) {
      setRoutePlayed((played) => [...played, note].slice(0, 12));
      setRouteVelocities((velocities) => [...velocities, velocity].slice(0, 12));
    }
  }, [calibrationStage, calibrationSamples, diagnosticStep, view, routeAttemptDone, activeRoutePillar, rhythmRunning, rhythmPattern.offsets.length, currentLearningLevel]);

  const pressNote = useCallback((note: number, velocity = 90) => {
    sustainedRef.current.delete(note);
    setLastVelocity(velocity);
    setActiveNotes((previous) => new Set(previous).add(note));
    registerRouteNote(note, velocity);
    soundOn(note, velocity);
  }, [registerRouteNote, soundOn]);

  const releaseNote = useCallback((note: number) => {
    if (sustainOnRef.current) {
      sustainedRef.current.add(note);
      return;
    }
    setActiveNotes((previous) => { const next = new Set(previous); next.delete(note); return next; });
    soundOff(note);
  }, [soundOff]);

  const handleMidiMessage = useCallback((event: { data: Uint8Array }) => {
    const [statusByte, note, velocity] = event.data;
    const command = statusByte & 0xf0;
    if (command === 0x90 && velocity > 0) pressNote(note, velocity);
    if (command === 0x80 || (command === 0x90 && velocity === 0)) releaseNote(note);
    if (command === 0xb0 && note === 64) {
      sustainOnRef.current = velocity >= 64;
      setSustainDown(velocity >= 64);
      if (velocity < 64) {
        const sustained = [...sustainedRef.current];
        sustainedRef.current.clear();
        setActiveNotes((previous) => { const next = new Set(previous); sustained.forEach((held) => next.delete(held)); return next; });
        sustained.forEach(soundOff);
      }
    }
  }, [pressNote, releaseNote, soundOff]);

  const bindMidiInputs = useCallback((access: MidiAccessLike) => {
    const inputs = [...access.inputs.values()];
    inputs.forEach((input) => { input.onmidimessage = handleMidiMessage; });
    if (inputs.length) {
      setDeviceName(inputs[0].name || inputs[0].manufacturer || "Teclado MIDI");
      setMidiState("connected");
    } else {
      setDeviceName("Conecta el Q49 por USB");
      setMidiState("waiting");
    }
  }, [handleMidiMessage]);

  const connectMidi = useCallback(async () => {
    const requestMidi = (navigator as Navigator & { requestMIDIAccess?: () => Promise<MidiAccessLike> }).requestMIDIAccess;
    if (!requestMidi) { setMidiState("unsupported"); setShowMidiHelp(true); return; }
    setMidiState("connecting");
    ensureAudio();
    try {
      const access = await requestMidi.call(navigator);
      midiAccessRef.current = access;
      bindMidiInputs(access);
      access.onstatechange = () => bindMidiInputs(access);
    } catch {
      setMidiState("error");
      setShowMidiHelp(true);
    }
  }, [bindMidiInputs, ensureAudio]);

  useEffect(() => () => {
    midiAccessRef.current?.inputs.forEach((input) => { input.onmidimessage = null; });
    demoTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    rhythmTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    if (progressionAdvanceTimerRef.current) window.clearTimeout(progressionAdvanceTimerRef.current);
    voicesRef.current.forEach(({ oscillators }) => oscillators.forEach((oscillator) => oscillator.stop()));
    void audioContextRef.current?.close();
  }, []);

  const chooseDiatonic = (note: string, chord: ChordDefinition) => {
    const pc = rootPcFromName(note);
    const optionIndex = ROOTS.findIndex((option) => option.pc === pc);
    if (optionIndex >= 0) setRootIndex(optionIndex);
    setSelectedChordId(chord.id);
  };

  const changeTonality = (index: number) => {
    setKeyRootIndex(index);
    setRootIndex(index);
    setProgressionStep(0);
    setRoundComplete(false);
    setProgressionSessionActive(false);
  };

  const chooseProgression = (id: string) => {
    cancelProgressionPlayback();
    setProgressionId(id);
    setProgressionStep(0);
    setRoundComplete(false);
    setProgressionSessionActive(false);
  };

  const startProgressionRound = () => {
    cancelProgressionPlayback();
    if (progressionAdvanceTimerRef.current) window.clearTimeout(progressionAdvanceTimerRef.current);
    setProgressionStep(0);
    setRoundChecks(Array(selectedProgression.steps.length).fill(false));
    setRoundComplete(false);
    setProgressionSessionActive(true);
    progressionSolvedRef.current = false;
  };

  const feedbackLabel = !activeNotes.size ? "Listo para escucharte" : isCorrect ? "¡Acorde completo!" : extraPcs.length ? "Hay una nota fuera del acorde" : `Faltan ${missingPcs.length} ${missingPcs.length === 1 ? "nota" : "notas"}`;

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setView("ruta")} aria-label="Ir a la ruta de aprendizaje">
          <span className="brand-mark">A</span><span>ACORDE</span>
        </button>
        <nav className="main-nav" aria-label="Secciones">
          <button className={view === "ruta" ? "active" : ""} onClick={() => setView("ruta")}>Ruta</button>
          <button className={view === "practica" ? "active" : ""} onClick={() => setView("practica")}>Práctica</button>
          <button className={view === "progresiones" ? "active" : ""} onClick={() => setView("progresiones")}>Progresiones</button>
          <button className={view === "teoria" ? "active" : ""} onClick={() => setView("teoria")}>Teoría</button>
        </nav>
        <div className="header-actions">
          <button className={`sound-toggle ${audioOn ? "on" : ""}`} onClick={() => setAudioOn((value) => !value)} aria-pressed={audioOn}>
            <span>{audioOn ? "◖))" : "◖×"}</span> Sonido
          </button>
          <label className="sound-variant">
            <span>TIMBRE</span>
            <select value={soundVariant} onChange={(event) => { const variant = event.target.value as SoundVariant; soundVariantRef.current = variant; audioOnRef.current = true; setSoundVariant(variant); setAudioOn(true); }} aria-label="Seleccionar timbre de sonido">
              <option value="piano">Piano cálido</option>
              <option value="electrico">Piano eléctrico</option>
              <option value="organo">Órgano</option>
            </select>
          </label>
          <button className={`midi-button ${midiState}`} onClick={connectMidi}>
            <span className="midi-dot" />
            {midiState === "connected" ? deviceName : midiState === "connecting" ? "Conectando…" : midiState === "waiting" ? "Esperando MIDI" : "Conectar MIDI"}
          </button>
        </div>
      </header>

      <section className="live-monitor" aria-live="polite">
        <div className="monitor-label"><span className={activeNotes.size ? "pulse active" : "pulse"} /> EN VIVO</div>
        <div className="monitor-reading"><strong>{harmony.title}</strong><span>{harmony.detail}</span></div>
        <div className="played-notes">
          {[...activeNotes].sort((a, b) => a - b).slice(0, 8).map((note) => <span key={note}>{midiLabel(note)}</span>)}
          {!activeNotes.size && <small>Las notas que toques aparecerán aquí</small>}
        </div>
        <div className="velocity"><span>VELOCIDAD</span><div><i style={{ width: `${lastVelocity / 1.27}%` }} /></div><b>{lastVelocity}</b></div>
      </section>

      <section className="context-bar">
        <div className="context-title"><p className="eyebrow">CENTRO DE PRÁCTICA</p><h1>{view === "ruta" ? "Tu próxima habilidad empieza aquí." : view === "practica" ? "Del concepto al teclado." : view === "progresiones" ? "Aprende a moverte entre acordes." : "Entiende lo que estás tocando."}</h1></div>
        <div className="tonality-controls">
          <label><span>TONALIDAD</span><select value={keyRootIndex} onChange={(event) => changeTonality(Number(event.target.value))}>{ROOTS.map((option, index) => <option key={option.name} value={index}>{option.name}</option>)}</select></label>
          <div className="mode-toggle" aria-label="Modo de la tonalidad"><button className={mode === "mayor" ? "active" : ""} onClick={() => setMode("mayor")}>Mayor</button><button className={mode === "menor" ? "active" : ""} onClick={() => setMode("menor")}>Menor</button></div>
        </div>
        <div className="session-stats"><div><b>{view === "ruta" ? `${learningProgressPercent}%` : view === "progresiones" ? todayData.rounds : correctCount}</b><span>{view === "ruta" ? "SESIÓN HOY" : view === "progresiones" ? "VUELTAS HOY" : "ACORDES"}</span></div><div><b>{view === "ruta" ? currentLearningLevel : view === "progresiones" ? practiceStreak : streak}</b><span>{view === "ruta" ? "NIVEL" : view === "progresiones" ? "DÍAS" : "RACHA"}</span></div></div>
      </section>

      {view === "ruta" ? (
        <section className="route-page">
          <section className="route-hero">
            <div>
              <p className="eyebrow coral">ACORDE 3 · PIANO MODERNO</p>
              <h2>Una sesión corta.<br />Cinco habilidades conectadas.</h2>
              <p>La ruta mezcla técnica, ritmo, oído, lectura y aplicación. Cada bloque que completas ajusta lo que volverá a aparecer.</p>
              <div className="session-length" aria-label="Duración de la sesión">
                {([10, 20, 30] as const).map((minutes) => <button className={learningProfile.sessionMinutes === minutes ? "active" : ""} key={minutes} onClick={() => setLearningProfile((profile) => ({ ...profile, sessionMinutes: minutes }))}>{minutes}<small>min</small></button>)}
              </div>
              <button className="route-primary" onClick={startLearningSession}>{todayLearningSession?.completed ? "Repasar la ruta de hoy" : todayLearningSession ? "Continuar sesión" : "Comenzar sesión de hoy"} →</button>
            </div>
            <div className="route-overview">
              <div className="route-progress-ring" style={{ "--route-progress": `${learningProgressPercent * 3.6}deg` } as React.CSSProperties}><span><strong>{learningCompletedToday}</strong><small>de {learningUnitIds.length}</small></span></div>
              <div><span>HOY · {learningProfile.sessionMinutes} MIN</span><strong>{todayLearningSession?.completed ? "Sesión completa" : `${learningUnitIds.length - learningCompletedToday} bloques pendientes`}</strong><p>{dueReviews ? `${dueReviews} repaso${dueReviews === 1 ? "" : "s"} prioritario${dueReviews === 1 ? "" : "s"}.` : "Sin repasos atrasados."}</p></div>
            </div>
            {!learningProfile.diagnosticComplete && (
              <div className="diagnostic-card">
                <span>DIAGNÓSTICO OPCIONAL · 2 MIN</span><strong>Empieza en el punto correcto.</strong><p>Tres pruebas MIDI: Do central, una tríada y una escala.</p>
                <div><button onClick={startDiagnostic}>Hacer diagnóstico</button><button onClick={skipDiagnostic}>Empezar desde cero</button></div>
              </div>
            )}
          </section>

          <div className="route-layout">
            <aside className="route-sidebar">
              <p className="eyebrow">MAPA DE APRENDIZAJE</p>
              <h3>Cinco etapas, una misma música.</h3>
              <div className="level-map">
                {LEVELS.map((item) => {
                  const levelUnits = unitsForLevel(item.level);
                  const complete = levelUnits.filter((unit) => ["aprobado", "dominado"].includes(mastery[unit.id]?.status ?? "")).length;
                  return <button className={currentLearningLevel === item.level ? "active" : ""} key={item.level} onClick={() => { setLearningSessionActive(false); setLearningProfile((profile) => ({ ...profile, currentLevel: item.level })); setRoutePillar("Técnica"); }}><span>0{item.level}</span><div><strong>{item.name}</strong><small>{item.caption}</small><i>{complete}/{levelUnits.length}</i></div></button>;
                })}
              </div>
              <div className="route-data-tools">
                <span>PROGRESO LOCAL</span><p>{learningDays} días completos · {masteredUnits} habilidades dominadas</p>
                <div><button onClick={exportProgress}>Exportar</button><button onClick={() => importProgressRef.current?.click()}>Importar</button></div>
                <input ref={importProgressRef} hidden type="file" accept="application/json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importProgress(file); }} />
              </div>
            </aside>

            <div className="route-content">
              <div className="daily-blocks" aria-label="Bloques de la sesión">
                {learningUnitIds.map((unitId, index) => {
                  const unit = CURRICULUM.find((item) => item.id === unitId) ?? CURRICULUM[0];
                  const checked = todayLearningSession?.completedUnitIds?.includes(unit.id);
                  const current = learningSessionActive && index === learningSessionIndex;
                  return <button className={`${checked ? "checked" : ""} ${current ? "current" : ""}`} key={unit.id} onClick={() => { setLearningSessionActive(true); setLearningSessionIndex(index); resetRouteAttempt(); }}><span>{checked ? "✓" : String(index + 1).padStart(2, "0")}</span><strong>{unit.pillar}</strong><small>{unit.title}</small></button>;
                })}
              </div>

              <section className="route-trainer">
                <div className="route-trainer-head">
                  <div><span className="pillar-badge">{PILLARS.find((item) => item.name === activeRoutePillar)?.symbol}</span><div><p className="eyebrow coral">NIVEL {currentLearningLevel} · {activeRoutePillar.toUpperCase()}</p><h2>{diagnosticStep >= 0 ? "Diagnóstico MIDI" : currentLearningUnit.title}</h2><p>{diagnosticStep >= 0 ? "Una comprobación breve para ajustar el punto de partida." : currentLearningUnit.summary}</p></div></div>
                  <div className="trainer-metrics"><span>{currentLearningUnit.tempo}<small>BPM</small></span><span>{mastery[currentLearningUnit.id]?.bestAccuracy ?? 0}%<small>MEJOR</small></span><span className={sustainDown ? "pedal-on" : ""}>{sustainDown ? "ON" : "OFF"}<small>PEDAL</small></span></div>
                </div>

                {diagnosticStep >= 0 ? (
                  <div className="diagnostic-stage">
                    <div className="diagnostic-steps">{[0, 1, 2].map((step) => <i className={diagnosticStep > step ? "done" : diagnosticStep === step ? "active" : ""} key={step}>{diagnosticStep > step ? "✓" : step + 1}</i>)}</div>
                    <strong>{diagnosticStep === 0 ? "Toca Do central (C4)" : diagnosticStep === 1 ? "Construye Do mayor" : diagnosticStep === 2 ? "Toca la escala de Do ascendente" : "Diagnóstico completo"}</strong>
                    <p>{routeFeedback}</p>
                    {diagnosticStep === 3 && <button onClick={() => { setDiagnosticStep(-1); startLearningSession(); }}>Abrir mi ruta →</button>}
                  </div>
                ) : (
                  <>
                    <div className="exercise-stage">
                      <div className="exercise-copy"><span>OBJETIVO</span><strong>{currentLearningUnit.objective}</strong><p>{currentLearningUnit.fingering ?? "La app mide notas, tiempo, velocidad y pedal; la postura y los dedos se muestran como guía."}</p></div>
                      {activeRoutePillar === "Técnica" && <div className="sequence-rail">{routeTargetSequence.map((note, index) => <i className={routePlayed[index] !== undefined ? (mod(routePlayed[index]) === mod(note) ? "played" : "wrong") : ""} key={`${note}-${index}`}>{NOTE_NAMES[mod(note)]}</i>)}</div>}
                      {activeRoutePillar === "Ritmo" && <div className="rhythm-stage"><div className={rhythmRunning ? "pulse-orbit active" : "pulse-orbit"}>{rhythmCountdown ?? (rhythmRunning ? `${rhythmEvents.length}/${rhythmPattern.offsets.length}` : "♪")}</div><div><strong>{rhythmPattern.label} · {currentLearningUnit.tempo} BPM</strong><p>Toca {keyRoot.name} siguiendo el patrón después de la cuenta de cuatro.</p><button onClick={startRhythmTrainer}>{rhythmRunning || rhythmCountdown ? "Contando…" : "Iniciar metrónomo"}</button></div></div>}
                      {activeRoutePillar === "Oído" && <div className="ear-stage"><span>?</span><div><strong>Escucha y reconstruye el acorde</strong><p>Encuentra la raíz y completa el color sin mirar la respuesta.</p><button onClick={auditionRouteExercise}>▶ Escuchar</button><button onClick={() => { setRouteUsedHelp(true); setRouteFeedback(`Ayuda: toca ${spellChord(keyRoot.name, earChord).join(" · ")}.`); }}>Mostrar pista</button></div></div>}
                      {activeRoutePillar === "Lectura" && <div className="reading-stage">{currentLearningLevel >= 2 && <div className="lead-sheet-chords">{routeProgressionChords.slice(0, 4).map(({ name, chord }, index) => <span key={`${name}-${index}`}>{name}{chord.suffix || ""}</span>)}</div>}<MusicStaff notes={READING_NOTES} title="Frase de lectura" /><div className="reading-progress">{routePlayed.map((note, index) => <span className={note === READING_MIDI[index] ? "correct" : "wrong"} key={`${note}-${index}`}>{midiLabel(note)}</span>)}</div></div>}
                      {activeRoutePillar === "Aplicación" && <div className="application-stage"><div className="application-steps">{routeProgressionChords.map(({ step, name, chord }, index) => <div className={currentLearningLevel >= 4 ? (demoStep === index ? "sounding" : "") : index < routeApplicationStep ? "done" : index === routeApplicationStep ? "active" : ""} key={`${step.numeral}-${index}`}><span>{currentLearningLevel < 4 && index < routeApplicationStep ? "✓" : step.numeral}</span><strong>{name}{chord.suffix}</strong><small>{step.function}</small></div>)}</div>{currentLearningLevel >= 4 ? <><p>Escucha la vuelta e improvisa 12 notas. Busca al menos cuatro alturas distintas y aterriza dentro de la escala de {keyRoot.name} {mode}.</p><button onClick={playRouteProgression}>▶ Escuchar vuelta · {routePlayed.length}/12 notas</button></> : <><p>{currentLearningLevel === 3 ? "Modo voicing: se evalúan las notas y el registro exacto para entrenar conducción de voces." : "Puedes completar cada acorde en cualquier inversión u octava."}</p><button onClick={auditionRouteExercise}>♪ Escuchar acorde actual</button></>}</div>}
                    </div>

                    <div className="keyboard-heading"><div><span className="keyboard-dot" /> <strong>{midiState === "connected" ? deviceName : "Teclado de la ruta"}</strong><small>Ventana MIDI {midiLabel(routeKeyboardStart)}–{midiLabel(routeKeyboardStart + 48)} · sigue los botones de octava</small></div><div className="legend"><span><i className="target" /> Objetivo</span><span><i className="played" /> Tocando</span><span><i className="wrong" /> Fuera</span></div></div>
                    <PianoKeyboard targetNotes={routeKeyboardTargets} activeNotes={activeNotes} noteNames={new Map(routeKeyboardTargets.map((note) => [mod(note), NOTE_NAMES[mod(note)]]))} onDown={pressNote} onUp={releaseNote} rangeStart={routeKeyboardStart} />

                    <div className={`route-feedback ${routeAttemptDone ? routePassed ? "success" : "warning" : ""}`}><span>{routeAttemptDone ? routePassed ? "✓" : "↗" : "●"}</span><div><strong>{routeFeedback}</strong><small>{routeSequenceScore && !routeAttemptDone ? `${routeSequenceScore}% de la secuencia coincide.` : learningProfile.velocityCalibration ? `Dinámica calibrada: ${learningProfile.velocityCalibration.soft}/${learningProfile.velocityCalibration.medium}/${learningProfile.velocityCalibration.loud}.` : "Puedes calibrar la dinámica para adaptar la respuesta a tu toque."}</small></div><div>{routeAttemptDone && <button onClick={routePassed && learningSessionActive ? advanceLearningSession : resetRouteAttempt}>{routePassed && learningSessionActive ? "Siguiente bloque →" : "Reintentar"}</button>}</div></div>
                  </>
                )}
              </section>

              <section className="free-labs">
                <div><p className="eyebrow">PRÁCTICA LIBRE</p><h3>Entrena una habilidad sin salir de tu ruta.</h3></div>
                <div>{pillarScores.map((pillar) => <button className={routePillar === pillar.name && !learningSessionActive ? "active" : ""} key={pillar.name} onClick={() => { setLearningSessionActive(false); setRoutePillar(pillar.name); resetRouteAttempt(); }}><span>{pillar.symbol}</span><strong>{pillar.name}</strong><small>{pillar.score}% precisión · {pillar.mastered}/5 dominadas</small></button>)}</div>
              </section>

              <section className="expression-card">
                <div><p className="eyebrow coral">EXPRESIÓN · Q49</p><h3>Haz que la velocidad signifique algo.</h3><p>Calibra tres intensidades para que los ejercicios de dinámica se adapten a tu teclado y a tu toque.</p></div>
                <div className="velocity-calibration"><span className={calibrationStage !== "idle" ? "active" : ""}>{calibrationStage === "idle" ? "LISTO" : calibrationStage.toUpperCase()}</span><button onClick={() => { setCalibrationSamples([]); setCalibrationStage("soft"); setRouteFeedback("Toca una nota muy suave, pero que responda con claridad."); }}>Calibrar dinámica</button></div>
              </section>
            </div>
          </div>
        </section>
      ) : view === "practica" ? (
        <>
          <section className="diatonic-section">
            <div className="section-heading"><div><span className="section-number">01</span><div><p className="eyebrow">FAMILIA DE LA TONALIDAD</p><h2>Acordes diatónicos de {keyRoot.name} {mode}</h2></div></div><p>Construidos solo con notas de la escala: <strong>{scaleNames.join(" · ")}</strong></p></div>
            <div className="degree-row">
              {diatonicChords.map(({ note, degree, chord }) => (
                <button key={`${degree}-${note}`} onClick={() => chooseDiatonic(note, chord)} className={rootPcFromName(note) === root.pc && selectedChord.id === chord.id ? "active" : ""}>
                  <span>{degree}</span><strong>{note}{chord.suffix}</strong><small>{chord.name}</small>
                </button>
              ))}
            </div>
          </section>

          <div className="practice-grid">
            <aside className="chord-library">
              <div className="section-heading compact"><div><span className="section-number">02</span><div><p className="eyebrow">DICCIONARIO</p><h2>Elige un acorde</h2></div></div></div>
              <div className="category-tabs">{CATEGORY_FILTERS.map((filter) => <button className={category === filter ? "active" : ""} onClick={() => setCategory(filter)} key={filter}>{filter}</button>)}</div>
              <div className="chord-list">
                {filteredChords.map((chord) => (
                  <button className={selectedChord.id === chord.id ? "active" : ""} key={chord.id} onClick={() => setSelectedChordId(chord.id)}>
                    <span className="chord-symbol">{root.name}<b>{chord.suffix}</b></span><span><strong>{chord.name}</strong><small>{chord.formula.join(" · ")}</small></span><i>→</i>
                  </button>
                ))}
              </div>
            </aside>

            <section className="chord-workbench">
              <div className="workbench-top">
                <div className="chord-identity"><p className="eyebrow coral">ACORDE OBJETIVO</p><h2>{root.name}<span>{selectedChord.suffix}</span></h2><p>{selectedChord.name}</p></div>
                <div className="formula-block"><span>FÓRMULA</span><strong>{selectedChord.formula.join(" · ")}</strong><small>{selectedChord.intervals.join(" – ")} semitonos</small></div>
                <div className="status-badge"><span className={isCorrect ? "check correct" : "check"}>{isCorrect ? "✓" : "○"}</span><div><small>ESTADO</small><strong>{feedbackLabel}</strong></div></div>
              </div>

              <div className="notes-and-inversions">
                <div><span className="control-label">NOTAS</span><div className="note-pills">{spelledNotes.map((note, index) => <div className={activePitchClasses.includes(mod(root.pc + selectedChord.intervals[index])) ? "played" : ""} key={`${note}-${index}`}><strong>{note}</strong><span>{noteToSolfege(note)}</span><small>{selectedChord.formula[index]}</small></div>)}</div></div>
                <div className="inversion-control"><span className="control-label">POSICIÓN</span><div>{selectedChord.intervals.map((_, index) => <button className={inversion === index ? "active" : ""} key={index} onClick={() => setInversion(index)}>{inversionName(index, selectedChord.intervals.length)}</button>)}</div></div>
              </div>

              <div className="keyboard-heading"><div><span className="keyboard-dot" /> <strong>{midiState === "connected" ? deviceName : "Teclado de práctica"}</strong><small>49 teclas · C2–C6</small></div><div className="legend"><span><i className="target" /> Objetivo</span><span><i className="played" /> Tocando</span><span><i className="wrong" /> Fuera</span></div></div>
              <PianoKeyboard targetNotes={targetNotes} activeNotes={activeNotes} noteNames={noteNameMap} onDown={pressNote} onUp={releaseNote} />

              <div className="coach-row">
                <div className="coach-card"><span>CONSEJO</span><p>{selectedChord.explanation}</p></div>
                <div className={`practice-feedback ${isCorrect ? "success" : extraPcs.length ? "warning" : ""}`}>
                  <span>{isCorrect ? "✓" : activeNotes.size ? "↗" : "♪"}</span><div><strong>{feedbackLabel}</strong><small>{!activeNotes.size ? `Toca ${spelledNotes.join(" – ")} en cualquier octava` : extraPcs.length ? `Revisa: ${extraPcs.map((pc) => NOTE_NAMES[pc]).join(", ")}` : missingPcs.length ? `Busca: ${missingPcs.map((pc) => noteNameMap.get(pc) ?? NOTE_NAMES[pc]).join(", ")}` : "Muy bien. Suelta y repite para fijarlo."}</small></div>
                </div>
              </div>
            </section>
          </div>
        </>
      ) : view === "progresiones" ? (
        <section className="progressions-page">
          <div className="progression-picker">
            <div className="picker-intro">
              <div><span className="section-number">01</span><div><p className="eyebrow">NIVEL DE LA SESIÓN</p><h2>Elige cuánto color quieres.</h2></div></div>
              <p>La dificultad cambia tanto la longitud de la vuelta como el vocabulario: tríadas, séptimas o extensiones.</p>
            </div>
            <div className="difficulty-switch" aria-label="Dificultad de las progresiones">
              {(["Inicial", "Intermedio", "Avanzado"] as Difficulty[]).map((level, index) => <button className={difficulty === level ? "active" : ""} key={level} onClick={() => setDifficulty(level)}><span>0{index + 1}</span><strong>{level}</strong><small>{index === 0 ? "Tríadas" : index === 1 ? "Séptimas" : "Extensiones"}</small></button>)}
            </div>
            <div className="progression-options">
              {filteredProgressions.map((progression) => (
                <button className={selectedProgression.id === progression.id ? "active" : ""} key={progression.id} onClick={() => chooseProgression(progression.id)}>
                  <span className="progression-style">{progression.style}</span>
                  <strong>{progression.name}</strong>
                  <div>{progression.steps.map((step, index) => <span key={`${step.numeral}-${index}`}>{step.numeral}</span>)}</div>
                  <small>{progression.description}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="progression-practice-grid">
            <aside className="daily-panel">
              <p className="eyebrow coral">PRÁCTICA DIARIA</p>
              <h2>{todayProgressionRounds >= dailyGoal ? "Meta cumplida." : "Una vuelta a la vez."}</h2>
              <p>Completa la progresión en orden. Cada acorde correcto recibe un check; la vuelta se guarda al completar el último.</p>
              <div className="daily-goal">
                <div><span>META DE HOY</span><div><button onClick={() => setDailyGoal((goal) => Math.max(1, goal - 1))}>−</button><strong>{dailyGoal}</strong><button onClick={() => setDailyGoal((goal) => Math.min(8, goal + 1))}>+</button></div></div>
                <div className="goal-dots">{Array.from({ length: dailyGoal }, (_, index) => <i className={index < todayProgressionRounds ? "done" : ""} key={index}>{index < todayProgressionRounds ? "✓" : index + 1}</i>)}</div>
                <small>{todayProgressionRounds} de {dailyGoal} vueltas de “{selectedProgression.name}”</small>
              </div>
              <div className="history-summary">
                <div><strong>{history.totalRounds}</strong><span>VUELTAS TOTALES</span></div><div><strong>{learnedCount}</strong><span>ACORDES VISTOS</span></div><div><strong>{practiceStreak}</strong><span>DÍAS SEGUIDOS</span></div>
              </div>
              <div className="week-track"><span>ÚLTIMOS 7 DÍAS</span><div>{lastSevenDays.map((day) => <div key={day.key}><i className={day.rounds ? "practiced" : ""} style={{ opacity: day.rounds ? Math.min(1, .35 + day.rounds * .18) : 1 }}>{day.rounds || "·"}</i><small>{day.label}</small></div>)}</div></div>
              <p className="storage-note"><span>⌁</span> Tu avance se guarda automáticamente en este dispositivo.</p>
            </aside>

            <section className="progression-trainer">
              <div className="trainer-heading">
                <div><p className="eyebrow coral">{difficulty.toUpperCase()} · {keyRoot.name} {mode.toUpperCase()}</p><h2>{selectedProgression.name}</h2><p>{selectedProgression.description}</p></div>
                <div className="listen-controls">
                  <button className={isPlayingProgression ? "playing" : ""} onClick={isPlayingProgression ? cancelProgressionPlayback : playProgression}>{isPlayingProgression ? "■ Detener" : "▶ Escuchar vuelta"}</button>
                  <label><span>TEMPO · {tempo} BPM</span><input type="range" min="50" max="140" step="2" value={tempo} onChange={(event) => setTempo(Number(event.target.value))} /></label>
                </div>
              </div>

              <div className="progression-track" style={{ gridTemplateColumns: `repeat(${selectedProgression.steps.length}, minmax(105px, 1fr))` }}>
                {progressionChords.map(({ step, name, chord }, index) => (
                  <div className={`${progressionStep === index && progressionSessionActive ? "current" : ""} ${roundChecks[index] ? "checked" : ""} ${demoStep === index ? "sounding" : ""}`} key={`${step.numeral}-${index}`}>
                    <div className="step-top"><span>{String(index + 1).padStart(2, "0")}</span><i>{roundChecks[index] ? "✓" : progressionStep === index && progressionSessionActive ? "●" : "○"}</i></div>
                    <small>{step.numeral}</small><strong>{name}<b>{chord.suffix}</b></strong><p>{step.function}</p>
                    <button onClick={() => auditionProgressionStep(index)} aria-label={`Escuchar ${name}${chord.suffix}`}>♪</button>
                  </div>
                ))}
              </div>

              {roundComplete ? (
                <div className="round-complete">
                  <span>✓</span><div><small>VUELTA COMPLETA</small><strong>La progresión ya está en tu historial de hoy.</strong><p>{selectedProgression.steps.length} acordes · {keyRoot.name} {mode} · {difficulty}</p></div><button onClick={startProgressionRound}>Hacer otra vuelta →</button>
                </div>
              ) : (
                <div className={`current-target ${progressionSessionActive ? "active" : ""}`}>
                  <div className="target-count"><span>{progressionSessionActive ? `ACORDE ${progressionStep + 1} DE ${selectedProgression.steps.length}` : "LISTO PARA PRACTICAR"}</span><strong>{currentProgressionStep.numeral}</strong></div>
                  <div className="target-chord"><span>TOCA AHORA</span><strong>{root.name}<b>{selectedChord.suffix}</b></strong><small>{currentProgressionStep.function}</small></div>
                  <div className="target-notes"><span>NOTAS</span><div>{spelledNotes.map((note, index) => <i className={activePitchClasses.includes(mod(root.pc + selectedChord.intervals[index])) ? "played" : ""} key={`${note}-${index}`}>{note}</i>)}</div></div>
                  <div className="target-action">{progressionSessionActive ? <div className={isCorrect ? "ready correct" : "ready"}><i>{isCorrect ? "✓" : "●"}</i><span>{feedbackLabel}</span></div> : <button onClick={startProgressionRound}>Comenzar vuelta →</button>}</div>
                </div>
              )}

              <div className="keyboard-heading"><div><span className="keyboard-dot" /> <strong>{midiState === "connected" ? deviceName : "Teclado de progresiones"}</strong><small>Completa cada acorde en cualquier inversión u octava</small></div><div className="legend"><span><i className="target" /> Objetivo</span><span><i className="played" /> Tocando</span><span><i className="wrong" /> Fuera</span></div></div>
              <PianoKeyboard targetNotes={targetNotes} activeNotes={activeNotes} noteNames={noteNameMap} onDown={pressNote} onUp={releaseNote} />
              <div className="trainer-tip"><span>POR QUÉ FUNCIONA</span><p>{selectedChord.explanation}</p><button onClick={() => auditionProgressionStep(progressionStep)}>♪ Escuchar este acorde</button></div>
            </section>
          </div>
        </section>
      ) : (
        <section className="theory-layout">
          <aside className="lesson-index">
            <p className="eyebrow">RUTA DE TEORÍA</p>
            <h2>De intervalos a armonía</h2>
            <p>Seis ideas para construir cualquier acorde sin depender de una forma memorizada.</p>
            <div>{THEORY_LESSONS.map((item, index) => <button className={lesson === index ? "active" : ""} key={item.n} onClick={() => setLesson(index)}><span>{item.n}</span><div><small>{item.kicker}</small><strong>{item.title}</strong></div><i>→</i></button>)}</div>
          </aside>
          <section className="lesson-stage">
            <TheoryLesson lesson={lesson} rootName={root.name} chord={selectedChord} spelledNotes={spelledNotes} mode={mode} />
            <div className="lesson-footer"><button disabled={lesson === 0} onClick={() => setLesson((value) => Math.max(0, value - 1))}>← Anterior</button><span>{lesson + 1} / {THEORY_LESSONS.length}</span><button disabled={lesson === THEORY_LESSONS.length - 1} onClick={() => setLesson((value) => Math.min(THEORY_LESSONS.length - 1, value + 1))}>Siguiente →</button></div>
          </section>
          <aside className="theory-lab"><p className="eyebrow coral">LABORATORIO</p><h3>Prueba la idea</h3><p>El acorde del laboratorio sigue sincronizado con Práctica.</p><div className="lab-chord"><span>{root.name}<b>{selectedChord.suffix}</b></span><small>{selectedChord.name}</small></div><div className="lab-formula">{selectedChord.formula.map((degree, index) => <div key={`${degree}-${index}`}><b>{spelledNotes[index]}</b><span>{degree}</span></div>)}</div><button onClick={() => setView("practica")}>Abrir en el teclado →</button></aside>
        </section>
      )}

      <footer><span>ACORDE 3 · Ruta de piano moderno</span><p>Tu aprendizaje se guarda localmente. Web MIDI funciona mejor en Chrome o Edge.</p><button onClick={() => setShowMidiHelp(true)}>Ayuda MIDI</button></footer>

      {showMidiHelp && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowMidiHelp(false)}>
          <section className="midi-modal" role="dialog" aria-modal="true" aria-labelledby="midi-help-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowMidiHelp(false)} aria-label="Cerrar">×</button>
            <p className="eyebrow coral">ALESIS Q49 · CONEXIÓN</p><h2 id="midi-help-title">Tres pasos y estás tocando.</h2>
            <ol><li><span>1</span><div><strong>Conecta el Q49 por USB</strong><p>Enciéndelo antes de abrir la conexión MIDI.</p></div></li><li><span>2</span><div><strong>Usa Chrome o Edge</strong><p>Web MIDI requiere un navegador compatible y una página segura.</p></div></li><li><span>3</span><div><strong>Permite el acceso</strong><p>Haz clic en Conectar MIDI y acepta el permiso del navegador.</p></div></li></ol>
            {midiState === "unsupported" && <p className="modal-warning">Este navegador no ofrece Web MIDI. Abre la app en Chrome o Edge de escritorio.</p>}
            {midiState === "error" && <p className="modal-warning">No se concedió acceso. Revisa el permiso MIDI junto a la dirección del sitio y vuelve a intentarlo.</p>}
            <button className="primary-action" onClick={() => { setShowMidiHelp(false); void connectMidi(); }}>Conectar ahora</button>
          </section>
        </div>
      )}
    </main>
  );
}
