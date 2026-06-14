export type Category = "cpu" | "motherboard" | "gpu" | "psu" | "case";

export type Part = {
  id: string;
  category: Category;
  name: string;
  short: string;
  price: number;
  watts: number;
  socket?: "AM5" | "LGA1700";
  lengthMm?: number;
  capacityWatts?: number;
  clearanceMm?: number;
  tone: string;
};

export type Selection = Record<Category, string>;

export type ReportItem = {
  title: string;
  detail: string;
  status: "good" | "warn";
};

export const categories: { id: Category; label: string; helper: string }[] = [
  { id: "cpu", label: "CPU", helper: "소켓과 전력 기준" },
  { id: "motherboard", label: "Mainboard", helper: "CPU 소켓 비교" },
  { id: "gpu", label: "GPU", helper: "길이와 소비전력" },
  { id: "psu", label: "Power", helper: "권장 여유 전력" },
  { id: "case", label: "Case", helper: "그래픽카드 장착 공간" }
];

export const parts: Part[] = [
  { id: "cpu-7600", category: "cpu", name: "Ryzen 5 7600", short: "6C AM5", price: 245000, watts: 88, socket: "AM5", tone: "mint" },
  { id: "cpu-14600", category: "cpu", name: "Core i5-14600KF", short: "14C LGA", price: 342000, watts: 181, socket: "LGA1700", tone: "rose" },
  { id: "mb-b650", category: "motherboard", name: "B650 Creator WiFi", short: "AM5 DDR5", price: 218000, watts: 42, socket: "AM5", tone: "mint" },
  { id: "mb-z790", category: "motherboard", name: "Z790 Steel Pro", short: "LGA DDR5", price: 286000, watts: 49, socket: "LGA1700", tone: "rose" },
  { id: "gpu-4060", category: "gpu", name: "RTX 4060 Studio", short: "240mm", price: 438000, watts: 115, lengthMm: 240, tone: "sky" },
  { id: "gpu-4070s", category: "gpu", name: "RTX 4070 Super", short: "304mm", price: 862000, watts: 220, lengthMm: 304, tone: "amber" },
  { id: "psu-650", category: "psu", name: "650W Gold Modular", short: "650W", price: 109000, watts: 0, capacityWatts: 650, tone: "sky" },
  { id: "psu-850", category: "psu", name: "850W Gold Quiet", short: "850W", price: 158000, watts: 0, capacityWatts: 850, tone: "amber" },
  { id: "case-mini", category: "case", name: "M-Flow Compact", short: "280mm GPU", price: 84000, watts: 0, clearanceMm: 280, tone: "rose" },
  { id: "case-air", category: "case", name: "Airline Mesh 4F", short: "360mm GPU", price: 129000, watts: 0, clearanceMm: 360, tone: "mint" }
];

export const initialSelection: Selection = {
  cpu: "cpu-7600",
  motherboard: "mb-b650",
  gpu: "gpu-4060",
  psu: "psu-650",
  case: "case-air"
};

export function getPart(id: string) {
  const found = parts.find((part) => part.id === id);
  if (!found) throw new Error(`Unknown part: ${id}`);
  return found;
}

export function getSelectedParts(selection: Selection) {
  return categories.map((category) => getPart(selection[category.id]));
}

export function formatWon(value: number) {
  return `${Math.round(value / 10000).toLocaleString("ko-KR")}만원`;
}

export function getCompatibilityReport(selection: Selection): ReportItem[] {
  const cpu = getPart(selection.cpu);
  const motherboard = getPart(selection.motherboard);
  const gpu = getPart(selection.gpu);
  const psu = getPart(selection.psu);
  const pcCase = getPart(selection.case);
  const totalWatts = getSelectedParts(selection).reduce((sum, part) => sum + part.watts, 0);
  const safeWatts = Math.round((psu.capacityWatts ?? 0) * 0.72);

  return [
    cpu.socket === motherboard.socket
      ? { title: "CPU 소켓", detail: `${cpu.socket} 기준으로 메인보드와 맞습니다.`, status: "good" }
      : { title: "CPU 소켓", detail: `${cpu.socket} CPU와 ${motherboard.socket} 보드는 같이 쓸 수 없습니다.`, status: "warn" },
    totalWatts <= safeWatts
      ? { title: "파워 여유", detail: `예상 ${totalWatts}W, 권장 안전선 ${safeWatts}W 안쪽입니다.`, status: "good" }
      : { title: "파워 여유", detail: `예상 ${totalWatts}W가 안전선 ${safeWatts}W를 넘습니다.`, status: "warn" },
    (gpu.lengthMm ?? 0) <= (pcCase.clearanceMm ?? 0)
      ? { title: "케이스 공간", detail: `${gpu.lengthMm}mm GPU가 ${pcCase.clearanceMm}mm 공간에 들어갑니다.`, status: "good" }
      : { title: "케이스 공간", detail: `${gpu.lengthMm}mm GPU가 케이스 공간 ${pcCase.clearanceMm}mm보다 깁니다.`, status: "warn" }
  ];
}
