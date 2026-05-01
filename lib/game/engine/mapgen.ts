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

function villageName(faction: string | null, index: number): string {
  const engNames = ["Oxbridge","Caldwell","Hartwick","Dunmore","Ashford","Blackmoor","Elmstead","Fairhaven","Grantham","Holtfield"];
  const fraNames = ["Beaumont","Chartres","Valois","Orléans","Reims","Troyes","Rouen","Amiens","Blois","Chinon"];
  const spaNames = ["Burgos","Toledo","Sevilla","Valladolid","Segovia","Ávila","Salamanca","Córdoba","Jaén","Cádiz"];
  const neutral = ["Aldea","Poblado","Caserío","Alquería","Cortijo","Villar","Lugar","Arrabal","Burg","Hamlet"];
  const names = faction === "ENGLAND" ? engNames : faction === "FRANCE" ? fraNames : faction === "SPAIN" ? spaNames : neutral;
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
      else if (r < 0.26)  { type = "RUINS"; }
      else if (r < 0.29)  { type = "RIVER"; }
      else if (r < 0.32)  { type = "MOUNTAIN"; }

      tiles.push({ x, y, type, bonus, hasVillage: false, hasCamp: false });
    }
  }

  // Place villages: player start (center-left), AI rival (center-right), neutrals scattered
  const villages: Array<{
    x: number; y: number; name: string;
    owner: "PLAYER" | "AI_RIVAL" | "AI_NEUTRAL";
    faction: Faction | null;
  }> = [];

  // Player village
  const px = Math.floor(width * 0.2);
  const py = Math.floor(height / 2);
  setTileVillage(tiles, width, px, py);
  villages.push({ x: px, y: py, name: villageName(playerFaction, 0), owner: "PLAYER", faction: playerFaction });

  // AI rival village (opposite quadrant)
  const rivalFaction = playerFaction === "ENGLAND" ? "FRANCE" : playerFaction === "FRANCE" ? "ENGLAND" : "FRANCE";
  const rx = Math.floor(width * 0.8);
  const ry = Math.floor(height / 2);
  setTileVillage(tiles, width, rx, ry);
  villages.push({ x: rx, y: ry, name: villageName(rivalFaction, 0), owner: "AI_RIVAL", faction: rivalFaction as Faction });

  // Neutral villages (scattered)
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

// Returns tiles visible from a position given a vision radius
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
