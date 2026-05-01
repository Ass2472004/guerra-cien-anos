// Generate all troop / hero / faction images via Hugging Face Inference API
import { writeFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUBLIC = join(ROOT, "public");
const HF_TOKEN = process.env.HF_TOKEN;
if (!HF_TOKEN) { console.error("HF_TOKEN env required"); process.exit(1); }

const MODEL = "black-forest-labs/FLUX.1-schnell";
const ENDPOINT = `https://router.huggingface.co/hf-inference/models/${MODEL}`;

const STYLE = "medieval illuminated manuscript style, oil painting, fine ink illustration, intricate detail, parchment background, warm earth tones, gold accents, no text, no logo";

const TROOPS = [
  // ENGLAND
  { key: "LEVY", faction: "england", prompt: "english medieval peasant levy with simple spear and tunic" },
  { key: "WELSH_SPEARMAN", faction: "england", prompt: "welsh spearman in green tabard with long spear" },
  { key: "SERGEANT_ENG", faction: "england", prompt: "english sergeant in chainmail with sword and red surcoat with white crosses" },
  { key: "CROSSBOWMAN_ENG", faction: "england", prompt: "english medieval crossbowman with crossbow, leather armor" },
  { key: "LONGBOWMAN", faction: "england", prompt: "english longbowman with massive yew longbow, heroic pose, red and white surcoat" },
  { key: "HOBELAR", faction: "england", prompt: "english hobelar light cavalry on small horse, light armor, javelin" },
  { key: "MAN_AT_ARMS_ENG", faction: "england", prompt: "english dismounted man-at-arms in full plate armor with poleaxe" },
  { key: "KNIGHT_ENG", faction: "england", prompt: "english knight on warhorse, red and white heraldry, full plate armor, lance" },
  { key: "SCOUT_ENG", faction: "england", prompt: "english scout on horseback, hooded cloak, bow, stealth" },
  { key: "ENGINEER_ENG", faction: "england", prompt: "medieval english siege engineer with tools and crossbow" },
  { key: "TREBUCHET_ENG", faction: "england", prompt: "wooden trebuchet siege weapon being loaded" },
  // FRANCE
  { key: "PIETAILLE", faction: "france", prompt: "french medieval peasant infantry with spear and blue tabard" },
  { key: "PIKEMAN_FRA", faction: "france", prompt: "french pikeman in formation with long pike, blue and gold heraldry" },
  { key: "MOUNTED_SERGEANT", faction: "france", prompt: "french mounted sergeant on horseback with sword and shield, blue surcoat" },
  { key: "GENOESE_CROSSBOWMAN", faction: "france", prompt: "genoese crossbowman with pavise shield and crossbow, italian armor" },
  { key: "FRANC_ARCHER", faction: "france", prompt: "french franc archer with shortbow, leather armor, blue clothes" },
  { key: "MAN_AT_ARMS_FRA", faction: "france", prompt: "french man-at-arms in full plate armor with halberd, fleur-de-lis surcoat" },
  { key: "LIGHT_HORSEMAN_FRA", faction: "france", prompt: "french light horseman, light armor, sword and shield" },
  { key: "CHEVALIER", faction: "france", prompt: "french chevalier knight on warhorse, royal blue heraldry with golden fleur-de-lis, full plate armor, lance, heroic" },
  { key: "COURT_SPY", faction: "france", prompt: "french court spy in dark hooded cloak, dagger, mysterious" },
  { key: "BOMBARD_BUREAU", faction: "france", prompt: "medieval cannon bombard, jean bureau french artillery, smoke" },
  { key: "SIEGE_ENGINEER_FRA", faction: "france", prompt: "french siege engineer with map and tools, blue uniform" },
  // SPAIN (Castile)
  { key: "PEON", faction: "spain", prompt: "castilian peasant infantry, simple armor, sword" },
  { key: "ALMOGAVAR", faction: "spain", prompt: "almogavar light infantry warrior, beard, spears, leather armor, fierce expression" },
  { key: "BALLESTERO_SPA", faction: "spain", prompt: "castilian crossbowman, red and gold heraldry, crossbow" },
  { key: "PAVESERO", faction: "spain", prompt: "castilian pavesero with massive shield protecting crossbowman" },
  { key: "JINETE", faction: "spain", prompt: "castilian jinete light cavalry on andalusian horse, javelin, moorish style equipment, red surcoat" },
  { key: "MOUNTED_CROSSBOWMAN", faction: "spain", prompt: "castilian mounted crossbowman, on horseback aiming crossbow" },
  { key: "MAN_AT_ARMS_SPA", faction: "spain", prompt: "castilian man-at-arms in full plate armor, red and gold castile heraldry, sword" },
  { key: "KNIGHT_SANTIAGO", faction: "spain", prompt: "knight of the order of santiago, white tunic with red santiago cross, full armor, sword, militant religious" },
  { key: "ALMOGAVAR_SPY", faction: "spain", prompt: "almogavar scout in shadow, dagger, leather armor, hood" },
  { key: "LOMBARD_SPA", faction: "spain", prompt: "medieval lombard cannon, castilian artillery, stone projectile" },
  { key: "CASTILIAN_SAILOR", faction: "spain", prompt: "castilian medieval sailor with cutlass, on ship deck, bandana" },
];

const HEROES = [
  { key: "england", prompt: "edward of woodstock the black prince, full black plate armor, golden royal crown, ostrich feather plume, heroic portrait, dark and golden, regal" },
  { key: "france",  prompt: "joan of arc, young woman in shining white plate armor, blue cloak with golden fleur-de-lis, holding a banner of orleans, divine glow, heroic portrait" },
  { key: "spain",   prompt: "alvaro de luna constable of castile, noble lord, red and gold castilian heraldry, plate armor, regal portrait, intelligent eyes, sword of office" },
];

const FACTIONS = [
  { key: "england", prompt: "english royal coat of arms, three golden lions on red background, heraldic, ornate" },
  { key: "france",  prompt: "french royal coat of arms, golden fleur-de-lis on royal blue, heraldic, ornate" },
  { key: "spain",   prompt: "castile and leon coat of arms, red castle and golden lion on quartered shield, heraldic, ornate" },
];

const BANNER = { key: "banner", prompt: "epic medieval battle scene, hundred years war, knights, archers, banners, heroic, painterly" };

async function fetchImage(prompt, outPath) {
  if (existsSync(outPath) && statSync(outPath).size > 5000) {
    console.log(`  [skip] ${outPath}`);
    return;
  }
  const fullPrompt = `${prompt}, ${STYLE}`;
  console.log(`  [gen]  ${outPath}  →  ${prompt.slice(0, 60)}...`);

  let attempt = 0;
  while (attempt < 3) {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
          "Accept": "image/png",
        },
        body: JSON.stringify({ inputs: fullPrompt, parameters: { width: 512, height: 512 } }),
      });
      if (!res.ok) {
        const txt = await res.text();
        console.log(`    attempt ${attempt + 1} failed: ${res.status} ${txt.slice(0, 200)}`);
        attempt++;
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, buf);
      console.log(`    saved ${buf.length} bytes`);
      return;
    } catch (e) {
      console.log(`    error: ${e.message}`);
      attempt++;
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  console.log(`    GAVE UP on ${outPath}`);
}

async function main() {
  console.log("=== Banner ===");
  await fetchImage(BANNER.prompt, join(PUBLIC, "banner.png"));

  console.log("=== Factions ===");
  for (const f of FACTIONS) {
    await fetchImage(f.prompt, join(PUBLIC, "factions", `${f.key}.png`));
  }

  console.log("=== Heroes ===");
  for (const h of HEROES) {
    await fetchImage(h.prompt, join(PUBLIC, "heroes", `${h.key}.png`));
  }

  console.log("=== Troops ===");
  for (const t of TROOPS) {
    await fetchImage(t.prompt, join(PUBLIC, "troops", `${t.key}.png`));
  }

  console.log("DONE");
}

main().catch(err => { console.error(err); process.exit(1); });
