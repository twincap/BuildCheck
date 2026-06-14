import rawCatalog from "./danawa-raw.generated.json";
import type {
  CasePart,
  Category,
  CpuPart,
  GpuPart,
  MemoryPart,
  MotherboardPart,
  Part,
  PsuPart
} from "./data";

type RawItem = {
  category: Category;
  name: string;
  spec: string;
  price: number | null;
  link: string;
  rawText: string;
  source?: string;
  sourceQuery?: string | null;
};

const categoryUrls: Record<Category, string> = {
  cpu: "https://prod.danawa.com/list/?cate=112747",
  motherboard: "https://prod.danawa.com/list/?cate=112751",
  memory: "https://prod.danawa.com/list/?cate=112752",
  gpu: "https://prod.danawa.com/list/?cate=112753",
  psu: "https://prod.danawa.com/list/?cate=112777",
  case: "https://prod.danawa.com/list/?cate=112775"
};

const toneByCategory: Record<Category, Part["tone"]> = {
  cpu: "mint",
  motherboard: "rose",
  memory: "sky",
  gpu: "amber",
  psu: "violet",
  case: "slate"
};

type CommonPartFields = {
  id: string;
  category: Category;
  maker: string;
  name: string;
  price: number;
  watts: number;
  tone: Part["tone"];
  specs: string[];
  keywords: string[];
  danawaCategoryUrl: string;
  source: "danawa";
  sourceUrl: string;
};

function textOf(item: RawItem) {
  return `${item.name} ${item.spec} ${item.rawText}`;
}

function makerOf(name: string) {
  return name.split(/\s+/)[0]?.replace(/^\[.*?\]/, "") || "Danawa";
}

function priceOf(item: RawItem) {
  if (item.price && item.price > 1000) return item.price;
  const found = textOf(item).match(/(\d{1,3}(?:,\d{3})+)\s*원/);
  return found ? Number(found[1].replace(/,/g, "")) : 0;
}

function numberOf(text: string, patterns: RegExp[], fallback: number) {
  for (const pattern of patterns) {
    const found = text.match(pattern);
    if (found) {
      const value = Number(found.slice(1).find(Boolean)?.replace(/,/g, ""));
      if (Number.isFinite(value)) return value;
    }
  }
  return fallback;
}

function socketOf(text: string): CpuPart["socket"] {
  if (/AM4|소켓\s*AM4/i.test(text)) return "AM4";
  if (/LGA\s*1851|소켓\s*1851|1851/i.test(text)) return "LGA1851";
  if (/LGA\s*1700|소켓\s*1700|1700/i.test(text)) return "LGA1700";
  return "AM5";
}

function memoryTypeOf(text: string): "DDR4" | "DDR5" {
  return /DDR4/i.test(text) && !/DDR5/i.test(text) ? "DDR4" : "DDR5";
}

function formFactorOf(text: string): MotherboardPart["formFactor"] {
  if (/M-ITX|M\.ITX|Mini-ITX|ITX/i.test(text)) return "M-ITX";
  if (/M-ATX|M\.ATX|Micro-ATX/i.test(text)) return "M-ATX";
  return "ATX";
}

function gpuModelPower(text: string) {
  if (/5090/i.test(text)) return { watts: 575, psu: 1000, length: 360, connector: "12V-2x6" as const };
  if (/5080/i.test(text)) return { watts: 360, psu: 850, length: 330, connector: "12V-2x6" as const };
  if (/5070/i.test(text)) return { watts: 250, psu: 750, length: 310, connector: "12V-2x6" as const };
  if (/5060/i.test(text)) return { watts: 180, psu: 650, length: 250, connector: "8pin" as const };
  if (/4090/i.test(text)) return { watts: 450, psu: 850, length: 340, connector: "12VHPWR" as const };
  if (/4080|4070/i.test(text)) return { watts: 260, psu: 750, length: 310, connector: "12VHPWR" as const };
  return { watts: 180, psu: 650, length: 270, connector: "8pin" as const };
}

function gpuConnectorOf(text: string): GpuPart["connector"] {
  if (/12V-2x6|ATX\s*3\.1|RTX\s*50/i.test(text)) return "12V-2x6";
  if (/12VHPWR|16핀|RTX\s*40/i.test(text)) return "12VHPWR";
  return gpuModelPower(text).connector;
}

function rawSpecs(item: RawItem, fallback: string[]) {
  const pieces = item.spec
    .split("/")
    .map((piece) => piece.trim())
    .filter(Boolean)
    .slice(0, 4);
  return pieces.length ? pieces : fallback;
}

function base(item: RawItem, index: number, specs: string[]): CommonPartFields {
  return {
    id: `danawa-${item.category}-${index}`,
    category: item.category,
    maker: makerOf(item.name),
    name: item.name,
    price: priceOf(item),
    watts: 0,
    tone: toneByCategory[item.category],
    specs,
    keywords: [item.name, item.spec, item.rawText, item.sourceQuery ?? "", "다나와"],
    danawaCategoryUrl: categoryUrls[item.category],
    source: "danawa",
    sourceUrl: item.link
  };
}

function normalizeCpu(item: RawItem, index: number): CpuPart {
  const text = textOf(item);
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

function normalizeMotherboard(item: RawItem, index: number): MotherboardPart {
  const text = textOf(item);
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

function normalizeMemory(item: RawItem, index: number): MemoryPart {
  const text = textOf(item);
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

function normalizeGpu(item: RawItem, index: number): GpuPart {
  const text = textOf(item);
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

function normalizePsu(item: RawItem, index: number): PsuPart {
  const text = textOf(item);
  const capacity = numberOf(text, [/(\d{3,4})\s*W/i], 700);
  const pcie5Ready = /ATX\s*3|PCIe\s*5|12V-2x6|12VHPWR|16핀/i.test(text);
  const rating: PsuPart["rating"] = /플래티넘|Platinum/i.test(text) ? "Platinum" : /골드|Gold/i.test(text) ? "Gold" : "Bronze";
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

function normalizeCase(item: RawItem, index: number): CasePart {
  const text = textOf(item);
  const boards: MotherboardPart["formFactor"][] = [];
  if (/ATX/i.test(text)) boards.push("ATX");
  if (/M-ATX|M\.ATX|Micro-ATX/i.test(text)) boards.push("M-ATX");
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

function normalize(item: RawItem, index: number): Part | null {
  if (!item.name || !item.category) return null;
  switch (item.category) {
    case "cpu":
      return normalizeCpu(item, index);
    case "motherboard":
      return normalizeMotherboard(item, index);
    case "memory":
      return normalizeMemory(item, index);
    case "gpu":
      return normalizeGpu(item, index);
    case "psu":
      return normalizePsu(item, index);
    case "case":
      return normalizeCase(item, index);
    default:
      return null;
  }
}

export const danawaParts = (rawCatalog.items as RawItem[])
  .map((item, index) => normalize(item, index))
  .filter((item): item is Part => Boolean(item));
