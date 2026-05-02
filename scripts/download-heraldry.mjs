/**
 * Downloads real historical coats of arms from Wikimedia Commons.
 * Uses the Wikimedia REST API with a proper User-Agent header.
 * Saves to public/factions/{england,france,spain}.png
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, "..", "public", "factions");
mkdirSync(PUBLIC, { recursive: true });

// User-Agent required by Wikimedia policy
const UA = "GuerraCienAnos/1.0 (educational game project; contact alejandrosanchezserna@gmail.com)";

// We use the Wikimedia thumbnail API:
// https://en.wikipedia.org/w/api.php?action=query&titles=File:<NAME>&prop=imageinfo&iiprop=url&iiurlwidth=512&format=json
const FILES = [
  {
    key: "england",
    file: "Royal_Arms_of_England_(1198-1340).svg",
    fallback: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Royal_Arms_of_England_%281198-1340%29.svg/512px-Royal_Arms_of_England_%281198-1340%29.svg.png",
    desc: "Royal Arms of England (Three Lions, 1198-1340)",
  },
  {
    key: "france",
    file: "Armoiries_France_ancien_régime.svg",
    fallback: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Armoiries_France_ancien_r%C3%A9gime.svg/512px-Armoiries_France_ancien_r%C3%A9gime.svg.png",
    desc: "Royal Arms of France (Fleur-de-lis)",
  },
  {
    key: "spain",
    file: "Escudo_de_la_Corona_de_Castilla_(Trastámara).svg",
    fallback: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Escudo_de_la_Corona_de_Castilla_%28Trast%C3%A1mara%29.svg/512px-Escudo_de_la_Corona_de_Castilla_%28Trast%C3%A1mara%29.svg.png",
    desc: "Crown of Castile coat of arms (Trastámara)",
  },
];

async function fetchWithUA(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept": "image/png,image/jpeg,image/webp,*/*",
    },
    redirect: "follow",
  });
  return res;
}

async function getWikimediaThumbUrl(filename) {
  const encodedFile = encodeURIComponent("File:" + filename);
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodedFile}&prop=imageinfo&iiprop=url&iiurlwidth=512&format=json&origin=*`;

  const res = await fetchWithUA(apiUrl);
  if (!res.ok) return null;

  const data = await res.json();
  const pages = data?.query?.pages;
  if (!pages) return null;

  const page = Object.values(pages)[0];
  return page?.imageinfo?.[0]?.thumburl ?? null;
}

async function downloadImage(url, outPath) {
  console.log(`  Fetching: ${url.slice(0, 80)}...`);
  const res = await fetchWithUA(url);
  if (!res.ok) {
    console.log(`  ✗ HTTP ${res.status} ${res.statusText}`);
    return false;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 2000) {
    console.log(`  ✗ Too small (${buf.length} bytes) — likely an error page`);
    return false;
  }
  writeFileSync(outPath, buf);
  console.log(`  ✓ Saved ${buf.length} bytes → ${outPath}`);
  return true;
}

async function main() {
  console.log("=== Heraldic Images Downloader ===\n");

  for (const item of FILES) {
    const outPath = join(PUBLIC, `${item.key}.png`);
    console.log(`\n[${item.key.toUpperCase()}] ${item.desc}`);

    // Try Wikimedia API first
    let success = false;
    console.log(`  Querying Wikimedia API for: ${item.file}`);
    try {
      const thumbUrl = await getWikimediaThumbUrl(item.file);
      if (thumbUrl) {
        console.log(`  Got thumb URL: ${thumbUrl.slice(0, 80)}...`);
        success = await downloadImage(thumbUrl, outPath);
      } else {
        console.log("  API returned no thumb URL");
      }
    } catch (e) {
      console.log(`  API error: ${e.message}`);
    }

    // Fallback: direct upload URL
    if (!success) {
      console.log("  Trying direct fallback URL...");
      try {
        success = await downloadImage(item.fallback, outPath);
      } catch (e) {
        console.log(`  Fallback error: ${e.message}`);
      }
    }

    // Secondary fallback: Commons API
    if (!success) {
      try {
        const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent("File:" + item.file)}&prop=imageinfo&iiprop=url&iiurlwidth=512&format=json`;
        console.log("  Trying Commons API...");
        const res = await fetchWithUA(commonsUrl);
        if (res.ok) {
          const data = await res.json();
          const pages = data?.query?.pages;
          if (pages) {
            const page = Object.values(pages)[0];
            const url = page?.imageinfo?.[0]?.thumburl;
            if (url) success = await downloadImage(url, outPath);
          }
        }
      } catch (e) {
        console.log(`  Commons fallback error: ${e.message}`);
      }
    }

    if (!success) {
      console.log(`  ✗ FAILED — keeping existing image at ${outPath}`);
    }
  }

  console.log("\n=== Done ===");
}

main().catch(err => { console.error(err); process.exit(1); });
