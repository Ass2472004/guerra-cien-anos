import { prisma } from "@/lib/db";

// ─── EVENT DEFINITIONS ───────────────────────────────────────────────────────

export type EventType =
  | "GOOD_HARVEST" | "DROUGHT" | "PLAGUE" | "TOURNAMENT" | "DISCOVERY"
  | "BANDITS" | "FIRE" | "REINFORCEMENTS" | "REBELLION" | "HOLY_RELIC"
  | "MERCENARY" | "FLOOD" | "TREACHERY" | "SIEGE_WEAPON_FOUND";

interface EventDef {
  type: EventType;
  title: string;
  description: string;
  weight: number; // relative probability
  /** Apply immediate effect to the affected village */
  apply?: (village: {
    wood: number; stone: number; iron: number; grain: number;
    straw: number; adobe: number; silver: number; gold: number;
    woodRate: number; stoneRate: number; ironRate: number; grainRate: number;
    warehouseCap: number; granaryCap: number;
  }) => Record<string, number>;
}

const EVENTS: EventDef[] = [
  {
    type: "GOOD_HARVEST",
    title: "Cosecha abundante",
    description: "Las lluvias de primavera han traído una cosecha extraordinaria. Los graneros rebosan de grano y paja.",
    weight: 20,
    apply: v => ({ grain: Math.min(v.grain + 300, v.granaryCap), straw: Math.min(v.straw + 150, v.granaryCap) }),
  },
  {
    type: "DROUGHT",
    title: "Sequía prolongada",
    description: "El calor abrasador ha marchitado los campos. Las reservas de grano menguan peligrosamente.",
    weight: 12,
    apply: v => ({ grain: Math.max(0, v.grain - 250), straw: Math.max(0, v.straw - 100) }),
  },
  {
    type: "PLAGUE",
    title: "Pestilencia negra",
    description: "La peste bubónica arrasa las calles. La producción se detiene y los hombres huyen.",
    weight: 8,
    apply: v => ({
      grain: Math.max(0, v.grain - 200),
      wood:  Math.max(0, v.wood  - 150),
      iron:  Math.max(0, v.iron  - 100),
    }),
  },
  {
    type: "TOURNAMENT",
    title: "Torneo de caballería",
    description: "Un gran torneo atrae a nobles de toda Europa. Hay intercambio de plata y alianzas forjadas.",
    weight: 15,
    apply: v => ({ silver: Math.min(v.silver + 120, v.warehouseCap) }),
  },
  {
    type: "DISCOVERY",
    title: "Veta de mineral",
    description: "Los mineros descubren una veta de hierro oculta bajo los campos. ¡Fortuna inesperada!",
    weight: 10,
    apply: v => ({ iron: Math.min(v.iron + 200, v.warehouseCap) }),
  },
  {
    type: "BANDITS",
    title: "Bandoleros en el camino",
    description: "Una banda de salteadores ataca los carros del mercado. Se pierden mercancías y plata.",
    weight: 14,
    apply: v => ({
      silver: Math.max(0, v.silver - 80),
      wood:   Math.max(0, v.wood   - 120),
    }),
  },
  {
    type: "FIRE",
    title: "Incendio en la aldea",
    description: "Un incendio se propaga por los barracones y los almacenes de madera. El fuego consume todo.",
    weight: 9,
    apply: v => ({
      wood:  Math.max(0, v.wood  - 300),
      adobe: Math.max(0, v.adobe - 100),
    }),
  },
  {
    type: "REINFORCEMENTS",
    title: "Refuerzos del rey",
    description: "El monarca envía un destacamento de sus guardias reales para reforzar tu posición. ¡Plata y provisiones!",
    weight: 10,
    apply: v => ({
      silver: Math.min(v.silver + 80,  v.warehouseCap),
      iron:   Math.min(v.iron   + 100, v.warehouseCap),
    }),
  },
  {
    type: "REBELLION",
    title: "Levantamiento campesino",
    description: "Los aldeanos, hartos de los impuestos, se rebelan. Destruyen parte de las reservas.",
    weight: 7,
    apply: v => ({
      grain: Math.max(0, v.grain - 180),
      adobe: Math.max(0, v.adobe - 80),
      wood:  Math.max(0, v.wood  - 100),
    }),
  },
  {
    type: "HOLY_RELIC",
    title: "Reliquia sagrada",
    description: "Los peregrinos traen una reliquia del apóstol Santiago. La moral sube y el oro fluye hacia la aldea.",
    weight: 6,
    apply: v => ({
      gold:   Math.min(v.gold   + 50, v.warehouseCap),
      silver: Math.min(v.silver + 100, v.warehouseCap),
    }),
  },
  {
    type: "MERCENARY",
    title: "Mercenarios disponibles",
    description: "Una compañía de mercenarios italianos ofrece sus servicios a cambio de plata.",
    weight: 8,
    apply: v => ({ silver: Math.min(v.silver + 60, v.warehouseCap) }),
  },
  {
    type: "FLOOD",
    title: "Inundación del río",
    description: "Las lluvias torrenciales desbordan el río. Los campos quedan anegados y parte del grano se pierde.",
    weight: 10,
    apply: v => ({
      grain: Math.max(0, v.grain - 220),
      stone: Math.max(0, v.stone - 80),
    }),
  },
  {
    type: "TREACHERY",
    title: "Traición en la corte",
    description: "Un espía enemigo filtró información sobre tus reservas. Los rivales saben dónde atacar.",
    weight: 7,
    apply: v => ({ silver: Math.max(0, v.silver - 60) }),
  },
  {
    type: "SIEGE_WEAPON_FOUND",
    title: "Catapulta abandonada",
    description: "Los ingenieros encuentran una antigua catapulta abandonada. Con hierro se puede restaurar.",
    weight: 5,
    apply: v => ({ iron: Math.min(v.iron + 150, v.warehouseCap) }),
  },
];

// Weighted random pick
function pickEvent(): EventDef {
  const total = EVENTS.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const ev of EVENTS) {
    r -= ev.weight;
    if (r <= 0) return ev;
  }
  return EVENTS[0];
}

// ─── EVENT ENGINE ────────────────────────────────────────────────────────────

const EVENT_CHANCE = 0.18; // 18% per tick

export async function processRandomEvents(gameId: string) {
  if (Math.random() > EVENT_CHANCE) return null;

  // Pick a random player village to affect
  const villages = await prisma.village.findMany({
    where: { gameId, owner: "PLAYER" },
  });
  if (villages.length === 0) return null;

  const village = villages[Math.floor(Math.random() * villages.length)];
  const ev = pickEvent();

  // Apply effect
  const effect = ev.apply?.(village as any) ?? {};
  if (Object.keys(effect).length > 0) {
    await prisma.village.update({ where: { id: village.id }, data: effect });
  }

  const event = await prisma.gameEvent.create({
    data: {
      gameId,
      type: ev.type,
      title: ev.title,
      description: ev.description,
      affectedId: village.id,
      effectJson: JSON.stringify(effect),
    },
  });

  return event;
}

// ─── VICTORY CONDITIONS ───────────────────────────────────────────────────────

const WIN_VILLAGES = 15;    // control this many to win
const LOSE_TICKS   = 3;     // ticks with 0 villages before losing

export async function checkVictoryConditions(gameId: string) {
  const game = await prisma.game.findUniqueOrThrow({
    where: { id: gameId },
    select: { id: true, status: true, losingTicks: true },
  });

  if (game.status !== "PLAYING") return; // already decided

  const playerVillages = await prisma.village.count({ where: { gameId, owner: "PLAYER" } });
  const rivalVillages  = await prisma.village.count({ where: { gameId, owner: "AI_RIVAL" } });

  // WIN: player controls enough villages
  if (playerVillages >= WIN_VILLAGES) {
    await prisma.game.update({
      where: { id: gameId },
      data: { status: "WON", statusReason: `Conquistaste ${playerVillages} aldeas y unificaste la región.` },
    });
    await prisma.gameEvent.create({
      data: {
        gameId, type: "VICTORY",
        title: "¡VICTORIA!",
        description: `Tu dominio se extiende sobre ${playerVillages} aldeas. Europa se inclina ante ti.`,
      },
    });
    return "WON";
  }

  // WIN: rival completely defeated
  if (rivalVillages === 0) {
    const rivalArmies = await prisma.army.count({ where: { gameId, owner: "AI_RIVAL" } });
    if (rivalArmies === 0) {
      await prisma.game.update({
        where: { id: gameId },
        data: { status: "WON", statusReason: "Has eliminado completamente al rival del campo de batalla." },
      });
      return "WON";
    }
  }

  // LOSE: no player villages
  if (playerVillages === 0) {
    const newLosingTicks = game.losingTicks + 1;
    if (newLosingTicks >= LOSE_TICKS) {
      await prisma.game.update({
        where: { id: gameId },
        data: { status: "LOST", statusReason: "Todas tus aldeas cayeron en manos enemigas. Tu reino ha sido aniquilado.", losingTicks: newLosingTicks },
      });
      return "LOST";
    } else {
      await prisma.game.update({ where: { id: gameId }, data: { losingTicks: newLosingTicks } });
    }
  } else {
    // Reset losing counter
    if (game.losingTicks > 0) {
      await prisma.game.update({ where: { id: gameId }, data: { losingTicks: 0 } });
    }
  }

  return null;
}
