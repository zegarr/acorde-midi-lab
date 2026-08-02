"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

function PianoKeyboard({ targetNotes, activeNotes, noteNames, onDown, onUp }: {
  targetNotes: number[];
  activeNotes: Set<number>;
  noteNames: Map<number, string>;
  onDown: (note: number) => void;
  onUp: (note: number) => void;
}) {
  const allNotes = useMemo(() => Array.from({ length: 49 }, (_, index) => index + 36), []);
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
  const [view, setView] = useState<"practica" | "teoria">("practica");
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
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lesson, setLesson] = useState(0);
  const [showMidiHelp, setShowMidiHelp] = useState(false);

  const midiAccessRef = useRef<MidiAccessLike | null>(null);
  const sustainedRef = useRef(new Set<number>());
  const sustainOnRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const voicesRef = useRef(new Map<number, { oscillator: OscillatorNode; gain: GainNode }>());
  const audioOnRef = useRef(audioOn);
  const solvedRef = useRef(false);

  const root = ROOTS[rootIndex];
  const selectedChord = CHORDS.find((chord) => chord.id === selectedChordId) ?? CHORDS[0];
  const spelledNotes = useMemo(() => spellChord(root.name, selectedChord), [root.name, selectedChord]);
  const scaleIntervals = mode === "mayor" ? MAJOR_SCALE : MINOR_SCALE;
  const scaleNames = useMemo(() => spellScale(root.name, scaleIntervals), [root.name, scaleIntervals]);

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

  useEffect(() => { audioOnRef.current = audioOn; }, [audioOn]);
  useEffect(() => { setInversion(0); solvedRef.current = false; }, [selectedChordId, rootIndex]);
  useEffect(() => {
    if (isCorrect && !solvedRef.current) {
      solvedRef.current = true;
      setCorrectCount((count) => count + 1);
      setStreak((count) => count + 1);
    }
    if (activeNotes.size === 0) solvedRef.current = false;
  }, [isCorrect, activeNotes.size]);

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
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = 440 * 2 ** ((note - 69) / 12);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.018, velocity / 1270), context.currentTime + 0.018);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    voicesRef.current.set(note, { oscillator, gain });
  }, [ensureAudio]);

  const soundOff = useCallback((note: number) => {
    const voice = voicesRef.current.get(note);
    const context = audioContextRef.current;
    if (!voice || !context) return;
    voice.gain.gain.cancelScheduledValues(context.currentTime);
    voice.gain.gain.setValueAtTime(Math.max(voice.gain.gain.value, 0.0001), context.currentTime);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.14);
    voice.oscillator.stop(context.currentTime + 0.16);
    voicesRef.current.delete(note);
  }, []);

  const pressNote = useCallback((note: number, velocity = 90) => {
    sustainedRef.current.delete(note);
    setLastVelocity(velocity);
    setActiveNotes((previous) => new Set(previous).add(note));
    soundOn(note, velocity);
  }, [soundOn]);

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
    voicesRef.current.forEach(({ oscillator }) => oscillator.stop());
    void audioContextRef.current?.close();
  }, []);

  const chooseDiatonic = (note: string, chord: ChordDefinition) => {
    const pc = rootPcFromName(note);
    const optionIndex = ROOTS.findIndex((option) => option.pc === pc);
    if (optionIndex >= 0) setRootIndex(optionIndex);
    setSelectedChordId(chord.id);
  };

  const feedbackLabel = !activeNotes.size ? "Listo para escucharte" : isCorrect ? "¡Acorde completo!" : extraPcs.length ? "Hay una nota fuera del acorde" : `Faltan ${missingPcs.length} ${missingPcs.length === 1 ? "nota" : "notas"}`;

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setView("practica")} aria-label="Ir a práctica">
          <span className="brand-mark">A</span><span>ACORDE</span>
        </button>
        <nav className="main-nav" aria-label="Secciones">
          <button className={view === "practica" ? "active" : ""} onClick={() => setView("practica")}>Práctica</button>
          <button className={view === "teoria" ? "active" : ""} onClick={() => setView("teoria")}>Teoría</button>
        </nav>
        <div className="header-actions">
          <button className={`sound-toggle ${audioOn ? "on" : ""}`} onClick={() => setAudioOn((value) => !value)} aria-pressed={audioOn}>
            <span>{audioOn ? "◖))" : "◖×"}</span> Sonido
          </button>
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
        <div className="context-title"><p className="eyebrow">CENTRO DE PRÁCTICA</p><h1>{view === "practica" ? "Del concepto al teclado." : "Entiende lo que estás tocando."}</h1></div>
        <div className="tonality-controls">
          <label><span>TONALIDAD</span><select value={rootIndex} onChange={(event) => setRootIndex(Number(event.target.value))}>{ROOTS.map((option, index) => <option key={option.name} value={index}>{option.name}</option>)}</select></label>
          <div className="mode-toggle" aria-label="Modo de la tonalidad"><button className={mode === "mayor" ? "active" : ""} onClick={() => setMode("mayor")}>Mayor</button><button className={mode === "menor" ? "active" : ""} onClick={() => setMode("menor")}>Menor</button></div>
        </div>
        <div className="session-stats"><div><b>{correctCount}</b><span>ACORDES</span></div><div><b>{streak}</b><span>RACHA</span></div></div>
      </section>

      {view === "practica" ? (
        <>
          <section className="diatonic-section">
            <div className="section-heading"><div><span className="section-number">01</span><div><p className="eyebrow">FAMILIA DE LA TONALIDAD</p><h2>Acordes diatónicos de {root.name} {mode}</h2></div></div><p>Construidos solo con notas de la escala: <strong>{scaleNames.join(" · ")}</strong></p></div>
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

      <footer><span>ACORDE · Laboratorio armónico</span><p>Web MIDI funciona mejor en Chrome o Edge de escritorio.</p><button onClick={() => setShowMidiHelp(true)}>Ayuda MIDI</button></footer>

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
