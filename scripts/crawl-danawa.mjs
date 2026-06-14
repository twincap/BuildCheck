import { mkdir, writeFile } from "node:fs/promises";

const categories = {
  cpu: "https://prod.danawa.com/list/?cate=112747",
  motherboard: "https://prod.danawa.com/list/?cate=112751",
  memory: "https://prod.danawa.com/list/?cate=112752",
  gpu: "https://prod.danawa.com/list/?cate=112753",
  psu: "https://prod.danawa.com/list/?cate=112777",
  case: "https://prod.danawa.com/list/?cate=112775"
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
      const name = pick(block, /class="[^"]*prod_name[^"]*"[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i);
      const spec = pick(block, /class="[^"]*spec_list[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      const priceText = pick(block, /class="[^"]*price_sect[^"]*"[\s\S]*?(\d[\d,]*)\s*원/i);
      const link = block.match(/class="[^"]*prod_name[^"]*"[\s\S]*?<a[^>]+href="([^"]+)"/i)?.[1] ?? "";

      if (!name || name.includes("상품비교")) return null;

      return {
        category,
        name,
        spec,
        price: Number(priceText.replace(/,/g, "")) || null,
        link: decodeHtml(link),
        rawText: stripTags(block).slice(0, 500)
      };
    })
    .filter(Boolean)
    .slice(0, 24);
}

async function fetchCategory(category, url) {
  const response = await fetch(url, {
    headers: {
      "accept-language": "ko-KR,ko;q=0.9,en;q=0.6",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36"
    }
  });

  if (!response.ok) {
    throw new Error(`${category} fetch failed: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const charset = response.headers.get("content-type")?.match(/charset=([^;]+)/i)?.[1]?.toLowerCase() ?? "";
  const encoding = charset.includes("utf") ? "utf-8" : "euc-kr";
  const html = new TextDecoder(encoding).decode(buffer);
  return parseProducts(html, category);
}

const entries = await Promise.all(Object.entries(categories).map(([category, url]) => fetchCategory(category, url)));
const items = entries.flat();

await mkdir("data", { recursive: true });
await writeFile(
  "data/danawa-raw.generated.json",
  `${JSON.stringify(
    {
      fetchedAt: new Date().toISOString(),
      note: "Danawa category list snapshot. Use as raw candidate source, then normalize into src/constants/data.ts before production use.",
      categories,
      items
    },
    null,
    2
  )}\n`,
  "utf8"
);

console.log(`Saved ${items.length} products to data/danawa-raw.generated.json`);
