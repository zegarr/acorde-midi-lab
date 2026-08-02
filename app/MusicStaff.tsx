"use client";

import { useEffect, useRef } from "react";

const VEX_KEYS: Record<string, string> = {
  C4: "c/4", D4: "d/4", E4: "e/4", F4: "f/4", G4: "g/4", A4: "a/4", B4: "b/4", C5: "c/5",
};

export default function MusicStaff({ notes, title }: { notes: string[]; title: string }) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const draw = async () => {
      const host = hostRef.current;
      if (!host) return;
      const { Renderer, Stave, StaveNote, Voice, Formatter } = await import("vexflow");
      if (cancelled || !hostRef.current) return;
      host.innerHTML = "";
      const width = Math.max(330, Math.min(680, host.clientWidth || 680));
      const renderer = new Renderer(host, Renderer.Backends.SVG);
      renderer.resize(width, 150);
      const context = renderer.getContext();
      const stave = new Stave(8, 28, width - 16);
      stave.addClef("treble").addTimeSignature("4/4").setContext(context).draw();
      const tickables = notes.map((note) => new StaveNote({ keys: [VEX_KEYS[note] ?? "c/4"], duration: "q" }));
      const voice = new Voice({ numBeats: tickables.length, beatValue: 4 }).addTickables(tickables);
      new Formatter().joinVoices([voice]).format([voice], width - 105);
      voice.draw(context, stave);
    };
    void draw();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => void draw()) : null;
    if (hostRef.current && observer) observer.observe(hostRef.current);
    return () => { cancelled = true; observer?.disconnect(); };
  }, [notes]);

  return <div className="music-staff" role="img" aria-label={`${title}: ${notes.join(", ")}`} ref={hostRef} />;
}
