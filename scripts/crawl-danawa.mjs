import { mkdir, writeFile } from "node:fs/promises";

const categories = {
  cpu: "https://prod.danawa.com/list/?cate=112747",
  motherboard: "https://prod.danawa.com/list/?cate=112751",
  memory: "https://prod.danawa.com/list/?cate=112752",
  gpu: "https://prod.danawa.com/list/?cate=112753",
  psu: "https://prod.danawa.com/list/?cate=112777",
  case: "https://prod.danawa.com/list/?cate=112775"
};

const searchSeeds = {
  cpu: ["9800X3D", "7800X3D", "7500F", "14400F"],
  motherboard: ["B650M", "B760M", "X870", "Z890"],
  memory: ["DDR5 6000 32GB", "DDR4 3200 16GB"],
  gpu: ["RTX 5090", "RTX5090", "RTX 5080", "RTX 5070", "RX 9070 XT"],
  psu: ["ATX 3.1 850W", "1000W Gold", "12V-2x6 파워"],
  case: ["VGA 400mm 케이스", "ATX 메쉬 케이스", "M-ATX 케이스"]
};

const entities = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": "\"",
  "&#034;": "\"",
  "&#039;": "'",
  "&nbsp;": " "
};

function decodeHtml(value = "") {
  return value
    .replace(/&(amp|lt|gt|quot|nbsp);|&#0?3[49];/g, (match) => entities[match] ?? match)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number.parseInt(num, 10)));
}

function stripTags(value = "") {
  return decodeHtml(value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function pick(block, pattern) {
  return stripTags(block.match(pattern)?.[1] ?? "");
}

function parseProducts(html, category) {
  const blocks = html.match(/<li[^>]+class="[^"]*prod_item[^"]*"[\s\S]*?<\/li>/gi) ?? [];
  return blocks
    .map((block) => {
      const plain = stripTags(block);
      const name = pick(block, /class="[^"]*prod_name[^"]*"[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i);
      const spec = pick(block, /class="[^"]*spec_list[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      const priceText =
        pick(block, /class="[^"]*price_sect[^"]*"[\s\S]*?(\d[\d,]*)\s*원/i) ||
        (plain.match(/(\d{1,3}(?:,\d{3})+)\s*원/)?.[1] ?? "");
      const link = block.match(/class="[^"]*prod_name[^"]*"[\s\S]*?<a[^>]+href="([^"]+)"/i)?.[1] ?? "";

      if (!name || name.includes("상품비교")) return null;

      return {
        category,
        name,
        spec,
        price: Number(priceText.replace(/,/g, "")) || null,
        link: decodeHtml(link),
        rawText: plain.slice(0, 800)
      };
    })
    .filter(Boolean)
    .slice(0, 24);
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "accept-language": "ko-KR,ko;q=0.9,en;q=0.6",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36"
    }
  });

  if (!response.ok) {
    throw new Error(`${url} fetch failed: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const charset = response.headers.get("content-type")?.match(/charset=([^;]+)/i)?.[1]?.toLowerCase() ?? "";
  const encoding = charset.includes("utf") ? "utf-8" : "euc-kr";
  return new TextDecoder(encoding).decode(buffer);
}

function uniqueItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.category}:${item.link || item.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchCategory(category, url) {
  const html = await fetchHtml(url);
  return parseProducts(html, category).map((item) => ({ ...item, source: "category", sourceQuery: null }));
}

async function fetchSearch(category, query) {
  const url = `https://search.danawa.com/dsearch.php?module=goods&act=dispMain&k1=${encodeURIComponent(query)}`;
  const html = await fetchHtml(url);
  return parseProducts(html, category).map((item) => ({ ...item, source: "search", sourceQuery: query }));
}

const categoryEntries = await Promise.all(Object.entries(categories).map(([category, url]) => fetchCategory(category, url)));
const searchEntries = await Promise.all(
  Object.entries(searchSeeds).flatMap(([category, queries]) => queries.map((query) => fetchSearch(category, query)))
);
const items = uniqueItems([...categoryEntries.flat(), ...searchEntries.flat()]);

await mkdir("data", { recursive: true });

const fetchedAt = new Date().toISOString();
const fullPayload = `${JSON.stringify(
  {
    fetchedAt,
    note: "Danawa category/search snapshot. Full raw candidate source for inspection.",
    categories,
    searchSeeds,
    items
  },
  null,
  2
)}\n`;

await writeFile("data/danawa-raw.generated.json", fullPayload, "utf8");

console.log(`Saved ${items.length} products to data/danawa-raw.generated.json`);
