import { useState } from "react";
import { useLang } from "./LanguageContext";
import { useTheme } from "./ThemeContext";

const LABELS = {
  en: {
    eyebrow: "Coverage map",
    h2: "Reaching every corner of Bangladesh",
    body: "From coastal clinics in Cox's Bazar to highland health posts in Sylhet — our platform keeps care records running, connected or offline.",
    statValue: "340+",
    statLabel: "clinics active",
    statMeta: "across 12 districts",
    badgeLive: "Live coverage",
    legend: { active: "Active clinic", soon: "Coming soon" },
    clinicCount: "clinics active",
    comingSoon: "Coming soon",
  },
  bn: {
    eyebrow: "কভারেজ মানচিত্র",
    h2: "বাংলাদেশের প্রতিটি কোণে পৌঁছানো",
    body: "কক্সবাজারের উপকূলীয় ক্লিনিক থেকে সিলেটের পার্বত্য স্বাস্থ্যকেন্দ্র পর্যন্ত — সংযুক্ত থাকুন বা না থাকুন, সেবা চলমান থাকে।",
    statValue: "৩৪০+",
    statLabel: "ক্লিনিক সক্রিয়",
    statMeta: "১২টি জেলায়",
    badgeLive: "লাইভ কভারেজ",
    legend: { active: "সক্রিয় ক্লিনিক", soon: "শীঘ্রই আসছে" },
    clinicCount: "টি সক্রিয়",
    comingSoon: "শীঘ্রই আসছে",
  },
};

interface Pin {
  id: string;
  name: string;
  nameBn: string;
  count: number;
  type: "active" | "soon";
  x: number;
  y: number;
}

// SVG viewBox: 0 0 380 450
// Simplified but recognizable Bangladesh outline (clockwise from NW).
// Key features: Sylhet bulge NE, Cox's Bazar SE, Bay of Bengal coast, straight W border.
const BD_PATH =
  "M 42,28 L 116,16 L 155,18 L 195,28 L 258,42 " +
  "Q 308,68 342,128 " +
  "L 344,190 L 347,238 L 336,274 L 322,310 " +
  "L 330,348 L 316,404 " +
  "C 299,416 284,422 275,422 " +
  "C 252,428 228,432 218,432 " +
  "C 195,428 175,424 165,422 " +
  "C 148,416 134,412 124,410 " +
  "C 106,402 96,394 88,390 " +
  "L 58,354 L 38,300 L 16,244 L 20,194 L 28,144 L 38,86 Z";

// Major rivers — Jamuna (N-S), Padma (E-W), Meghna (N-S)
const RIVER_JAMUNA = "M 155,18 C 150,72 148,132 150,188 C 152,224 156,255 160,282";
const RIVER_PADMA  = "M 16,244 C 58,244 98,248 138,252 C 168,257 194,264 220,274";
const RIVER_MEGHNA = "M 220,155 C 224,196 228,236 230,276 C 234,313 244,352 265,410";

const PINS: Pin[] = [
  { id: "dhaka",       name: "Dhaka",       nameBn: "ঢাকা",       count: 87, type: "active", x: 193, y: 210 },
  { id: "chittagong",  name: "Chittagong",  nameBn: "চট্টগ্রাম",  count: 54, type: "active", x: 297, y: 318 },
  { id: "sylhet",      name: "Sylhet",      nameBn: "সিলেট",      count: 32, type: "active", x: 314, y: 160 },
  { id: "rajshahi",    name: "Rajshahi",    nameBn: "রাজশাহী",    count: 41, type: "active", x: 52,  y: 186 },
  { id: "khulna",      name: "Khulna",      nameBn: "খুলনা",      count: 38, type: "active", x: 118, y: 340 },
  { id: "barisal",     name: "Barisal",     nameBn: "বরিশাল",     count: 29, type: "active", x: 192, y: 326 },
  { id: "mymensingh",  name: "Mymensingh",  nameBn: "ময়মনসিংহ",   count: 24, type: "active", x: 193, y: 162 },
  { id: "comilla",     name: "Comilla",     nameBn: "কুমিল্লা",   count: 22, type: "active", x: 254, y: 256 },
  { id: "rangpur",     name: "Rangpur",     nameBn: "রংপুর",      count: 18, type: "active", x: 92,  y: 88  },
  { id: "jessore",     name: "Jessore",     nameBn: "যশোর",       count: 15, type: "active", x: 88,  y: 278 },
  { id: "faridpur",    name: "Faridpur",    nameBn: "ফরিদপুর",    count: 12, type: "active", x: 152, y: 240 },
  { id: "noakhali",    name: "Noakhali",    nameBn: "নোয়াখালী",   count: 8,  type: "active", x: 254, y: 300 },
  { id: "coxsbazar",   name: "Cox's Bazar", nameBn: "কক্সবাজার",  count: 0,  type: "soon",   x: 322, y: 390 },
  { id: "dinajpur",    name: "Dinajpur",    nameBn: "দিনাজপুর",   count: 0,  type: "soon",   x: 68,  y: 102 },
  { id: "bogra",       name: "Bogra",       nameBn: "বগুড়া",      count: 0,  type: "soon",   x: 110, y: 144 },
];

function tooltipTransform(pin: Pin): string {
  const goLeft = pin.x > 230;
  const goBelow = pin.y < 112;
  if (goBelow) return goLeft ? "translate(-108%, 18%)" : "translate(-5%, 18%)";
  return goLeft ? "translate(-108%, -125%)" : "translate(-5%, -125%)";
}

export default function ClinicsMapSection() {
  const { lang } = useLang();
  const { dark } = useTheme();
  const t = LABELS[lang];
  const [hovId, setHovId] = useState<string | null>(null);
  const hovPin = PINS.find((p) => p.id === hovId) ?? null;

  const col = dark
    ? { country: "#163b34", border: "#2a6b62", river: "#1d4ed8", divLine: "#1a4a42", seaBg: "#0a1628" }
    : { country: "#c8e8e2", border: "#5eada0", river: "#60a5fa", divLine: "#a7d4cd", seaBg: "#dbeffe" };

  return (
    <section id="coverage" className="py-24 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Heading */}
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-bold tracking-[0.15em] uppercase text-teal-600 dark:text-teal-400 mb-3">
            {t.eyebrow}
          </p>
          <h2 className="font-display text-4xl lg:text-5xl text-teal-950 dark:text-white leading-tight mb-4">
            {t.h2}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">{t.body}</p>
        </div>

        {/* Map card */}
        <div
          className="relative rounded-3xl overflow-hidden border border-teal-100 dark:border-slate-800 shadow-2xl shadow-teal-100/40 dark:shadow-slate-950/50"
          style={{ background: col.seaBg }}
        >
          {/* Ambient sea gradients */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: dark
                ? "radial-gradient(ellipse at 25% 75%, #0f2a45 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, #0a2a22 0%, transparent 50%)"
                : "radial-gradient(ellipse at 25% 75%, #bae6fd 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, #99f6e4 0%, transparent 50%)",
            }}
          />

          {/* SVG map */}
          <div className="relative flex justify-center items-center py-10 px-4 md:px-10 lg:px-20 min-h-[500px] lg:min-h-[580px]">
            <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">

              <svg
                viewBox="0 0 380 450"
                className="w-full drop-shadow-lg"
                aria-label="Map of Bangladesh showing clinic locations by district"
              >
                <defs>
                  {/* Dot grid pattern for sea texture */}
                  <pattern id="sea-grid" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
                    <circle cx="9" cy="9" r="0.9" fill={dark ? "#1a3a5c" : "#bae6fd"} opacity="0.6" />
                  </pattern>
                </defs>

                {/* Sea dot texture */}
                <rect width="380" height="450" fill="url(#sea-grid)" />

                {/* Country body */}
                <path
                  d={BD_PATH}
                  fill={col.country}
                  stroke={col.border}
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />

                {/* Subtle internal division lines (Jamuna + Meghna corridors) */}
                <path d="M 150,188 L 160,282" fill="none" stroke={col.divLine} strokeWidth="0.9" strokeDasharray="5 5" opacity="0.75" />
                <path d="M 220,155 L 265,410" fill="none" stroke={col.divLine} strokeWidth="0.9" strokeDasharray="5 5" opacity="0.75" />

                {/* Rivers */}
                <path d={RIVER_JAMUNA} fill="none" stroke={col.river} strokeWidth="3"   strokeLinecap="round" opacity="0.7" />
                <path d={RIVER_PADMA}  fill="none" stroke={col.river} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
                <path d={RIVER_MEGHNA} fill="none" stroke={col.river} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />

                {/* Pins */}
                {PINS.map((pin, i) => {
                  const isActive = pin.type === "active";
                  const isHov = hovId === pin.id;
                  const tealFill = "#0d9488";
                  const slateFill = "#94a3b8";
                  const ringOpacity = dark ? 0.28 : 0.18;

                  return (
                    <g
                      key={pin.id}
                      onMouseEnter={() => setHovId(pin.id)}
                      onMouseLeave={() => setHovId(null)}
                      style={{ cursor: "pointer" }}
                      role="button"
                      aria-label={`${pin.name}: ${isActive ? pin.count + " clinics active" : "coming soon"}`}
                    >
                      {/* Active: animated SVG pulse ring */}
                      {isActive && (
                        <circle cx={pin.x} cy={pin.y} r="5" fill={tealFill} opacity="0">
                          <animate
                            attributeName="r"
                            values="5;20;5"
                            dur="2.6s"
                            repeatCount="indefinite"
                            begin={`${(i % 7) * 0.38}s`}
                          />
                          <animate
                            attributeName="opacity"
                            values={`${ringOpacity};0;${ringOpacity}`}
                            dur="2.6s"
                            repeatCount="indefinite"
                            begin={`${(i % 7) * 0.38}s`}
                          />
                        </circle>
                      )}

                      {/* Hover glow */}
                      {isHov && (
                        <circle
                          cx={pin.x}
                          cy={pin.y}
                          r="14"
                          fill={isActive ? `rgba(13,148,136,${dark ? 0.25 : 0.15})` : `rgba(148,163,184,${dark ? 0.2 : 0.12})`}
                        />
                      )}

                      {/* Coming-soon dashed outer ring */}
                      {!isActive && (
                        <circle
                          cx={pin.x}
                          cy={pin.y}
                          r="9"
                          fill="none"
                          stroke={slateFill}
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                          opacity="0.9"
                        />
                      )}

                      {/* Pin body */}
                      <circle
                        cx={pin.x}
                        cy={pin.y}
                        r={isActive ? (isHov ? 7 : 5.5) : 3.5}
                        fill={isActive ? tealFill : slateFill}
                        stroke="white"
                        strokeWidth={isActive ? 1.5 : 1}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip */}
              {hovPin && (
                <div
                  className="absolute z-20 pointer-events-none"
                  style={{
                    left: `${(hovPin.x / 380) * 100}%`,
                    top: `${(hovPin.y / 450) * 100}%`,
                    transform: tooltipTransform(hovPin),
                  }}
                >
                  <div className="bg-white dark:bg-slate-800 border border-teal-100 dark:border-slate-700 rounded-xl shadow-xl px-3.5 py-2.5 whitespace-nowrap">
                    <p className="text-xs font-bold text-teal-900 dark:text-white mb-1">
                      {lang === "bn" ? hovPin.nameBn : hovPin.name}
                    </p>
                    {hovPin.type === "active" ? (
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse flex-shrink-0" />
                        <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                          {hovPin.count} {t.clinicCount}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                          {t.comingSoon}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Stat overlay card (top-left) ── */}
          <div className="absolute top-5 left-5 bg-white dark:bg-slate-800 rounded-2xl border border-teal-100 dark:border-slate-700 shadow-lg p-4 min-w-[170px]">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                {/* Map pin icon */}
                <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-teal-500 dark:text-teal-400">
                {t.badgeLive}
              </span>
            </div>
            <p className="font-display text-4xl text-teal-700 dark:text-teal-300 leading-none">
              {t.statValue}
            </p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1">
              {t.statLabel}
            </p>
            <p className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              {t.statMeta}
            </p>
          </div>

          {/* ── Legend (bottom-right) ── */}
          <div className="absolute bottom-5 right-5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl border border-teal-100 dark:border-slate-700 shadow px-4 py-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2.5">
              Legend
            </p>
            <div className="flex flex-col gap-2">
              {/* Active */}
              <div className="flex items-center gap-2.5">
                <div className="flex-shrink-0 w-5 h-5">
                  <svg viewBox="0 0 20 20" className="w-full h-full">
                    <circle cx="10" cy="10" r="8" fill={dark ? "rgba(13,148,136,0.2)" : "#ccefe9"} />
                    <circle cx="10" cy="10" r="5.5" fill="#0d9488" stroke="white" strokeWidth="1.5" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {t.legend.active}
                </span>
              </div>
              {/* Coming soon */}
              <div className="flex items-center gap-2.5">
                <div className="flex-shrink-0 w-5 h-5">
                  <svg viewBox="0 0 20 20" className="w-full h-full">
                    <circle cx="10" cy="10" r="8" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
                    <circle cx="10" cy="10" r="3.5" fill="#94a3b8" stroke="white" strokeWidth="1" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {t.legend.soon}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
