import { prisma } from "@/lib/db";

// ─── EVENTOS DEL MUNDO NAHKOR ─────────────────────────────────────────────────
// Los eventos reflejan los ciclos naturales y políticos del planeta de Nahkor:
// días de luz/oscuridad, inundaciones cíclicas, las espadas Nahkor y los Catalizadores.

export type EventType =
  | "GOOD_HARVEST" | "DROUGHT" | "PLAGUE" | "TOURNAMENT" | "DISCOVERY"
  | "BANDITS" | "FIRE" | "REINFORCEMENTS" | "REBELLION" | "HOLY_RELIC"
  | "MERCENARY" | "FLOOD" | "TREACHERY" | "SIEGE_WEAPON_FOUND"
  | "NAHKOR_DIAS" | "CATALIZADOR" | "GUIVERNO_AVISTADO";

interface EventDef {
  type: EventType;
  title: string;
  description: string;
  weight: number;
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
    title: "Ciclo de Kor favorable",
    description: "Los siete días de luz han sido especialmente abundantes. Los campos de L'Herb y los cultivos rebosan vitalidad. Los graneros se llenan.",
    weight: 20,
    apply: v => ({ grain: Math.min(v.grain + 300, v.granaryCap), straw: Math.min(v.straw + 150, v.granaryCap) }),
  },
  {
    type: "NAHKOR_DIAS",
    title: "Los días de Nahkor se prolongan",
    description: "El astro padre se ha interpuesto más de lo habitual entre Kor y las tierras conocidas. Tres días de oscuridad total asustan a los aldeanos y paralizan la producción.",
    weight: 14,
    apply: v => ({ grain: Math.max(0, v.grain - 200), wood: Math.max(0, v.wood - 100), iron: Math.max(0, v.iron - 80) }),
  },
  {
    type: "FLOOD",
    title: "¡La Gran Inundación!",
    description: "Los astros y las cuatro lunas se han alineado. El agua sube diez varas reclamando lo que es suyo. Las ciudades costeras quedan sepultadas y los campos anegados. Solo los puros de corazón sobreviven, decían los teólogos del Octaedro.",
    weight: 10,
    apply: v => ({
      grain: Math.max(0, v.grain - 350),
      stone: Math.max(0, v.stone - 120),
      wood:  Math.max(0, v.wood  - 150),
    }),
  },
  {
    type: "DROUGHT",
    title: "El astro Kor abrasa las tierras",
    description: "En el ciclo cálido el astro madre ha quemado los cultivos. Los pozos menguan y las reservas de grano caen peligrosamente.",
    weight: 12,
    apply: v => ({ grain: Math.max(0, v.grain - 250), straw: Math.max(0, v.straw - 100) }),
  },
  {
    type: "PLAGUE",
    title: "Pestilencia de las Aguas",
    description: "Las aguas estancadas de la última inundación han traído enfermedad. Los trabajadores caen y la producción se detiene.",
    weight: 8,
    apply: v => ({
      grain: Math.max(0, v.grain - 200),
      wood:  Math.max(0, v.wood  - 150),
      iron:  Math.max(0, v.iron  - 100),
    }),
  },
  {
    type: "CATALIZADOR",
    title: "Fragmento de Catalizador hallado",
    description: "Los mineros han desenterrado un fragmento de los míticos Catalizadores del Origen. La magia que emana acelera la producción durante días. El oro fluye hacia la aldea.",
    weight: 6,
    apply: v => ({
      gold:   Math.min(v.gold   + 60, v.warehouseCap),
      silver: Math.min(v.silver + 100, v.warehouseCap),
    }),
  },
  {
    type: "TOURNAMENT",
    title: "Torneo de Portadores",
    description: "Los portadores de espadas Nahkor organizan un torneo para demostrar su dominio. Nobles de todas las casas acuden. La plata circula y se forjan alianzas.",
    weight: 15,
    apply: v => ({ silver: Math.min(v.silver + 120, v.warehouseCap) }),
  },
  {
    type: "DISCOVERY",
    title: "Veta de mineral en las ruinas",
    description: "Explorando las antiguas ruinas del gran dominio, los mineros descubren una veta de hierro oculta. ¡Fortuna inesperada del mundo antiguo!",
    weight: 10,
    apply: v => ({ iron: Math.min(v.iron + 200, v.warehouseCap) }),
  },
  {
    type: "BANDITS",
    title: "Salteadores de los caminos",
    description: "Una banda de saqueadores aprovecha los días de Nahkor para atacar los carros del mercado. Se pierden mercancías y plata.",
    weight: 14,
    apply: v => ({
      silver: Math.max(0, v.silver - 80),
      wood:   Math.max(0, v.wood   - 120),
    }),
  },
  {
    type: "FIRE",
    title: "Incendio en el asentamiento",
    description: "Las tormentas diarias que suceden a los días de Nahkor han desatado un rayo que incendió los depósitos. El fuego consume madera y reservas.",
    weight: 9,
    apply: v => ({
      wood:  Math.max(0, v.wood  - 300),
      adobe: Math.max(0, v.adobe - 100),
    }),
  },
  {
    type: "REINFORCEMENTS",
    title: "Refuerzos de la alianza",
    description: "Una facción aliada envía un destacamento con provisiones y recursos para reforzar tu posición en el mundo conocido.",
    weight: 10,
    apply: v => ({
      silver: Math.min(v.silver + 80,  v.warehouseCap),
      iron:   Math.min(v.iron   + 100, v.warehouseCap),
    }),
  },
  {
    type: "REBELLION",
    title: "Levantamiento de los Egoistikós",
    description: "En los tiempos de la era de los Egoistikós el caos era común. Hoy los aldeanos, hartos de las cargas de la guerra, se rebelan destruyendo reservas.",
    weight: 7,
    apply: v => ({
      grain: Math.max(0, v.grain - 180),
      adobe: Math.max(0, v.adobe - 80),
      wood:  Math.max(0, v.wood  - 100),
    }),
  },
  {
    type: "HOLY_RELIC",
    title: "Reliquia del Octaedro",
    description: "Los peregrinos del Teontélos traen una reliquia sagrada del Octaedro. La fe eleva la moral y el oro fluye como ofrenda hacia la aldea.",
    weight: 6,
    apply: v => ({
      gold:   Math.min(v.gold   + 50, v.warehouseCap),
      silver: Math.min(v.silver + 100, v.warehouseCap),
    }),
  },
  {
    type: "MERCENARY",
    title: "Mercenarios de las islas de Merxias",
    description: "Una compañía de mercenarios de la Federación de Rha'miras ofrece sus servicios. Traen su propia plata y están listos para la guerra.",
    weight: 8,
    apply: v => ({ silver: Math.min(v.silver + 60, v.warehouseCap) }),
  },
  {
    type: "TREACHERY",
    title: "Traición en el salón del dominio",
    description: "Un espía enemigo ha infiltrado el salón y filtrado información sobre tus reservas. Los rivales saben exactamente dónde golpear.",
    weight: 7,
    apply: v => ({ silver: Math.max(0, v.silver - 60) }),
  },
  {
    type: "SIEGE_WEAPON_FOUND",
    title: "Catapulta abandonada entre las ruinas",
    description: "Los ingenieros encuentran una catapulta de la era del gran dominio, abandonada en las ruinas. Con hierro puede restaurarse y usarse.",
    weight: 5,
    apply: v => ({ iron: Math.min(v.iron + 150, v.warehouseCap) }),
  },
  {
    type: "GUIVERNO_AVISTADO",
    title: "Guiverno avistado en el horizonte",
    description: "Un guiverno libre, sin jinete, sobrevolaba el territorio. Los aldeanos huyeron aterrorizados pero el animal solo quería calor. Dejó atrás escamas de valor inestimable.",
    weight: 5,
    apply: v => ({
      silver: Math.min(v.silver + 90, v.warehouseCap),
      iron:   Math.min(v.iron + 50, v.warehouseCap),
    }),
  },
];

function pickEvent(): EventDef {
  const total = EVENTS.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const ev of EVENTS) {
    r -= ev.weight;
    if (r <= 0) return ev;
  }
  return EVENTS[0];
}

const EVENT_CHANCE = 0.18;

export async function processRandomEvents(gameId: string) {
  if (Math.random() > EVENT_CHANCE) return null;

  const villages = await prisma.village.findMany({
    where: { gameId, owner: "PLAYER" },
  });
  if (villages.length === 0) return null;

  const village = villages[Math.floor(Math.random() * villages.length)];
  const ev = pickEvent();

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

// ─── CONDICIONES DE VICTORIA ──────────────────────────────────────────────────

const WIN_VILLAGES = 15;
const LOSE_TICKS   = 3;

export async function checkVictoryConditions(gameId: string) {
  const game = await prisma.game.findUniqueOrThrow({
    where: { id: gameId },
    select: { id: true, status: true, losingTicks: true },
  });

  if (game.status !== "PLAYING") return;

  const playerVillages = await prisma.village.count({ where: { gameId, owner: "PLAYER" } });
  const rivalVillages  = await prisma.village.count({ where: { gameId, owner: "AI_RIVAL" } });

  if (playerVillages >= WIN_VILLAGES) {
    await prisma.game.update({
      where: { id: gameId },
      data: { status: "WON", statusReason: `Dominaste ${playerVillages} asentamientos y unificaste las tierras de Nahkor.` },
    });
    await prisma.gameEvent.create({
      data: {
        gameId, type: "VICTORY",
        title: "¡VICTORIA — PORTADOR DE LAS 256!",
        description: `Tu dominio se extiende sobre ${playerVillages} aldeas. El mundo de Nahkor se arrodilla ante ti. Las 256 espadas de la oscuridad te reconocen como señor.`,
      },
    });
    return "WON";
  }

  if (rivalVillages === 0) {
    const rivalArmies = await prisma.army.count({ where: { gameId, owner: "AI_RIVAL" } });
    if (rivalArmies === 0) {
      await prisma.game.update({
        where: { id: gameId },
        data: { status: "WON", statusReason: "Has eliminado completamente al rival de las tierras de Nahkor." },
      });
      return "WON";
    }
  }

  if (playerVillages === 0) {
    const newLosingTicks = game.losingTicks + 1;
    if (newLosingTicks >= LOSE_TICKS) {
      await prisma.game.update({
        where: { id: gameId },
        data: {
          status: "LOST",
          statusReason: "Todos tus asentamientos cayeron en manos enemigas. Las espadas Nahkor te abandonan.",
          losingTicks: newLosingTicks,
        },
      });
      return "LOST";
    } else {
      await prisma.game.update({ where: { id: gameId }, data: { losingTicks: newLosingTicks } });
    }
  } else {
    if (game.losingTicks > 0) {
      await prisma.game.update({ where: { id: gameId }, data: { losingTicks: 0 } });
    }
  }

  return null;
}
