"use client";
import { useEffect, useState, use, useMemo } from "react";
import Link from "next/link";
import { BUILDINGS } from "@/lib/game/constants/buildings";
import { TROOPS, TROOPS_BY_FACTION } from "@/lib/game/constants/troops";
import type { Faction } from "@/lib/game/constants/troops";
import { BuildingSlot } from "@/components/BuildingSlot";
import {
  FactionEmblem, PanelCorners, TroopIcon,
  GlyphVillage, GlyphMap, GlyphHero, GlyphNobility, GlyphBattles, GlyphEvents,
  ResourceGlyph,
} from "@/components/NhIcons";

interface VillageData {
  id: string; name: string; owner: string; faction: string | null;
  wood: number; stone: number; iron: number; grain: number; straw: number; adobe: number; silver: number; gold: number;
  woodRate: number; stoneRate: number; ironRate: number; grainRate: number;
  warehouseCap: number; granaryCap: number; wallLevel: number;
  buildings: Array<{ id: string; type: string; level: number }>;
  buildQueues: Array<{ id: string; buildingType: string; targetLevel: number; endsAt: string }>;
  trainQueues: Array<{ id: string; troopType: string; count: number; endsAt: string }>;
}
interface ArmyData {
  id: string; owner: string; stamina: number; isResting: boolean; isMoving: boolean; isForaging: boolean;
  troops: Array<{ type: string; faction: string; count: number }>;
}

type Tab = "VIEW" | "BUILDINGS" | "BARRACKS" | "ARMIES" | "MARKET";

function timeLeft(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "✓";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

const TRADE_RATES: Record<string, { silverCost: number; label: string; color: string }> = {
  wood:  { silverCost: 2, label: "Madera",  color: "var(--nh-r-wood)"  },
  stone: { silverCost: 2, label: "Piedra",  color: "var(--nh-r-stone)" },
  iron:  { silverCost: 4, label: "Hierro",  color: "var(--nh-r-iron)"  },
  grain: { silverCost: 1, label: "Grano",   color: "var(--nh-r-grain)" },
  adobe: { silverCost: 3, label: "Adobe",   color: "var(--nh-r-adobe)" },
};
const TRADE_AMOUNTS = [50, 100, 250, 500];

// Slot positions in a circle (% of container)
const SLOT_POSITIONS = (() => {
  const r = 37;
  return Array.from({ length: 13 }, (_, i) => {
    const ang = (i / 13) * 2 * Math.PI - Math.PI / 2;
    return { x: 50 + Math.cos(ang) * r, y: 50 + Math.sin(ang) * r };
  });
})();

// RES config
const RES_CONFIG = [
  { key: "wood",   label: "Madera",  color: "var(--nh-r-wood)",   glyph: "wood",   secondary: false, derived: false },
  { key: "stone",  label: "Piedra",  color: "var(--nh-r-stone)",  glyph: "stone",  secondary: false, derived: false },
  { key: "iron",   label: "Hierro",  color: "var(--nh-r-iron)",   glyph: "iron",   secondary: false, derived: false },
  { key: "grain",  label: "Grano",   color: "var(--nh-r-grain)",  glyph: "grain",  secondary: false, derived: false },
  { key: "straw",  label: "Paja",    color: "var(--nh-r-straw)",  glyph: "straw",  secondary: true,  derived: false },
  { key: "adobe",  label: "Adobe",   color: "var(--nh-r-adobe)",  glyph: "adobe",  secondary: true,  derived: true  },
  { key: "silver", label: "Plata",   color: "var(--nh-r-silver)", glyph: "silver", secondary: true,  derived: false },
  { key: "gold",   label: "Oro",     color: "var(--nh-r-gold)",   glyph: "gold",   secondary: true,  derived: false },
] as const;

// Atmosphere: pre-gen embers
const EMBERS = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left: `${8 + ((i * 4.3) % 84)}%`,
  dx: `${((i * 7 + 3) % 60) - 30}px`,
  delay: `${(i * 0.85) % 18}s`,
  dur: `${12 + (i * 1.1) % 14}s`,
}));

export default function VillagePage({ params }: { params: Promise<{ id: string; vid: string }> }) {
  const { id, vid } = use(params);
  const [data, setData] = useState<{ village: VillageData; armies: ArmyData[] } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("VIEW");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [, setClock] = useState(Date.now());
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch(`/api/game/${id}/village/${vid}`);
      if (res.ok) {
        setData(await res.json());
        setLoadError(null);
      } else {
        const d = await res.json().catch(() => ({}));
        setLoadError(`${res.status}: ${d.error ?? "Error al cargar"}`);
      }
    } catch (e: any) {
      setLoadError(`Red: ${e.message ?? "error"}`);
    }
  }

  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, [id, vid]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setInterval(() => setClock(Date.now()), 1000); return () => clearInterval(t); }, []);

  async function doAction(action: string, payload: object) {
    const res = await fetch(`/api/game/${id}/village/${vid}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });
    const d = await res.json().catch(() => ({}));
    const text = d.error ?? d.message ?? (d.ok ? "Hecho." : "Error");
    setMsg({ text, ok: d.ok ?? false });
    if (d.ok) load();
    setTimeout(() => setMsg(null), 4000);
  }

  async function rename() {
    await doAction("RENAME", { name: newName });
    setRenaming(false);
  }

  // ── Error / loading ──────────────────────────────────────────
  if (!data) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24, background: "var(--nh-bg)" }}>
      {loadError ? (
        <>
          <div style={{ fontSize: 48 }}>⚠</div>
          <p className="nh-h-display" style={{ fontSize: 22 }}>No se puede cargar la aldea</p>
          <p style={{ color: "#ff8a78", fontSize: 13, fontFamily: "monospace", background: "rgba(0,0,0,0.4)", padding: "8px 16px", borderRadius: 4, maxWidth: 480, textAlign: "center" }}>{loadError}</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={load} className="nh-btn is-primary">↻ Reintentar</button>
            <Link href={`/game/${id}`} className="nh-btn">← Mapa</Link>
            <Link href="/dashboard" className="nh-btn">🏠 Inicio</Link>
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 48, animation: "pulse 2s ease-in-out infinite" }}>🏰</div>
          <p className="nh-h-display" style={{ fontSize: 20 }}>Cargando aldea…</p>
        </>
      )}
    </div>
  );

  const { village, armies } = data;
  const faction = (village.faction ?? "PORTADORES") as Faction;
  const factionLower = faction.toLowerCase();
  const hasMarket = village.buildings.some(b => b.type === "MARKET");

  const res = {
    wood: village.wood, stone: village.stone, iron: village.iron,
    grain: village.grain, straw: village.straw, adobe: village.adobe,
    silver: village.silver, gold: village.gold,
  } as Record<string, number>;

  function getBuildingState(type: string) {
    const existing = village.buildings.find(b => b.type === type);
    const inQueue = village.buildQueues.find(q => q.buildingType === type);
    const queuePct = inQueue
      ? Math.min(100, ((Date.now() - new Date(inQueue.endsAt).getTime() + (inQueue as any).durationMs) / ((inQueue as any).durationMs ?? 1)) * 100)
      : undefined;
    return { level: existing?.level ?? 0, inQueue, queuePct };
  }

  const buildingDefs = Object.values(BUILDINGS);
  const mainHallDef = buildingDefs.find(b => b.key === "MAIN_HALL")!;
  const surroundingDefs = buildingDefs.filter(b => b.key !== "MAIN_HALL").slice(0, 13);

  // Selected building detail
  const selDef = selectedBuilding ? BUILDINGS[selectedBuilding as keyof typeof BUILDINGS] : null;
  const selState = selectedBuilding ? getBuildingState(selectedBuilding) : null;
  const selLvlDef = selDef && selState && selState.level < selDef.maxLevel ? selDef.levels[selState.level] : null;
  const canAffordSel = selLvlDef ? (
    res.wood   >= (selLvlDef.cost.wood   ?? 0) &&
    res.stone  >= (selLvlDef.cost.stone  ?? 0) &&
    res.iron   >= (selLvlDef.cost.iron   ?? 0) &&
    res.adobe  >= (selLvlDef.cost.adobe  ?? 0) &&
    res.silver >= (selLvlDef.cost.silver ?? 0)
  ) : false;

  const TABS = [
    { key: "VIEW" as Tab,      glyph: <GlyphVillage />,  label: "Vista" },
    { key: "BUILDINGS" as Tab, glyph: "🏗",               label: "Edificios" },
    { key: "BARRACKS" as Tab,  glyph: <GlyphBattles />,  label: "Cuartel" },
    { key: "ARMIES" as Tab,    glyph: "🛡",               label: "Huestes" },
    { key: "MARKET" as Tab,    glyph: "◯",               label: hasMarket ? "Mercado" : "Mercado 🔒" },
  ];

  return (
    <div className="nh-frame" data-faction={factionLower} style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <nav className="nh-navbar">
        <div className="nh-portrait">
          <div className="nh-portrait-inner">
            <FactionEmblem faction={factionLower} size={28} />
          </div>
          <span className="nh-portrait-level">{village.buildings.length}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 1, marginRight: 4 }}>
          {renaming ? (
            <input
              value={newName} onChange={e => setNewName(e.target.value)} autoFocus
              style={{ fontFamily: "'Cinzel', serif", fontSize: 14, color: "var(--nh-gold)", background: "rgba(0,0,0,0.5)", border: "1px solid var(--nh-bronze)", borderRadius: 3, padding: "2px 8px", width: 180 }}
              onKeyDown={e => { if (e.key === "Enter") rename(); if (e.key === "Escape") setRenaming(false); }}
            />
          ) : (
            <button
              onClick={() => { setNewName(village.name); setRenaming(true); }}
              style={{ fontFamily: "'Cinzel', serif", fontSize: 14, color: "var(--nh-gold)", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left", display: "flex", alignItems: "center", gap: 4 }}
            >
              {village.name}
              <span style={{ fontSize: 9, opacity: 0.5 }}>✎</span>
            </button>
          )}
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, fontStyle: "italic", color: "var(--nh-parchment-dim)" }}>
            {faction} · {village.buildings.length} edificios
          </span>
        </div>

        <div className="nh-nav-sep" />

        {TABS.map((t, i) => (
          <button
            key={t.key}
            className={`nh-navlink${tab === t.key ? " is-active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            <span className="nh-navlink-glyph" style={{ fontSize: typeof t.glyph === "string" ? 16 : undefined }}>
              {t.glyph}
            </span>
            <span>{t.label}</span>
          </button>
        ))}

        <div style={{ flex: 1 }} />

        {msg && (
          <span style={{ fontSize: 12, color: msg.ok ? "var(--nh-accent-bright)" : "#ff8a78", fontStyle: "italic", fontFamily: "'Cinzel', serif" }}>
            {msg.text}
          </span>
        )}

        <Link href={`/game/${id}`} className="nh-btn" style={{ padding: "4px 10px", fontSize: 11 }}>← Mapa</Link>
      </nav>

      {/* ── RESOURCE BAR ───────────────────────────────────────── */}
      <div className="nh-resbar">
        {RES_CONFIG.map(r => {
          const val = res[r.key] ?? 0;
          const cap = ["grain", "straw"].includes(r.key) ? village.granaryCap : village.warehouseCap;
          const pct = Math.min(100, (val / cap) * 100);
          const rate = r.key === "wood" ? village.woodRate : r.key === "stone" ? village.stoneRate
            : r.key === "iron" ? village.ironRate : r.key === "grain" ? village.grainRate
            : r.key === "straw" ? Math.floor(village.grainRate * 0.4) : 0;
          return (
            <div
              key={r.key}
              className={`nh-rescap${r.secondary ? " is-secondary" : ""}${r.derived ? " is-derived" : ""}`}
              style={{ "--c": r.color } as React.CSSProperties}
              title={`${r.label}: ${val} / ${cap}${rate ? ` · +${rate}/h` : ""}`}
            >
              <div className="nh-rescap-icon">
                <span className="nh-rescap-glyph"><ResourceGlyph kind={r.glyph} /></span>
              </div>
              <div className="nh-rescap-body">
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span className="nh-rescap-value">{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}</span>
                  {rate > 0 && <span className="nh-rescap-rate">+{rate}/h</span>}
                </div>
                <span className="nh-rescap-label">{r.label}</span>
              </div>
              <div className="nh-rescap-bar"><i style={{ width: `${pct}%` }} /></div>
            </div>
          );
        })}
      </div>

      {/* ── QUEUE STRIP ────────────────────────────────────────── */}
      {(village.buildQueues.length > 0 || village.trainQueues.length > 0) && (
        <div style={{
          display: "flex", gap: 6, padding: "6px 14px", flexWrap: "wrap",
          background: "var(--nh-bg-1)", borderBottom: "1px solid rgba(139,90,43,0.25)",
          flexShrink: 0,
        }}>
          {village.buildQueues.map(q => {
            const def = BUILDINGS[q.buildingType as keyof typeof BUILDINGS];
            return (
              <div key={q.id} style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "4px 10px", borderRadius: 3,
                background: "rgba(0,0,0,0.4)",
                border: "1px solid var(--nh-bronze-dim)",
                position: "relative", overflow: "hidden", minWidth: 170,
              }}>
                <span style={{ fontSize: 13 }}>🏗</span>
                <span style={{ flex: 1, fontSize: 11, color: "var(--nh-parchment)", fontFamily: "'Cinzel', serif" }}>
                  {def?.name ?? q.buildingType} → Nv {q.targetLevel}
                </span>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--nh-accent-bright)" }}>
                  {timeLeft(q.endsAt)}
                </span>
              </div>
            );
          })}
          {village.trainQueues.map((q, i) => (
            <div key={i} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "4px 10px", borderRadius: 3,
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(180,60,60,0.4)",
              minWidth: 150,
            }}>
              <span style={{ fontSize: 13 }}>⚔</span>
              <span style={{ flex: 1, fontSize: 11, color: "var(--nh-parchment)", fontFamily: "'Cinzel', serif" }}>
                {q.count}× {TROOPS[q.troopType]?.name ?? q.troopType}
              </span>
              <span style={{ fontFamily: "monospace", fontSize: 11, color: "#ff8a78" }}>
                {timeLeft(q.endsAt)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB CONTENT ────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "auto" }} className="nh-scroll">

        {/* ╔═══ VISTA ═══════════════════════════════════════════╗ */}
        {tab === "VIEW" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 10, padding: 10, height: "100%" }}>

            {/* Atmospheric village plan */}
            <div style={{
              position: "relative",
              borderRadius: "var(--nh-radius)",
              border: "1px solid var(--nh-bronze-dim)",
              overflow: "hidden",
              minHeight: 500,
              background: `
                radial-gradient(ellipse at 50% 60%, rgba(80,55,35,0.55), rgba(15,9,4,0.95) 70%),
                radial-gradient(ellipse at 30% 30%, rgba(60,90,55,0.18), transparent 50%),
                conic-gradient(from 0deg at 50% 50%, transparent, rgba(217,168,71,0.04), transparent, rgba(217,168,71,0.04), transparent)
              `,
            }}>
              {/* Fog */}
              <div className="nh-fog" />
              {/* Embers */}
              <div className="nh-embers">
                {EMBERS.map(e => (
                  <span key={e.id} className="nh-ember" style={{
                    left: e.left,
                    ["--dx" as string]: e.dx,
                    animationDelay: e.delay,
                    animationDuration: e.dur,
                  }} />
                ))}
              </div>

              {/* Rotating ambient ring */}
              <div style={{
                position: "absolute", inset: 0,
                animation: "nh-rotate 90s linear infinite",
                background: "conic-gradient(from 0deg, transparent 70%, rgba(217,168,71,0.04) 80%, transparent 90%)",
                pointerEvents: "none",
              }} />

              {/* Title */}
              <div style={{
                position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)",
                display: "flex", alignItems: "center", gap: 12, zIndex: 5,
                fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.18em",
                color: "var(--nh-bronze-bright)", opacity: 0.85,
                whiteSpace: "nowrap",
              }}>
                <span>❖</span>
                <span>PLANO DE ALDEA · {village.name.toUpperCase()}</span>
                <span>❖</span>
              </div>

              {/* Compass ring (decorative) */}
              <div style={{
                position: "absolute", inset: "10%",
                border: "1px dashed rgba(217,168,71,0.12)",
                borderRadius: "50%", pointerEvents: "none",
              }} />

              {/* Main Hall — center */}
              <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 4 }}>
                <BuildingSlot
                  type="MAIN_HALL"
                  level={getBuildingState("MAIN_HALL").level}
                  inProgress={!!getBuildingState("MAIN_HALL").inQueue}
                  onClick={() => { setSelectedBuilding("MAIN_HALL"); setTab("BUILDINGS"); }}
                  size={110}
                  selected={selectedBuilding === "MAIN_HALL"}
                />
              </div>

              {/* 13 surrounding building slots in circle */}
              {surroundingDefs.map((def, i) => {
                const st = getBuildingState(def.key);
                const pos = SLOT_POSITIONS[i];
                return (
                  <div
                    key={def.key}
                    style={{
                      position: "absolute",
                      left: `${pos.x}%`, top: `${pos.y}%`,
                      transform: "translate(-50%, -50%)",
                      animation: `nh-fadeup .5s ease ${i * 0.04}s backwards`,
                      zIndex: 3,
                    }}
                  >
                    <BuildingSlot
                      type={def.key}
                      level={st.level}
                      inProgress={!!st.inQueue}
                      queuePct={st.queuePct}
                      onClick={() => { setSelectedBuilding(def.key); setTab("BUILDINGS"); }}
                      size={62}
                      selected={selectedBuilding === def.key}
                    />
                  </div>
                );
              })}
            </div>

            {/* Right sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>

              <div className="nh-panel">
                <PanelCorners />
                <div className="nh-panel-header">Resumen</div>
                <div className="nh-panel-body" style={{ padding: "8px 12px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "4px 12px", fontSize: 12 }}>
                    <span className="nh-muted">Habitantes</span>
                    <span className="nh-mono">{village.buildings.reduce((s, b) => s + b.level, 0) * 10}</span>
                    <span className="nh-muted">Edificios</span>
                    <span className="nh-mono">{village.buildings.filter(b => b.level > 0).length} / 13</span>
                    <span className="nh-muted">En cola</span>
                    <span className="nh-mono" style={{ color: "var(--nh-accent-bright)" }}>{village.buildQueues.length}</span>
                    <span className="nh-muted">Murallas</span>
                    <span className="nh-mono">Nv.{village.wallLevel ?? 0}</span>
                  </div>
                </div>
              </div>

              <div className="nh-panel">
                <PanelCorners />
                <div className="nh-panel-header">Producción / hora</div>
                <div className="nh-panel-body" style={{ padding: "8px 12px" }}>
                  {([
                    { label: "Madera", color: "var(--nh-r-wood)",  rate: village.woodRate  },
                    { label: "Piedra", color: "var(--nh-r-stone)", rate: village.stoneRate },
                    { label: "Hierro", color: "var(--nh-r-iron)",  rate: village.ironRate  },
                    { label: "Grano",  color: "var(--nh-r-grain)", rate: village.grainRate },
                  ] as const).map(p => (
                    <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: p.color, boxShadow: `0 0 6px ${p.color}`, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 12, color: "var(--nh-parchment-dim)" }}>{p.label}</span>
                      <span className="nh-mono" style={{ fontSize: 12, color: p.color }}>+{p.rate}/h</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="nh-panel" style={{ flex: 1, minHeight: 0 }}>
                <PanelCorners />
                <div className="nh-panel-header">Cadena de producción</div>
                <div className="nh-panel-body nh-scroll" style={{ overflow: "auto" }}>
                  <p style={{ fontStyle: "italic", fontSize: 13, color: "var(--nh-parchment-dim)", lineHeight: 1.5, margin: 0 }}>
                    «Los aserraderos talan los robles negros del valle. La paja del campo, secada al sol del invierno, se mezcla con barro para formar el adobe con el que tus muros resisten el asedio.»
                  </p>
                  <div className="nh-sep">❖ ❖ ❖</div>
                  <div className="nh-mono" style={{ fontSize: 11, color: "var(--nh-bronze-bright)", lineHeight: 1.7 }}>
                    paja → adobe<br />
                    grano + plata → mercado<br />
                    hierro + madera → forja
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ╔═══ EDIFICIOS ════════════════════════════════════════╗ */}
        {tab === "BUILDINGS" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 10, padding: 10, height: "100%" }}>

            <div className="nh-panel">
              <PanelCorners />
              <div className="nh-panel-header">
                <span>Solar de la aldea · {Object.keys(BUILDINGS).length} edificios</span>
                <span className="nh-mono" style={{ fontSize: 10, color: "var(--nh-parchment-dim)" }}>
                  {village.buildings.filter(b => b.level > 0).length} construidos
                </span>
              </div>
              <div className="nh-panel-body" style={{ padding: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))", gap: 12 }}>
                  {buildingDefs.map(def => {
                    const st = getBuildingState(def.key);
                    return (
                      <div key={def.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                        <BuildingSlot
                          type={def.key} level={st.level}
                          inProgress={!!st.inQueue} queuePct={st.queuePct}
                          size={56} onClick={() => setSelectedBuilding(def.key)}
                          selected={selectedBuilding === def.key}
                        />
                        <span style={{
                          fontFamily: "'Cinzel', serif", fontSize: 9,
                          letterSpacing: "0.06em", color: st.level > 0 ? "var(--nh-parchment)" : "var(--nh-parchment-dim)",
                          textAlign: "center", lineHeight: 1.2,
                        }}>
                          {def.name}
                        </span>
                        {st.inQueue && (
                          <span className="nh-mono" style={{ fontSize: 9, color: "var(--nh-accent-bright)" }}>
                            {timeLeft(st.inQueue.endsAt)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Detail panel */}
            <div className="nh-panel" style={{ alignSelf: "start" }}>
              <PanelCorners />
              <div className="nh-panel-header">
                {selDef ? selDef.name : "Selecciona un edificio"}
              </div>
              <div className="nh-panel-body">
                {!selDef ? (
                  <p className="nh-muted" style={{ fontStyle: "italic", fontSize: 12, textAlign: "center", padding: "24px 0" }}>
                    Haz clic en un edificio para ver detalles y construirlo.
                  </p>
                ) : selState && (
                  <>
                    {/* Icon + level */}
                    <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
                      <BuildingSlot type={selDef.key} level={selState.level} size={84} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "var(--nh-parchment-dim)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                          {selDef.key}
                        </div>
                        <div style={{ fontStyle: "italic", fontSize: 13, color: "var(--nh-parchment-dim)", lineHeight: 1.4, marginTop: 4 }}>
                          {selDef.description}
                        </div>
                      </div>
                    </div>

                    {/* Level bar (20 pips) */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.1em", marginBottom: 4 }}>
                        <span className="nh-muted">NIVEL {selState.level}</span>
                        <span style={{ color: "var(--nh-accent-bright)" }}>MÁX {selDef.maxLevel}</span>
                      </div>
                      <div style={{ display: "flex", gap: 2, height: 10, padding: 1, border: "1px solid var(--nh-bronze-dim)", borderRadius: 3, background: "rgba(0,0,0,0.5)" }}>
                        {Array.from({ length: selDef.maxLevel }).map((_, i) => (
                          <span key={i} style={{
                            flex: 1,
                            background: i < selState.level ? "linear-gradient(180deg, var(--nh-accent-bright), var(--nh-accent))" : "transparent",
                            boxShadow: i < selState.level ? "0 0 4px var(--nh-accent-glow)" : "none",
                            borderRadius: 1,
                          }} />
                        ))}
                      </div>
                    </div>

                    {/* Build / queue status */}
                    {selState.inQueue ? (
                      <div style={{ padding: 12, background: "var(--nh-accent-soft)", border: "1px solid var(--nh-accent)", borderRadius: 3, marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Cinzel', serif", fontSize: 11, marginBottom: 6 }}>
                          <span style={{ color: "var(--nh-accent-bright)" }}>OBRA EN CURSO · NV {selState.inQueue.targetLevel}</span>
                          <span className="nh-mono" style={{ color: "var(--nh-accent-bright)" }}>{timeLeft(selState.inQueue.endsAt)}</span>
                        </div>
                        <div className="nh-bar" style={{ "--bar-c": "var(--nh-accent-bright)" } as React.CSSProperties}>
                          <i style={{ width: `${selState.queuePct ?? 50}%` }} />
                        </div>
                      </div>
                    ) : selState.level < selDef.maxLevel && selLvlDef ? (
                      <>
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.1em", color: "var(--nh-parchment-dim)", marginBottom: 6 }}>
                            COSTE PARA NIVEL {selState.level + 1}
                          </div>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {([
                              { k: "wood",   v: selLvlDef.cost.wood   ?? 0 },
                              { k: "stone",  v: selLvlDef.cost.stone  ?? 0 },
                              { k: "iron",   v: selLvlDef.cost.iron   ?? 0 },
                              { k: "adobe",  v: selLvlDef.cost.adobe  ?? 0 },
                              { k: "silver", v: selLvlDef.cost.silver ?? 0 },
                            ] as const).filter(c => c.v > 0).map(c => {
                              const have = res[c.k] ?? 0;
                              return (
                                <span key={c.k} className={have >= c.v ? "nh-cost-ok" : "nh-cost-bad"}>
                                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: `var(--nh-r-${c.k})`, boxShadow: `0 0 4px var(--nh-r-${c.k})` }} />
                                  {c.v.toLocaleString()}
                                </span>
                              );
                            })}
                          </div>
                          <div className="nh-mono" style={{ fontSize: 11, color: "var(--nh-parchment-dim)", marginTop: 8 }}>
                            ⏳ {Math.floor(selLvlDef.time / 60)}m {selLvlDef.time % 60}s
                          </div>
                        </div>
                        <button
                          className={`nh-btn is-primary${!canAffordSel ? "" : ""}`}
                          style={{ width: "100%" }}
                          disabled={!canAffordSel}
                          onClick={() => doAction("BUILD", { buildingType: selDef.key })}
                        >
                          {selState.level === 0 ? "Construir" : `Mejorar a nivel ${selState.level + 1}`}
                        </button>
                      </>
                    ) : (
                      <div style={{ textAlign: "center", fontFamily: "'Cinzel', serif", fontSize: 12, color: "var(--nh-gold)", letterSpacing: "0.14em", padding: 14 }}>
                        ✦ NIVEL MÁXIMO ALCANZADO ✦
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ╔═══ CUARTEL ═════════════════════════════════════════╗ */}
        {tab === "BARRACKS" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, padding: 10, alignContent: "start" }}>
            {TROOPS_BY_FACTION[faction].map(key => {
              const troop = TROOPS[key];
              if (!troop) return null;
              const canAfford = (n: number) => Object.entries(troop.cost).every(([k, v]) => (res[k] ?? 0) >= v * n);
              const ringColors: Record<string, string> = {
                OFF: "#d97142", DEF: "#3a7bd9", SPY: "#9333ea", SIEGE: "#d97500",
              };
              const ringColor = ringColors[troop.role] ?? "#d97142";
              return (
                <div key={key} className="nh-panel">
                  <PanelCorners />
                  <div className="nh-panel-header">
                    <span>{troop.name}</span>
                    <span className="nh-mono" style={{ fontSize: 11, color: "var(--nh-accent-bright)" }}>
                      ×{(data?.armies ?? armies).flatMap(a => a.troops).filter(t => t.type === key).reduce((s, t) => s + t.count, 0) || 0}
                    </span>
                  </div>
                  <div className="nh-panel-body">
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      {/* Circular portrait */}
                      <div style={{
                        width: 56, height: 56, padding: 6, borderRadius: "50%",
                        background: "radial-gradient(circle at 30% 25%, var(--nh-bg-3), var(--nh-bg))",
                        border: `2px solid ${ringColor}`, boxShadow: `0 0 10px ${ringColor}40`,
                        color: ringColor, flexShrink: 0,
                      }}>
                        <TroopIcon type={key} size={44} c={ringColor} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.14em", color: ringColor, textTransform: "uppercase" }}>
                          {troop.role === "OFF" ? "Ofensivo" : troop.role === "DEF" ? "Defensivo" : troop.role === "SPY" ? "Reconocimiento" : "Asedio"}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3, marginTop: 5 }}>
                          {[
                            { label: "ATQ", val: troop.attack,   color: "#ff8a78" },
                            { label: "DEF", val: troop.defense,  color: "#7aaaff" },
                            { label: "VEL", val: troop.speed,    color: "#7adfff" },
                            { label: "⏳",  val: `${Math.floor(troop.trainTime / 60)}m`, color: "var(--nh-accent-bright)" },
                          ].map(st => (
                            <div key={st.label} style={{
                              display: "flex", flexDirection: "column", alignItems: "center",
                              padding: "3px 4px", borderRadius: 3,
                              border: `1px solid ${st.color}40`, background: "rgba(0,0,0,0.3)",
                            }}>
                              <span style={{ fontFamily: "'Cinzel', serif", fontSize: 8, color: "var(--nh-parchment-dim)", letterSpacing: "0.1em" }}>{st.label}</span>
                              <span className="nh-mono" style={{ fontSize: 12, color: st.color, fontWeight: 700 }}>{st.val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 10 }}>
                      {Object.entries(troop.cost).filter(([, v]) => v > 0).map(([k, v]) => {
                        const have = res[k] ?? 0;
                        return (
                          <span key={k} className={have >= v ? "nh-cost-ok" : "nh-cost-bad"}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: `var(--nh-r-${k})`, boxShadow: `0 0 4px var(--nh-r-${k})` }} />
                            {v.toLocaleString()}
                          </span>
                        );
                      })}
                    </div>

                    <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
                      {[1, 5, 10, 50].map(n => (
                        <button key={n} className="nh-btn" style={{ flex: 1, padding: "6px 0" }}
                          disabled={!canAfford(n)}
                          onClick={() => doAction("TRAIN", { troopType: key, count: n })}>
                          +{n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ╔═══ HUESTES ═════════════════════════════════════════╗ */}
        {tab === "ARMIES" && (
          <div style={{ padding: 10 }}>
            {armies.length === 0 ? (
              <div className="nh-panel" style={{ margin: "0 auto", maxWidth: 480 }}>
                <PanelCorners />
                <div className="nh-panel-body" style={{ textAlign: "center", padding: "40px 24px" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>⚔</div>
                  <p className="nh-h-display" style={{ marginBottom: 6 }}>Sin huestes</p>
                  <p className="nh-muted" style={{ fontSize: 12 }}>Recluta tropas en el Cuartel.</p>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, alignContent: "start" }}>
                {armies.map(army => {
                  const sColor = army.stamina > 60 ? "#7adfb0" : army.stamina > 30 ? "#e8c84a" : "#ff8a78";
                  return (
                    <div key={army.id} className="nh-panel">
                      <PanelCorners />
                      <div className="nh-panel-header">
                        <span>{army.owner === "PLAYER" ? "⚔ Tu hueste" : "☠ Hueste enemiga"}</span>
                        <span style={{ fontSize: 10, color: "var(--nh-parchment-dim)", fontStyle: "italic" }}>
                          {army.isMoving ? "En marcha" : army.isResting ? "Descansando" : "Estacionada"}
                        </span>
                      </div>
                      <div className="nh-panel-body">
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Cinzel', serif", fontSize: 10, marginBottom: 4 }}>
                            <span className="nh-muted">RESISTENCIA</span>
                            <span style={{ color: sColor }}>{army.stamina}%</span>
                          </div>
                          <div className="nh-bar" style={{ "--bar-c": sColor } as React.CSSProperties}>
                            <i style={{ width: `${army.stamina}%` }} />
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {army.troops.map(t => (
                            <div key={t.type} style={{ position: "relative", width: 44, height: 44 }}>
                              <div style={{
                                width: "100%", height: "100%", borderRadius: "50%", padding: 4,
                                background: "radial-gradient(circle at 30% 25%, var(--nh-bg-3), var(--nh-bg))",
                                border: "2px solid var(--nh-accent)", color: "var(--nh-accent)",
                              }}>
                                <TroopIcon type={t.type} size={36} c="var(--nh-accent)" />
                              </div>
                              <span style={{
                                position: "absolute", bottom: -4, right: -4,
                                background: "var(--nh-bg)", border: "1px solid var(--nh-accent)",
                                borderRadius: 3, padding: "1px 4px",
                                fontSize: 9, fontFamily: "monospace", fontWeight: 700,
                                color: "var(--nh-accent-bright)",
                              }}>×{t.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ╔═══ MERCADO ═════════════════════════════════════════╗ */}
        {tab === "MARKET" && (
          <div style={{ padding: 10 }}>
            {!hasMarket ? (
              <div className="nh-panel" style={{ margin: "0 auto", maxWidth: 480 }}>
                <PanelCorners />
                <div className="nh-panel-body" style={{ textAlign: "center", padding: "40px 24px" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
                  <p className="nh-h-display" style={{ marginBottom: 8 }}>Mercado no construido</p>
                  <p className="nh-muted" style={{ fontSize: 12, marginBottom: 16 }}>Construye un Mercado en la pestaña de Edificios.</p>
                  <button className="nh-btn is-primary" onClick={() => setTab("BUILDINGS")}>🏗 Ir a edificios</button>
                </div>
              </div>
            ) : (
              <>
                {/* Silver balance */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 16,
                  padding: "14px 18px", marginBottom: 12,
                  background: `radial-gradient(ellipse at 50% 50%, rgba(109,184,217,0.18), transparent 70%), linear-gradient(180deg, var(--nh-bg-2), var(--nh-bg-1))`,
                  border: "1px solid rgba(136,212,240,0.3)", borderRadius: "var(--nh-radius-lg)",
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%",
                    background: "radial-gradient(circle at 30% 25%, #d8e8f4, #6db8d9 60%, #2c5b78 100%)",
                    boxShadow: "0 0 24px rgba(109,212,240,0.4), inset 0 -2px 6px rgba(0,0,0,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#152538", fontFamily: "'Cinzel', serif", fontSize: 22, fontWeight: 800,
                  }}>◯</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "var(--nh-parchment-dim)", letterSpacing: "0.18em" }}>SALDO DEL TESORO</div>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 26, color: "#9bd0e8", textShadow: "0 0 12px rgba(109,212,240,0.4)" }}>
                      {village.silver.toLocaleString()} <span style={{ fontSize: 13, color: "var(--nh-parchment-dim)" }}>plata</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "var(--nh-parchment-dim)", letterSpacing: "0.18em" }}>TARIFA</div>
                    <div className="nh-mono" style={{ fontSize: 14, color: "var(--nh-gold)" }}>1 ↔ plata</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                  {Object.entries(TRADE_RATES).map(([resource, rate]) => {
                    const current = res[resource] ?? 0;
                    return (
                      <div key={resource} className="nh-panel">
                        <PanelCorners />
                        <div className="nh-panel-header">
                          <span>{rate.label}</span>
                          <span className="nh-mono" style={{ fontSize: 11, color: rate.color }}>
                            {current.toLocaleString()}
                          </span>
                        </div>
                        <div className="nh-panel-body">
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: "50%",
                              background: `radial-gradient(circle at 30% 25%, color-mix(in oklab, ${rate.color}, white 35%), ${rate.color})`,
                              boxShadow: `0 0 12px ${rate.color}`,
                            }} />
                            <div style={{ flex: 1 }}>
                              <div className="nh-bar" style={{ "--bar-c": rate.color } as React.CSSProperties}>
                                <i style={{ width: `${Math.min(100, (current / village.warehouseCap) * 100)}%` }} />
                              </div>
                              <div className="nh-mono" style={{ fontSize: 10, color: "var(--nh-parchment-dim)", marginTop: 4 }}>
                                {rate.silverCost} plata / unidad
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 4 }}>
                            {TRADE_AMOUNTS.map(amt => {
                              const cost = rate.silverCost * amt;
                              const canBuy = village.silver >= cost;
                              return (
                                <button key={amt} className="nh-btn" style={{ flex: 1, padding: "6px 0" }}
                                  disabled={!canBuy}
                                  onClick={() => doAction("TRADE", { resource, amount: amt })}>
                                  +{amt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
