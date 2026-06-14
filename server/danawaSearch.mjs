const categoryUrls = {
  cpu: "https://prod.danawa.com/list/?cate=112747",
  motherboard: "https://prod.danawa.com/list/?cate=112751",
  memory: "https://prod.danawa.com/list/?cate=112752",
  gpu: "https://prod.danawa.com/list/?cate=112753",
  psu: "https://prod.danawa.com/list/?cate=112777",
  case: "https://prod.danawa.com/list/?cate=112775"
};

const tones = {
  cpu: "mint",
  motherboard: "rose",
  memory: "sky",
  gpu: "amber",
  psu: "violet",
  case: "slate"
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

function priceFrom(text) {
  const found = text.match(/(\d{1,3}(?:,\d{3})+)\s*원/);
  return found ? Number(found[1].replace(/,/g, "")) : 0;
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
        price: Number(priceText.replace(/,/g, "")) || priceFrom(plain),
        link: decodeHtml(link),
        rawText: plain.slice(0, 900)
      };
    })
    .filter(Boolean);
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
    throw new Error(`Danawa fetch failed: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const charset = response.headers.get("content-type")?.match(/charset=([^;]+)/i)?.[1]?.toLowerCase() ?? "";
  const encoding = charset.includes("utf") ? "utf-8" : "euc-kr";
  return new TextDecoder(encoding).decode(buffer);
}

function numberOf(text, patterns, fallback) {
  for (const pattern of patterns) {
    const found = text.match(pattern);
    if (found) {
      const raw = found.slice(1).find(Boolean);
      const value = Number(String(raw).replace(/,/g, ""));
      if (Number.isFinite(value)) return value;
    }
  }
  return fallback;
}

function socketOf(text) {
  if (/AM4|소켓\s*AM4/i.test(text)) return "AM4";
  if (/LGA\s*1851|소켓\s*1851|1851/i.test(text)) return "LGA1851";
  if (/LGA\s*1700|소켓\s*1700|1700/i.test(text)) return "LGA1700";
  return "AM5";
}

function memoryTypeOf(text) {
  return /DDR4/i.test(text) && !/DDR5/i.test(text) ? "DDR4" : "DDR5";
}

function formFactorOf(text) {
  if (/M-ITX|Mini-ITX|ITX/i.test(text)) return "M-ITX";
  if (/M-ATX|Micro-ATX/i.test(text)) return "M-ATX";
  return "ATX";
}

function gpuModelPower(text) {
  if (/5090/i.test(text)) return { watts: 575, psu: 1000, length: 360, connector: "12V-2x6" };
  if (/5080/i.test(text)) return { watts: 360, psu: 850, length: 330, connector: "12V-2x6" };
  if (/5070/i.test(text)) return { watts: 250, psu: 750, length: 310, connector: "12V-2x6" };
  if (/5060/i.test(text)) return { watts: 180, psu: 650, length: 250, connector: "8pin" };
  if (/4090/i.test(text)) return { watts: 450, psu: 850, length: 340, connector: "12VHPWR" };
  if (/4080|4070/i.test(text)) return { watts: 260, psu: 750, length: 310, connector: "12VHPWR" };
  return { watts: 180, psu: 650, length: 270, connector: "8pin" };
}

function gpuConnectorOf(text) {
  if (/12V-2x6|12V2x6|ATX\s*3\.1|RTX\s*50/i.test(text)) return "12V-2x6";
  if (/12VHPWR|16핀|RTX\s*40/i.test(text)) return "12VHPWR";
  return gpuModelPower(text).connector;
}

function rawSpecs(item, fallback) {
  const pieces = item.spec
    .split("/")
    .map((piece) => piece.trim())
    .filter(Boolean)
    .slice(0, 4);
  return pieces.length ? pieces : fallback;
}

function base(item, index, specs) {
  return {
    id: `live-${item.category}-${index}-${Math.abs(hashCode(item.link || item.name))}`,
    category: item.category,
    maker: item.name.split(/\s+/)[0] || "Danawa",
    name: item.name,
    price: item.price || 0,
    watts: 0,
    tone: tones[item.category],
    specs,
    keywords: [item.name, item.spec, item.rawText, "다나와"],
    danawaCategoryUrl: categoryUrls[item.category],
    source: "danawa",
    sourceUrl: item.link
  };
}

function hashCode(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash << 5) - hash + value.charCodeAt(index);
  return hash | 0;
}

function normalize(item, index) {
  const text = `${item.name} ${item.spec} ${item.rawText}`;

  if (item.category === "cpu") {
    const cores = numberOf(text, [/(\d+)\s*코어/i], 6);
    const tdp = numberOf(text, [/TDP\s*:?\s*(\d+)\s*W?/i, /PPT\s*:?\s*(\d+)\s*W?/i], 88);
    return {
      ...base(item, index, rawSpecs(item, [socketOf(text), memoryTypeOf(text), `${cores}코어`])),
      category: "cpu",
      watts: tdp,
      socket: socketOf(text),
      memoryType: memoryTypeOf(text),
      cores,
      threads: numberOf(text, [/(\d+)\s*스레드/i], cores * 2),
      tdpWatts: tdp,
      boostGhz: numberOf(text, [/최대\s*클럭\s*:?\s*(\d+(?:\.\d+)?)\s*GHz/i], 5)
    };
  }

  if (item.category === "motherboard") {
    return {
      ...base(item, index, rawSpecs(item, [socketOf(text), memoryTypeOf(text), formFactorOf(text)])),
      category: "motherboard",
      watts: 42,
      socket: socketOf(text),
      memoryType: memoryTypeOf(text),
      chipset: text.match(/\b([A-Z]\d{3}[A-Z]?)\b/)?.[1] ?? "Chipset",
      formFactor: formFactorOf(text),
      memorySlots: numberOf(text, [/메모리\s*슬롯\s*:?\s*(\d+)/i, /DIMM\s*:?\s*(\d+)/i], 4),
      maxMemoryGb: numberOf(text, [/최대\s*(\d+)\s*GB/i], 192),
      m2Slots: numberOf(text, [/M\.2\s*:?\s*(\d+)/i], 2)
    };
  }

  if (item.category === "memory") {
    const capacity = numberOf(text, [/(\d+)\s*GB/i], 16);
    const speed = numberOf(text, [/DDR[45]-?(\d{4})/i, /(\d{4})\s*MHz/i], memoryTypeOf(text) === "DDR5" ? 5600 : 3200);
    return {
      ...base(item, index, rawSpecs(item, [memoryTypeOf(text), `${capacity}GB`, `${speed}MHz`])),
      category: "memory",
      watts: Math.max(6, Math.round(capacity / 4)),
      memoryType: memoryTypeOf(text),
      capacityGb: capacity,
      modules: numberOf(text, [/(\d+)\s*개/i, /x\s*(\d+)/i], 1),
      speedMhz: speed
    };
  }

  if (item.category === "gpu") {
    const model = gpuModelPower(text);
    const vram = numberOf(text, [/D[DR]?\d?\s*(\d+)\s*GB/i, /(\d+)\s*GB/i], /5090/i.test(text) ? 32 : 12);
    const length = numberOf(text, [/VGA\s*길이\s*:?\s*(\d+)\s*mm/i, /길이\)?\s*:?\s*(\d+)\s*mm/i], model.length);
    const connector = gpuConnectorOf(text);
    return {
      ...base(item, index, rawSpecs(item, [`${vram}GB VRAM`, `${length}mm`, `권장 ${model.psu}W`, connector])),
      category: "gpu",
      watts: numberOf(text, [/사용전력\s*:?\s*(\d+)\s*W/i, /소비전력\s*:?\s*(\d+)\s*W/i], model.watts),
      vramGb: vram,
      lengthMm: length,
      recommendedPsuWatts: numberOf(text, [/권장(?:파워| 정격)?\s*:?\s*(\d+)\s*W/i, /정격파워\s*:?\s*(\d+)\s*W/i], model.psu),
      connector,
      interface: /PCIe\s*5|RTX\s*50/i.test(text) ? "PCIe 5.0" : "PCIe 4.0"
    };
  }

  if (item.category === "psu") {
    const capacity = numberOf(text, [/(\d{3,4})\s*W/i], 700);
    const pcie5Ready = /ATX\s*3|PCIe\s*5|12V-2x6|12V2x6|12VHPWR|16핀/i.test(text);
    const rating = /플래티넘|Platinum/i.test(text) ? "Platinum" : /골드|Gold/i.test(text) ? "Gold" : "Bronze";
    return {
      ...base(item, index, rawSpecs(item, [`${capacity}W`, rating, pcie5Ready ? "PCIe 5.0" : "8pin"])),
      category: "psu",
      capacityWatts: capacity,
      rating,
      formFactor: /SFX/i.test(text) ? "SFX" : "ATX",
      depthMm: numberOf(text, [/깊이\(D\)\s*:?\s*(\d+)\s*mm/i, /길이\s*:?\s*(\d+)\s*mm/i], 150),
      pcie5Ready
    };
  }

  const boards = [];
  if (/ATX/i.test(text)) boards.push("ATX");
  if (/M-ATX|Micro-ATX/i.test(text)) boards.push("M-ATX");
  if (/M-ITX|ITX/i.test(text)) boards.push("M-ITX");
  return {
    ...base(item, index, rawSpecs(item, ["케이스", "VGA 공간", "파워 공간"])),
    category: "case",
    supportedBoards: boards.length ? boards : ["ATX", "M-ATX", "M-ITX"],
    gpuClearanceMm: numberOf(text, [/VGA\s*길이\s*:?\s*(\d+)\s*mm/i, /그래픽카드\s*장착\s*길이\s*:?\s*(\d+)\s*mm/i], 360),
    psuClearanceMm: numberOf(text, [/파워\s*장착\s*길이\s*:?\s*(\d+)(?:~\d+)?\s*mm/i], 180),
    cpuCoolerClearanceMm: numberOf(text, [/CPU쿨러\s*높이\s*:?\s*(\d+)\s*mm/i], 165),
    airflow: /메쉬|mesh|쿨링팬\s*:\s*총[5-9]/i.test(text) ? "high" : /쿨링팬|팬/i.test(text) ? "mesh" : "basic"
  };
}

function uniqueItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.sourceUrl || item.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function searchDanawa({ category, query, pages = 3, limit = 120 }) {
  if (!categoryUrls[category]) throw new Error("Unknown category");
  const cleanQuery = String(query ?? "").trim();
  if (cleanQuery.length < 2) return [];

  const pageNumbers = Array.from({ length: Math.max(1, Math.min(Number(pages) || 1, 5)) }, (_, index) => index + 1);
  const urls = pageNumbers.map(
    (page) =>
      `https://search.danawa.com/dsearch.php?module=goods&act=dispMain&k1=${encodeURIComponent(cleanQuery)}&page=${page}`
  );

  const htmls = await Promise.all(urls.map((url) => fetchHtml(url)));
  const rawItems = htmls.flatMap((html) => parseProducts(html, category));
  return uniqueItems(rawItems.map((item, index) => normalize(item, index))).slice(0, Math.max(1, Math.min(limit, 200)));
}

export async function handleDanawaSearchRequest(url) {
  const requestUrl = new URL(url, "http://localhost");
  return searchDanawa({
    category: requestUrl.searchParams.get("category"),
    query: requestUrl.searchParams.get("q"),
    pages: Number(requestUrl.searchParams.get("pages") ?? 3),
    limit: Number(requestUrl.searchParams.get("limit") ?? 120)
  });
}
