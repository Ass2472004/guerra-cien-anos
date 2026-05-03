import type { Faction } from "../constants/troops";

export type TileType =
  | "PLAIN" | "VILLAGE" | "OASIS_FOREST" | "OASIS_STONE" | "OASIS_IRON"
  | "OASIS_GRAIN" | "DEPOSIT_SILVER" | "DEPOSIT_GOLD" | "RUINS" | "RIVER" | "MOUNTAIN";

export interface MapTile {
  x: number;
  y: number;
  type: TileType;
  bonus: Record<string, number>;
  hasVillage: boolean;
  hasCamp: boolean;
}

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// Nombres de asentamientos del mundo Nahkor
function villageName(faction: string | null, index: number): string {
  // PORTADORES: nombres de oscuridad, ruinas y poder antiguo
  const portadoresNames = [
    "Sangre Nocturna", "Umbral Oscuro", "Kemet", "Anrob", "Ciudadela de las Sombras",
    "Yehior", "Torre de Kor", "Paso de la Nahkor", "Ken'anne", "Ruinas de Urkart",
  ];
  // IMPERIO: nombres del Imperio Matriarcal y sus provincias
  const imperioNames = [
    "Unalfanen", "La Ciudadela", "Afthonia", "Aksum", "Rha'Kesh",
    "Dominio de Kor", "Fortaleza Imperial", "Angkor", "Puerto Imperial", "Khotan",
  ];
  // FEDERACION: nombres de las ciudades marinas y puertos de Rha'miras
  const federacionNames = [
    "Rha'miras", "Na'vi", "Merxias", "Puerto del Mar Allende", "Islas de Miras",
    "Bahía de Rha'en", "Factoría Merxiana", "Fitoia", "Puerto Libre", "Senado del Mar",
  ];
  // Neutrales: nombres genéricos del mundo conocido
  const neutralNames = [
    "Aldea del Río", "Poblado Antiguo", "Ruinas del Dominio", "Caserío de Kor",
    "Paso Montañoso", "Villar de la Inundación", "Lugar Olvidado", "Arrabal de Nahkor",
    "Caserío Norteño", "Arrabal del Sur",
  ];

  const names =
    faction === "PORTADORES" ? portadoresNames :
    faction === "IMPERIO"    ? imperioNames :
    faction === "FEDERACION" ? federacionNames :
    neutralNames;

  return names[index % names.length] + (index >= names.length ? ` ${Math.floor(index / names.length) + 1}` : "");
}

export function generateMap(width: number, height: number, playerFaction: Faction) {
  const rand = rng(width * height + playerFaction.charCodeAt(0));

  const tiles: MapTile[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const r = rand();
      let type: TileType = "PLAIN";
      let bonus: Record<string, number> = {};

      if (r < 0.08)       { type = "OASIS_FOREST"; bonus = { wood: 25 }; }
      else if (r < 0.13)  { type = "OASIS_GRAIN";  bonus = { grain: 25, straw: 25 }; }
      else if (r < 0.17)  { type = "OASIS_STONE";  bonus = { stone: 25 }; }
      else if (r < 0.20)  { type = "OASIS_IRON";   bonus = { iron: 25 }; }
      else if (r < 0.22)  { type = "DEPOSIT_SILVER"; bonus = { silver: 30 }; }
      else if (r < 0.23)  { type = "DEPOSIT_GOLD";   bonus = { gold: 20 }; }
      else if (r < 0.26)  { type = "RUINS"; }       // Ruinas del gran dominio
      else if (r < 0.29)  { type = "RIVER"; }       // Ríos que se inundan en los ciclos
      else if (r < 0.32)  { type = "MOUNTAIN"; }    // Montañas del mundo conocido

      tiles.push({ x, y, type, bonus, hasVillage: false, hasCamp: false });
    }
  }

  const villages: Array<{
    x: number; y: number; name: string;
    owner: "PLAYER" | "AI_RIVAL" | "AI_NEUTRAL";
    faction: Faction | null;
  }> = [];

  // Aldea del jugador (cuadrante izquierdo)
  const px = Math.floor(width * 0.2);
  const py = Math.floor(height / 2);
  setTileVillage(tiles, width, px, py);
  villages.push({ x: px, y: py, name: villageName(playerFaction, 0), owner: "PLAYER", faction: playerFaction });

  // Aldea del rival IA (cuadrante derecho, facción distinta)
  const rivalFaction: Faction =
    playerFaction === "PORTADORES" ? "IMPERIO" :
    playerFaction === "IMPERIO"    ? "FEDERACION" :
    "PORTADORES";

  const rx = Math.floor(width * 0.8);
  const ry = Math.floor(height / 2);
  setTileVillage(tiles, width, rx, ry);
  villages.push({ x: rx, y: ry, name: villageName(rivalFaction, 0), owner: "AI_RIVAL", faction: rivalFaction });

  // Aldeas neutrales dispersas
  const neutralCount = Math.floor(width * height * 0.05);
  let neutralIdx = 0;
  for (let i = 0; i < neutralCount; i++) {
    let attempts = 0;
    while (attempts < 20) {
      const nx = Math.floor(rand() * width);
      const ny = Math.floor(rand() * height);
      const tile = tiles[ny * width + nx];
      if (tile && !tile.hasVillage && tile.type === "PLAIN" && Math.abs(nx - px) > 2 && Math.abs(nx - rx) > 2) {
        setTileVillage(tiles, width, nx, ny);
        villages.push({ x: nx, y: ny, name: villageName(null, neutralIdx++), owner: "AI_NEUTRAL", faction: null });
        break;
      }
      attempts++;
    }
  }

  return { tiles, villages };
}

function setTileVillage(tiles: MapTile[], width: number, x: number, y: number) {
  const tile = tiles[y * width + x];
  if (tile) { tile.type = "VILLAGE"; tile.hasVillage = true; tile.bonus = {}; }
}

export function getVisibleTiles(
  cx: number, cy: number, radius: number,
  width: number, height: number
): Set<string> {
  const visible = new Set<string>();
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (Math.sqrt(dx * dx + dy * dy) <= radius) {
        const tx = cx + dx;
        const ty = cy + dy;
        if (tx >= 0 && tx < width && ty >= 0 && ty < height) {
          visible.add(`${tx},${ty}`);
        }
      }
    }
  }
  return visible;
}
