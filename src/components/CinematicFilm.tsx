import { useEffect, useRef, useState } from "react";
import { FRAMES } from "@/lib/frames";

type Moment = {
  from: number; // normalized progress range
  to: number;
  eyebrow?: string;
  title: string[];
  sub?: string;
  align?: "left" | "center" | "right";
  big?: boolean;
};

// Ranges derived from inspecting the actual frames (120 total: 1-40 origin, 41-80 ritual, 81-120 bottle).
const MOMENTS: Moment[] = [
  {
    from: -0.1,
    to: 0.075,
    eyebrow: "The Beginning",
    title: ["Before the formula,", "there was nature."],
    align: "left",
  },
  {
    from: 0.115,
    to: 0.175,
    eyebrow: "1st ROOT",
    title: ["Everything begins", "at the root."],
    sub: "A journey from earth to ritual.",
    align: "left",
  },
  {
    from: 0.2,
    to: 0.255,
    eyebrow: "The Botanicals",
    title: ["Nature,", "one ingredient at a time."],
    align: "left",
  },
  { from: 0.335, to: 0.395, eyebrow: "Emblica officinalis", title: ["Amla"], align: "left" },
  {
    from: 0.41,
    to: 0.47,
    eyebrow: "The Ritual",
    title: ["Botanicals.", "Patience.", "Time."],
    sub: "A ritual shaped by botanical tradition.",
    align: "left",
  },
  {
    from: 0.5,
    to: 0.555,
    eyebrow: "Slowly Prepared",
    title: ["Some things", "shouldn't be rushed."],
    align: "right",
  },
  {
    from: 0.575,
    to: 0.63,
    eyebrow: "The Essence",
    title: ["Many botanicals.", "One ritual."],
    align: "left",
  },
  { from: 0.655, to: 0.705, title: ["One drop."], align: "center", big: true },
];

const FINAL_FROM = 0.93;

function momentStyle(p: number, m: Moment) {
  const len = m.to - m.from;
  const fade = Math.min(0.018, len * 0.3);
  let o = 0;
  if (p > m.from && p < m.to) {
    o = Math.min(1, (p - m.from) / fade, (m.to - p) / fade);
  }
  if (m.from < 0) o = Math.min(1, (m.to - p) / fade);
  const y = (1 - o) * 24 * (p < (m.from + m.to) / 2 ? 1 : -1);
  return { opacity: Math.max(0, o), transform: `translate3d(0, ${y}px, 0)` };
}

export function CinematicFilm() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgs = useRef<(HTMLImageElement | null)[]>([]);
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const pointer = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  // Preload: first frame, then key frames at stride, then the rest.
  useEffect(() => {
    const n = FRAMES.length;
    const order: number[] = [0];
    for (const stride of [12, 4, 1])
      for (let i = 0; i < n; i += stride) if (!order.includes(i)) order.push(i);
    let count = 0;
    let cancelled = false;
    imgs.current = new Array(n).fill(null);
    let cursor = 0;
    const next = () => {
      if (cancelled || cursor >= order.length) return;
      const idx = order[cursor++]!;
      const img = new Image();
      img.decoding = "async";
      img.src = FRAMES[idx]!;
      const done = () => {
        if (cancelled) return;
        imgs.current[idx] = img;
        count++;
        setLoaded(count);
        if (count >= 24) setReady(true);
        next();
      };
      img.onload = () =>
        img.decode
          ? img
              .decode()
              .catch(() => {})
              .then(done)
          : done();
      img.onerror = () => {
        count++;
        setLoaded(count);
        next();
      };
    };
    for (let k = 0; k < 6; k++) next();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { alpha: false })!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    let raf = 0;
    let play = 0;
    let lastDrawn = -1;
    let lastKey = "";

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.5 : 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round((canvas.parentElement?.clientHeight ?? window.innerHeight) * dpr);
      lastKey = "";
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: PointerEvent) => {
      if (!finePointer || reduce) return;
      pointer.current.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.current.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove);

    const nearestLoaded = (i: number) => {
      for (let d = 0; d < FRAMES.length; d++) {
        if (imgs.current[i - d]) return i - d;
        if (imgs.current[i + d]) return i + d;
      }
      return -1;
    };

    const tick = () => {
      const wrap = wrapRef.current;
      if (wrap) {
        const rect = wrap.getBoundingClientRect();
        const total =
          wrap.offsetHeight - (canvas.parentElement?.clientHeight ?? window.innerHeight);
        const p = Math.min(1, Math.max(0, -rect.top / total));
        // Final hold: last frames reached a bit earlier, giving a stable product moment.
        const filmP = Math.min(1, p / 0.97);
        const target = filmP * (FRAMES.length - 1);
        play = reduce ? target : play + (target - play) * 0.14;
        if (Math.abs(target - play) < 0.01) play = target;
        setProgress((prev) => (Math.abs(prev - p) > 0.0005 ? p : prev));

        const pt = pointer.current;
        pt.x += (pt.tx - pt.x) * 0.05;
        pt.y += (pt.ty - pt.y) * 0.05;

        const idx = nearestLoaded(Math.round(play));
        const zoom = reduce
          ? 1.02
          : 1.02 +
            0.05 * Math.sin(filmP * Math.PI * 3) ** 2 * (1 - Math.max(0, (filmP - 0.9) * 10));
        const key = `${idx}|${zoom.toFixed(4)}|${pt.x.toFixed(3)}|${pt.y.toFixed(3)}|${canvas.width}`;
        if (idx >= 0 && key !== lastKey) {
          const img = imgs.current[idx]!;
          const cw = canvas.width,
            ch = canvas.height;
          const portraitBottle = cw / ch < 0.8 && idx >= 78;
          // Preserve the full source height and crop only the side scenery.
          const revealFraming = Math.min(1, Math.max(0, (idx - 108) / 7));
          const portraitImageHeight = ch * (0.8 - 0.32 * revealFraming);
          const s = portraitBottle
            ? portraitImageHeight / img.naturalHeight
            : Math.max(cw / img.naturalWidth, ch / img.naturalHeight) * zoom;
          const w = img.naturalWidth * s,
            h = img.naturalHeight * s;
          // Follow the bottle as it moves left in the final source frames.
          const bottleFocal = idx <= 104
            ? 0.5
            : idx <= 109
              ? 0.5 - 0.06 * (idx - 104) / 5
              : idx <= 114
                ? 0.44 - 0.14 * (idx - 109) / 5
                : 0.3 - 0.03 * Math.min(1, (idx - 114) / 5);
          const focal = portraitBottle ? bottleFocal : 0.5;
          const x = cw / 2 - w * focal - (portraitBottle ? 0 : pt.x * cw * 0.008);
          const y = portraitBottle
            ? ch * 0.12
            : (ch - h) / 2 - pt.y * ch * 0.008;
          ctx.fillStyle = "#08140d";
          ctx.fillRect(0, 0, cw, ch);
          ctx.drawImage(img, x, y, w, h);
          lastKey = key;
          lastDrawn = idx;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      void lastDrawn;
    };
  }, []);

  const finalO = Math.min(1, Math.max(0, (progress - FINAL_FROM) / 0.03));
  const uiHidden = progress > 0.71 && progress < FINAL_FROM;
  const pct = Math.round((loaded / FRAMES.length) * 100);

  return (
    <section
      ref={wrapRef}
      className="film-section relative h-[900svh] bg-night md:h-[1400svh]"
      aria-label="1st ROOT film"
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        <div className="film-scrim pointer-events-none absolute inset-0" />

        {MOMENTS.map((m, i) => (
          <div
            key={i}
            className={`film-moment pointer-events-none absolute inset-0 flex px-6 md:px-16 ${
              m.align === "center"
                ? "items-start justify-center pt-[16vh] text-center"
                : m.align === "right"
                  ? "items-end justify-end pb-[18vh] text-right"
                  : "items-end justify-start pb-[18vh]"
            }`}
            style={{ ...momentStyle(progress, m), willChange: "opacity, transform" }}
          >
            <div className="max-w-2xl">
              {m.eyebrow && (
                <p className={`eyebrow mb-5 ${m.eyebrow.includes("1st") ? "normal-case" : ""}`}>
                  {m.eyebrow}
                </p>
              )}
              <h2 className={m.big ? "display text-[clamp(3.4rem,10vw,9rem)]" : "display"}>
                {m.title.map((t) => (
                  <span key={t} className="block">
                    {t}
                  </span>
                ))}
              </h2>
              {m.sub && (
                <p className="mt-6 text-sm tracking-wide text-muted-foreground md:text-base">
                  {m.sub}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Final product reveal */}
        <div
          className="film-reveal absolute inset-0 flex items-end justify-start px-6 pb-[5svh] md:items-center md:justify-end md:px-12 md:pb-0 lg:px-24"
          style={{
            opacity: finalO,
            pointerEvents: finalO > 0.5 ? "auto" : "none",
            transform: `translate3d(0, ${(1 - finalO) * 20}px, 0)`,
          }}
        >
          <div className="max-w-md">
            <p className="eyebrow mb-5 normal-case">1st ROOT</p>
            <h1 className="display text-[clamp(2.2rem,6vw,6.5rem)]">
              Vedam
              <br />
              of Hair.
            </h1>
            <p className="mt-4 text-muted-foreground">Your hair deserves a ritual.</p>
            <div className="mt-5 flex flex-wrap gap-3 md:mt-10">
              <a href="#collection" className="btn-gold">
                Shop the ritual
              </a>
              <a href="#philosophy" className="btn-quiet">
                Discover the story
              </a>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-center transition-opacity duration-700"
          style={{ opacity: ready && progress < 0.02 ? 1 : 0 }}
        >
          <p className="eyebrow text-foreground/70">Scroll to begin</p>
          <div className="mx-auto mt-3 h-10 w-px animate-pulse bg-primary/70" />
        </div>

        {/* Progress */}
        <div
          className="absolute right-6 top-1/2 hidden h-40 w-px -translate-y-1/2 bg-foreground/15 transition-opacity duration-700 md:block"
          style={{ opacity: uiHidden ? 0 : 1 }}
        >
          <div className="w-px bg-primary" style={{ height: `${progress * 100}%` }} />
        </div>

        {/* Loader */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-night transition-opacity duration-1000"
          style={{ opacity: ready ? 0 : 1, pointerEvents: ready ? "none" : "auto" }}
        >
          <p className="font-serif text-3xl tracking-wide">1st ROOT</p>
          <div className="mt-6 h-px w-40 bg-foreground/15">
            <div
              className="h-px bg-primary transition-all duration-300"
              style={{ width: `${Math.min(100, (loaded / 24) * 100)}%` }}
            />
          </div>
          <p className="eyebrow mt-4 text-muted-foreground">Preparing the ritual · {pct}%</p>
        </div>
      </div>
    </section>
  );
}
