export type Category = "cpu" | "motherboard" | "memory" | "gpu" | "psu" | "case";

type Status = "good" | "warn" | "info";

export type ReportItem = {
  title: string;
  detail: string;
  status: Status;
};

type BasePart = {
  id: string;
  category: Category;
  maker: string;
  name: string;
  price: number;
  watts: number;
  dimensionsMm?: {
    width: number;
    height: number;
    depth: number;
  };
  tone: "mint" | "rose" | "sky" | "amber" | "violet" | "slate";
  specs: string[];
  details?: { label: string; value: string }[];
  keywords: string[];
  danawaCategoryUrl: string;
  source?: "curated" | "danawa";
  sourceUrl?: string;
};

export type CpuPart = BasePart & {
  category: "cpu";
  socket: "AM4" | "AM5" | "LGA1700" | "LGA1851";
  memoryType: "DDR4" | "DDR5";
  cores: number;
  threads: number;
  tdpWatts: number;
  boostGhz: number;
};

export type MotherboardPart = BasePart & {
  category: "motherboard";
  socket: CpuPart["socket"];
  memoryType: "DDR4" | "DDR5";
  chipset: string;
  formFactor: "ATX" | "M-ATX" | "M-ITX";
  memorySlots: number;
  maxMemoryGb: number;
  m2Slots: number;
};

export type MemoryPart = BasePart & {
  category: "memory";
  memoryType: "DDR4" | "DDR5";
  moduleType?: "데스크탑용" | "노트북용" | "PC용";
  capacityGb: number;
  modules: number;
  speedMhz: number;
};

export type GpuPart = BasePart & {
  category: "gpu";
  vramGb: number;
  lengthMm: number;
  recommendedPsuWatts: number;
  connector: "8pin" | "12VHPWR" | "12V-2x6";
  interface: "PCIe 4.0" | "PCIe 5.0";
};

export type PsuPart = BasePart & {
  category: "psu";
  capacityWatts: number;
  rating: "Bronze" | "Gold" | "Platinum";
  formFactor: "ATX" | "SFX";
  depthMm: number;
  pcie5Ready: boolean;
};

export type CasePart = BasePart & {
  category: "case";
  supportedBoards: MotherboardPart["formFactor"][];
  gpuClearanceMm: number;
  psuClearanceMm: number;
  cpuCoolerClearanceMm: number;
  airflow: "basic" | "mesh" | "high";
};

export type Part = CpuPart | MotherboardPart | MemoryPart | GpuPart | PsuPart | CasePart;
export type Selection = Record<Category, string>;

export const danawaCategoryUrls: Record<Category, string> = {
  cpu: "https://prod.danawa.com/list/?cate=112747",
  motherboard: "https://prod.danawa.com/list/?cate=112751",
  memory: "https://prod.danawa.com/list/?cate=112752",
  gpu: "https://prod.danawa.com/list/?cate=112753",
  psu: "https://prod.danawa.com/list/?cate=112777",
  case: "https://prod.danawa.com/list/?cate=112775"
};

export const categories: { id: Category; label: string; helper: string }[] = [
  { id: "cpu", label: "CPU", helper: "소켓, 코어, 소비전력 확인" },
  { id: "motherboard", label: "메인보드", helper: "소켓, 램 규격, 폼팩터 확인" },
  { id: "memory", label: "RAM", helper: "DDR 규격, 용량, 클럭 확인" },
  { id: "gpu", label: "GPU", helper: "VRAM, 길이, 보조전원 확인" },
  { id: "psu", label: "파워", helper: "정격 출력, PCIe 5.0 케이블 확인" },
  { id: "case", label: "케이스", helper: "그래픽카드/파워 장착 공간 확인" }
];

const curatedParts: Part[] = [
  {
    id: "cpu-7500f",
    category: "cpu",
    maker: "AMD",
    name: "Ryzen 5 7500F",
    price: 188000,
    watts: 88,
    tone: "mint",
    specs: ["AM5", "6코어 12스레드", "DDR5", "최대 5.0GHz"],
    keywords: ["라이젠", "게이밍", "가성비", "AM5"],
    danawaCategoryUrl: danawaCategoryUrls.cpu,
    socket: "AM5",
    memoryType: "DDR5",
    cores: 6,
    threads: 12,
    tdpWatts: 65,
    boostGhz: 5.0
  },
  {
    id: "cpu-7800x3d",
    category: "cpu",
    maker: "AMD",
    name: "Ryzen 7 7800X3D",
    price: 452000,
    watts: 120,
    tone: "amber",
    specs: ["AM5", "8코어 16스레드", "3D V-Cache", "DDR5"],
    keywords: ["라이젠", "고성능", "게임", "AM5"],
    danawaCategoryUrl: danawaCategoryUrls.cpu,
    socket: "AM5",
    memoryType: "DDR5",
    cores: 8,
    threads: 16,
    tdpWatts: 120,
    boostGhz: 5.0
  },
  {
    id: "cpu-5600",
    category: "cpu",
    maker: "AMD",
    name: "Ryzen 5 5600",
    price: 126000,
    watts: 65,
    tone: "sky",
    specs: ["AM4", "6코어 12스레드", "DDR4", "최대 4.4GHz"],
    keywords: ["라이젠", "저가형", "AM4", "DDR4"],
    danawaCategoryUrl: danawaCategoryUrls.cpu,
    socket: "AM4",
    memoryType: "DDR4",
    cores: 6,
    threads: 12,
    tdpWatts: 65,
    boostGhz: 4.4
  },
  {
    id: "cpu-14400f",
    category: "cpu",
    maker: "Intel",
    name: "Core i5-14400F",
    price: 214000,
    watts: 148,
    tone: "rose",
    specs: ["LGA1700", "10코어 16스레드", "DDR5", "최대 4.7GHz"],
    keywords: ["인텔", "14세대", "LGA1700", "게이밍"],
    danawaCategoryUrl: danawaCategoryUrls.cpu,
    socket: "LGA1700",
    memoryType: "DDR5",
    cores: 10,
    threads: 16,
    tdpWatts: 65,
    boostGhz: 4.7
  },
  {
    id: "cpu-14600kf",
    category: "cpu",
    maker: "Intel",
    name: "Core i5-14600KF",
    price: 326000,
    watts: 181,
    tone: "violet",
    specs: ["LGA1700", "14코어 20스레드", "DDR5", "오버클럭"],
    keywords: ["인텔", "K", "고성능", "LGA1700"],
    danawaCategoryUrl: danawaCategoryUrls.cpu,
    socket: "LGA1700",
    memoryType: "DDR5",
    cores: 14,
    threads: 20,
    tdpWatts: 125,
    boostGhz: 5.3
  },
  {
    id: "cpu-245k",
    category: "cpu",
    maker: "Intel",
    name: "Core Ultra 5 245K",
    price: 398000,
    watts: 159,
    tone: "slate",
    specs: ["LGA1851", "14코어 14스레드", "DDR5", "PCIe 5.0"],
    keywords: ["인텔", "울트라", "LGA1851", "최신"],
    danawaCategoryUrl: danawaCategoryUrls.cpu,
    socket: "LGA1851",
    memoryType: "DDR5",
    cores: 14,
    threads: 14,
    tdpWatts: 125,
    boostGhz: 5.2
  },
  {
    id: "mb-b650m-mortar",
    category: "motherboard",
    maker: "MSI",
    name: "MAG B650M Mortar WIFI",
    price: 229000,
    watts: 42,
    tone: "mint",
    specs: ["AM5", "DDR5", "M-ATX", "M.2 2개"],
    keywords: ["B650", "AM5", "와이파이", "DDR5"],
    danawaCategoryUrl: danawaCategoryUrls.motherboard,
    socket: "AM5",
    memoryType: "DDR5",
    chipset: "B650",
    formFactor: "M-ATX",
    memorySlots: 4,
    maxMemoryGb: 192,
    m2Slots: 2
  },
  {
    id: "mb-b650-plus",
    category: "motherboard",
    maker: "ASUS",
    name: "TUF Gaming B650-PLUS",
    price: 263000,
    watts: 45,
    tone: "amber",
    specs: ["AM5", "DDR5", "ATX", "강한 전원부"],
    keywords: ["B650", "TUF", "ATX", "AM5"],
    danawaCategoryUrl: danawaCategoryUrls.motherboard,
    socket: "AM5",
    memoryType: "DDR5",
    chipset: "B650",
    formFactor: "ATX",
    memorySlots: 4,
    maxMemoryGb: 192,
    m2Slots: 3
  },
  {
    id: "mb-b550m-pro4",
    category: "motherboard",
    maker: "ASRock",
    name: "B550M Pro4",
    price: 119000,
    watts: 36,
    tone: "sky",
    specs: ["AM4", "DDR4", "M-ATX", "M.2 2개"],
    keywords: ["B550", "AM4", "DDR4", "가성비"],
    danawaCategoryUrl: danawaCategoryUrls.motherboard,
    socket: "AM4",
    memoryType: "DDR4",
    chipset: "B550",
    formFactor: "M-ATX",
    memorySlots: 4,
    maxMemoryGb: 128,
    m2Slots: 2
  },
  {
    id: "mb-b760m-a",
    category: "motherboard",
    maker: "ASUS",
    name: "PRIME B760M-A WIFI D5",
    price: 188000,
    watts: 39,
    tone: "rose",
    specs: ["LGA1700", "DDR5", "M-ATX", "Wi-Fi"],
    keywords: ["B760", "LGA1700", "DDR5", "인텔"],
    danawaCategoryUrl: danawaCategoryUrls.motherboard,
    socket: "LGA1700",
    memoryType: "DDR5",
    chipset: "B760",
    formFactor: "M-ATX",
    memorySlots: 4,
    maxMemoryGb: 192,
    m2Slots: 2
  },
  {
    id: "mb-z790-elite",
    category: "motherboard",
    maker: "GIGABYTE",
    name: "Z790 AORUS ELITE AX",
    price: 318000,
    watts: 55,
    tone: "violet",
    specs: ["LGA1700", "DDR5", "ATX", "M.2 4개"],
    keywords: ["Z790", "AORUS", "LGA1700", "고급"],
    danawaCategoryUrl: danawaCategoryUrls.motherboard,
    socket: "LGA1700",
    memoryType: "DDR5",
    chipset: "Z790",
    formFactor: "ATX",
    memorySlots: 4,
    maxMemoryGb: 192,
    m2Slots: 4
  },
  {
    id: "mb-b860-g",
    category: "motherboard",
    maker: "ASUS",
    name: "ROG Strix B860-G Gaming",
    price: 342000,
    watts: 48,
    tone: "slate",
    specs: ["LGA1851", "DDR5", "M-ATX", "PCIe 5.0"],
    keywords: ["B860", "LGA1851", "인텔", "최신"],
    danawaCategoryUrl: danawaCategoryUrls.motherboard,
    socket: "LGA1851",
    memoryType: "DDR5",
    chipset: "B860",
    formFactor: "M-ATX",
    memorySlots: 4,
    maxMemoryGb: 192,
    m2Slots: 3
  },
  {
    id: "ram-ddr5-5600-32",
    category: "memory",
    maker: "Samsung",
    name: "DDR5-5600 32GB",
    price: 118000,
    watts: 9,
    tone: "mint",
    specs: ["데스크탑용", "DDR5", "32GB", "5600MHz"],
    keywords: ["삼성", "DDR5", "32GB", "5600"],
    danawaCategoryUrl: danawaCategoryUrls.memory,
    memoryType: "DDR5",
    moduleType: "데스크탑용",
    capacityGb: 32,
    modules: 1,
    speedMhz: 5600
  },
  {
    id: "ram-ddr5-6000-32",
    category: "memory",
    maker: "TeamGroup",
    name: "T-Create DDR5-6000 32GB Kit",
    price: 159000,
    watts: 12,
    tone: "amber",
    specs: ["데스크탑용", "DDR5", "32GB", "6000MHz"],
    keywords: ["팀그룹", "DDR5", "6000", "튜닝램"],
    danawaCategoryUrl: danawaCategoryUrls.memory,
    memoryType: "DDR5",
    moduleType: "데스크탑용",
    capacityGb: 32,
    modules: 2,
    speedMhz: 6000
  },
  {
    id: "ram-ddr4-3200-16",
    category: "memory",
    maker: "Samsung",
    name: "DDR4-3200 16GB",
    price: 42000,
    watts: 6,
    tone: "sky",
    specs: ["데스크탑용", "DDR4", "16GB", "3200MHz"],
    keywords: ["삼성", "DDR4", "16GB", "3200"],
    danawaCategoryUrl: danawaCategoryUrls.memory,
    memoryType: "DDR4",
    moduleType: "데스크탑용",
    capacityGb: 16,
    modules: 1,
    speedMhz: 3200
  },
  {
    id: "ram-ddr4-3600-32",
    category: "memory",
    maker: "Corsair",
    name: "Vengeance LPX DDR4-3600 32GB",
    price: 96000,
    watts: 10,
    tone: "rose",
    specs: ["데스크탑용", "DDR4", "32GB", "3600MHz"],
    keywords: ["커세어", "DDR4", "32GB", "3600"],
    danawaCategoryUrl: danawaCategoryUrls.memory,
    memoryType: "DDR4",
    moduleType: "데스크탑용",
    capacityGb: 32,
    modules: 2,
    speedMhz: 3600
  },
  {
    id: "ram-ddr5-6400-32",
    category: "memory",
    maker: "G.SKILL",
    name: "Ripjaws S5 DDR5-6400 32GB",
    price: 182000,
    watts: 12,
    tone: "violet",
    specs: ["데스크탑용", "DDR5", "32GB", "6400MHz"],
    keywords: ["지스킬", "DDR5", "6400", "고클럭"],
    danawaCategoryUrl: danawaCategoryUrls.memory,
    memoryType: "DDR5",
    moduleType: "데스크탑용",
    capacityGb: 32,
    modules: 2,
    speedMhz: 6400
  },
  {
    id: "gpu-4060",
    category: "gpu",
    maker: "NVIDIA",
    name: "GeForce RTX 4060 8GB",
    price: 398000,
    watts: 115,
    tone: "sky",
    specs: ["8GB VRAM", "240mm", "권장 550W", "8pin"],
    keywords: ["RTX4060", "엔비디아", "8GB", "FHD"],
    danawaCategoryUrl: danawaCategoryUrls.gpu,
    vramGb: 8,
    lengthMm: 240,
    recommendedPsuWatts: 550,
    connector: "8pin",
    interface: "PCIe 4.0"
  },
  {
    id: "gpu-4060ti-16",
    category: "gpu",
    maker: "NVIDIA",
    name: "GeForce RTX 4060 Ti 16GB",
    price: 594000,
    watts: 165,
    tone: "mint",
    specs: ["16GB VRAM", "250mm", "권장 600W", "8pin"],
    keywords: ["RTX4060Ti", "16GB", "AI", "작업"],
    danawaCategoryUrl: danawaCategoryUrls.gpu,
    vramGb: 16,
    lengthMm: 250,
    recommendedPsuWatts: 600,
    connector: "8pin",
    interface: "PCIe 4.0"
  },
  {
    id: "gpu-4070s",
    category: "gpu",
    maker: "NVIDIA",
    name: "GeForce RTX 4070 SUPER 12GB",
    price: 872000,
    watts: 220,
    tone: "amber",
    specs: ["12GB VRAM", "304mm", "권장 650W", "12VHPWR"],
    keywords: ["RTX4070S", "엔비디아", "QHD", "12GB"],
    danawaCategoryUrl: danawaCategoryUrls.gpu,
    vramGb: 12,
    lengthMm: 304,
    recommendedPsuWatts: 650,
    connector: "12VHPWR",
    interface: "PCIe 4.0"
  },
  {
    id: "gpu-5070",
    category: "gpu",
    maker: "NVIDIA",
    name: "GeForce RTX 5070 12GB",
    price: 1018000,
    watts: 250,
    tone: "violet",
    specs: ["12GB VRAM", "310mm", "권장 750W", "12V-2x6"],
    keywords: ["RTX5070", "엔비디아", "최신", "12V-2x6"],
    danawaCategoryUrl: danawaCategoryUrls.gpu,
    vramGb: 12,
    lengthMm: 310,
    recommendedPsuWatts: 750,
    connector: "12V-2x6",
    interface: "PCIe 5.0"
  },
  {
    id: "gpu-7800xt",
    category: "gpu",
    maker: "AMD",
    name: "Radeon RX 7800 XT 16GB",
    price: 756000,
    watts: 263,
    tone: "rose",
    specs: ["16GB VRAM", "302mm", "권장 700W", "8pin x2"],
    keywords: ["라데온", "7800XT", "16GB", "QHD"],
    danawaCategoryUrl: danawaCategoryUrls.gpu,
    vramGb: 16,
    lengthMm: 302,
    recommendedPsuWatts: 700,
    connector: "8pin",
    interface: "PCIe 4.0"
  },
  {
    id: "gpu-5060ti-16",
    category: "gpu",
    maker: "NVIDIA",
    name: "GeForce RTX 5060 Ti 16GB",
    price: 622000,
    watts: 180,
    tone: "slate",
    specs: ["16GB VRAM", "245mm", "권장 650W", "8pin"],
    keywords: ["RTX5060Ti", "16GB", "FHD", "최신"],
    danawaCategoryUrl: danawaCategoryUrls.gpu,
    vramGb: 16,
    lengthMm: 245,
    recommendedPsuWatts: 650,
    connector: "8pin",
    interface: "PCIe 5.0"
  },
  {
    id: "psu-600-bronze",
    category: "psu",
    maker: "Micronics",
    name: "Classic II 600W Bronze",
    price: 64000,
    watts: 0,
    tone: "sky",
    specs: ["600W", "Bronze", "ATX", "8pin"],
    keywords: ["600W", "브론즈", "가성비", "ATX"],
    danawaCategoryUrl: danawaCategoryUrls.psu,
    capacityWatts: 600,
    rating: "Bronze",
    formFactor: "ATX",
    depthMm: 150,
    pcie5Ready: false
  },
  {
    id: "psu-650-gold",
    category: "psu",
    maker: "SuperFlower",
    name: "Leadex III Gold 650W",
    price: 109000,
    watts: 0,
    tone: "mint",
    specs: ["650W", "Gold", "ATX", "모듈러"],
    keywords: ["650W", "골드", "모듈러", "ATX"],
    danawaCategoryUrl: danawaCategoryUrls.psu,
    capacityWatts: 650,
    rating: "Gold",
    formFactor: "ATX",
    depthMm: 160,
    pcie5Ready: false
  },
  {
    id: "psu-750-atx31",
    category: "psu",
    maker: "FSP",
    name: "Hydro G Pro 750W ATX 3.1",
    price: 142000,
    watts: 0,
    tone: "amber",
    specs: ["750W", "Gold", "ATX 3.1", "12V-2x6"],
    keywords: ["750W", "ATX3.1", "PCIe5", "12V-2x6"],
    danawaCategoryUrl: danawaCategoryUrls.psu,
    capacityWatts: 750,
    rating: "Gold",
    formFactor: "ATX",
    depthMm: 150,
    pcie5Ready: true
  },
  {
    id: "psu-850-atx31",
    category: "psu",
    maker: "Seasonic",
    name: "FOCUS GX-850 ATX 3.1",
    price: 188000,
    watts: 0,
    tone: "violet",
    specs: ["850W", "Gold", "ATX 3.1", "12V-2x6"],
    keywords: ["850W", "시소닉", "ATX3.1", "PCIe5"],
    danawaCategoryUrl: danawaCategoryUrls.psu,
    capacityWatts: 850,
    rating: "Gold",
    formFactor: "ATX",
    depthMm: 140,
    pcie5Ready: true
  },
  {
    id: "psu-1000-gold",
    category: "psu",
    maker: "Corsair",
    name: "RM1000e Gold ATX 3.0",
    price: 238000,
    watts: 0,
    tone: "slate",
    specs: ["1000W", "Gold", "ATX 3.0", "12VHPWR"],
    keywords: ["1000W", "커세어", "고성능", "PCIe5"],
    danawaCategoryUrl: danawaCategoryUrls.psu,
    capacityWatts: 1000,
    rating: "Gold",
    formFactor: "ATX",
    depthMm: 150,
    pcie5Ready: true
  },
  {
    id: "psu-850-platinum",
    category: "psu",
    maker: "Antec",
    name: "NE1000G M Platinum 850W",
    price: 216000,
    watts: 0,
    tone: "rose",
    specs: ["850W", "Platinum", "ATX", "12VHPWR"],
    keywords: ["850W", "플래티넘", "저소음", "PCIe5"],
    danawaCategoryUrl: danawaCategoryUrls.psu,
    capacityWatts: 850,
    rating: "Platinum",
    formFactor: "ATX",
    depthMm: 160,
    pcie5Ready: true
  },
  {
    id: "case-g31",
    category: "case",
    maker: "ABKO",
    name: "G31 Tempered Glass",
    price: 64000,
    watts: 0,
    tone: "mint",
    specs: ["ATX/M-ATX", "GPU 400mm", "PSU 200mm", "메쉬"],
    keywords: ["앱코", "미들타워", "메쉬", "가성비"],
    danawaCategoryUrl: danawaCategoryUrls.case,
    supportedBoards: ["ATX", "M-ATX", "M-ITX"],
    gpuClearanceMm: 400,
    psuClearanceMm: 200,
    cpuCoolerClearanceMm: 165,
    airflow: "mesh"
  },
  {
    id: "case-daven-aqua",
    category: "case",
    maker: "DAVEN",
    name: "AQUA Mesh",
    price: 82000,
    watts: 0,
    tone: "sky",
    specs: ["E-ATX/ATX", "GPU 390mm", "PSU 220mm", "전면 메쉬"],
    keywords: ["데이븐", "메쉬", "공간", "미들타워"],
    danawaCategoryUrl: danawaCategoryUrls.case,
    supportedBoards: ["ATX", "M-ATX", "M-ITX"],
    gpuClearanceMm: 390,
    psuClearanceMm: 220,
    cpuCoolerClearanceMm: 170,
    airflow: "high"
  },
  {
    id: "case-j540",
    category: "case",
    maker: "3RSYS",
    name: "J540 Quiet",
    price: 96000,
    watts: 0,
    tone: "rose",
    specs: ["ATX/M-ATX", "GPU 295mm", "PSU 160mm", "저소음"],
    keywords: ["쓰리알", "저소음", "조용한", "ATX"],
    danawaCategoryUrl: danawaCategoryUrls.case,
    supportedBoards: ["ATX", "M-ATX", "M-ITX"],
    gpuClearanceMm: 295,
    psuClearanceMm: 160,
    cpuCoolerClearanceMm: 160,
    airflow: "basic"
  },
  {
    id: "case-stella",
    category: "case",
    maker: "Micronics",
    name: "WIZMAX Stella",
    price: 118000,
    watts: 0,
    tone: "amber",
    specs: ["ATX/M-ATX", "GPU 425mm", "PSU 200mm", "ARGB"],
    keywords: ["마이크로닉스", "스텔라", "넓은", "ARGB"],
    danawaCategoryUrl: danawaCategoryUrls.case,
    supportedBoards: ["ATX", "M-ATX", "M-ITX"],
    gpuClearanceMm: 425,
    psuClearanceMm: 200,
    cpuCoolerClearanceMm: 175,
    airflow: "high"
  },
  {
    id: "case-compact-matx",
    category: "case",
    maker: "darkFlash",
    name: "DLX21 Compact M",
    price: 73000,
    watts: 0,
    tone: "violet",
    specs: ["M-ATX", "GPU 280mm", "PSU 150mm", "컴팩트"],
    keywords: ["다크플래쉬", "작은", "M-ATX", "컴팩트"],
    danawaCategoryUrl: danawaCategoryUrls.case,
    supportedBoards: ["M-ATX", "M-ITX"],
    gpuClearanceMm: 280,
    psuClearanceMm: 150,
    cpuCoolerClearanceMm: 155,
    airflow: "mesh"
  },
  {
    id: "case-air-360",
    category: "case",
    maker: "NZXT",
    name: "H5 Flow RGB",
    price: 149000,
    watts: 0,
    tone: "slate",
    specs: ["ATX/M-ATX", "GPU 365mm", "PSU 200mm", "하단 팬"],
    keywords: ["NZXT", "H5", "Flow", "공기흐름"],
    danawaCategoryUrl: danawaCategoryUrls.case,
    supportedBoards: ["ATX", "M-ATX", "M-ITX"],
    gpuClearanceMm: 365,
    psuClearanceMm: 200,
    cpuCoolerClearanceMm: 165,
    airflow: "high"
  }
];

const livePartRegistry = new Map<string, Part>();

export const parts: Part[] = curatedParts;

export const initialSelection: Selection = {
  cpu: "cpu-7500f",
  motherboard: "mb-b650m-mortar",
  memory: "ram-ddr5-6000-32",
  gpu: "gpu-4060ti-16",
  psu: "psu-750-atx31",
  case: "case-g31"
};

export function getPart(id: string) {
  const found = parts.find((part) => part.id === id) ?? livePartRegistry.get(id);
  if (!found) throw new Error(`Unknown part: ${id}`);
  return found;
}

export function getPartsByCategory(category: Category) {
  return parts.filter((part) => part.category === category);
}

export function registerLiveParts(newParts: Part[]) {
  newParts.forEach((part) => livePartRegistry.set(part.id, part));
}

export function getSelectedParts(selection: Selection) {
  return categories.map((category) => getPart(selection[category.id]));
}

export function getSearchText(part: Part) {
  const rawText = [part.maker, part.name, part.category, ...part.specs, ...part.keywords].join(" ").toLowerCase();
  return `${rawText} ${compactSearch(rawText)}`;
}

export function compactSearch(value: string) {
  return value.toLowerCase().replace(/[\s._\-·/]+/g, "");
}

export function matchesPartSearch(part: Part, query: string) {
  const search = query.trim().toLowerCase();
  if (!search) return true;
  const text = getSearchText(part);
  return text.includes(search) || text.includes(compactSearch(search));
}

export function formatWon(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "가격 확인";
  if (value < 10000) return `${value.toLocaleString("ko-KR")}원`;
  const manWon = value / 10000;
  const display = manWon >= 10 ? Math.round(manWon) : Number(manWon.toFixed(1));
  return `${display.toLocaleString("ko-KR")}만원`;
}

export function getCategoryLabel(category: Category) {
  return categories.find((item) => item.id === category)?.label ?? category;
}

function isCableCompatible(gpu: GpuPart, psu: PsuPart) {
  if (gpu.connector === "8pin") return true;
  return psu.pcie5Ready;
}

export function getCompatibilityReport(selection: Selection): ReportItem[] {
  const cpu = getPart(selection.cpu) as CpuPart;
  const motherboard = getPart(selection.motherboard) as MotherboardPart;
  const memory = getPart(selection.memory) as MemoryPart;
  const gpu = getPart(selection.gpu) as GpuPart;
  const psu = getPart(selection.psu) as PsuPart;
  const pcCase = getPart(selection.case) as CasePart;
  const totalWatts = getSelectedParts(selection).reduce((sum, part) => sum + part.watts, 0);
  const safeWatts = Math.round(psu.capacityWatts * 0.72);
  const wattNeed = Math.max(totalWatts + 120, gpu.recommendedPsuWatts);

  return [
    cpu.socket === motherboard.socket
      ? { title: "CPU 소켓", detail: `${cpu.socket} 기준으로 CPU와 메인보드가 맞습니다.`, status: "good" }
      : { title: "CPU 소켓", detail: `${cpu.socket} CPU는 ${motherboard.socket} 보드에 장착할 수 없습니다.`, status: "warn" },
    cpu.memoryType === motherboard.memoryType && memory.memoryType === motherboard.memoryType
      ? { title: "RAM 규격", detail: `${memory.memoryType} 메모리가 보드/CPU 기준과 맞습니다.`, status: "good" }
      : {
          title: "RAM 규격",
          detail: `CPU ${cpu.memoryType}, 보드 ${motherboard.memoryType}, RAM ${memory.memoryType} 조합을 다시 확인해야 합니다.`,
          status: "warn"
        },
    motherboard.maxMemoryGb >= memory.capacityGb && motherboard.memorySlots >= memory.modules
      ? { title: "RAM 용량/슬롯", detail: `${memory.capacityGb}GB ${memory.modules}개 구성이 보드 한도 안에 있습니다.`, status: "good" }
      : { title: "RAM 용량/슬롯", detail: `보드 한도 ${motherboard.maxMemoryGb}GB, 슬롯 ${motherboard.memorySlots}개를 넘습니다.`, status: "warn" },
    pcCase.supportedBoards.includes(motherboard.formFactor)
      ? { title: "메인보드 크기", detail: `${motherboard.formFactor} 보드가 케이스 지원 목록에 있습니다.`, status: "good" }
      : { title: "메인보드 크기", detail: `${motherboard.formFactor} 보드는 이 케이스에 맞지 않습니다.`, status: "warn" },
    gpu.lengthMm <= pcCase.gpuClearanceMm
      ? { title: "GPU 장착 공간", detail: `${gpu.lengthMm}mm GPU가 ${pcCase.gpuClearanceMm}mm 공간 안에 들어갑니다.`, status: "good" }
      : { title: "GPU 장착 공간", detail: `${gpu.lengthMm}mm GPU가 케이스 공간 ${pcCase.gpuClearanceMm}mm보다 깁니다.`, status: "warn" },
    psu.capacityWatts >= wattNeed && totalWatts <= safeWatts
      ? { title: "파워 용량", detail: `예상 ${totalWatts}W, 권장 기준 ${wattNeed}W를 ${psu.capacityWatts}W 파워가 감당합니다.`, status: "good" }
      : { title: "파워 용량", detail: `예상 ${totalWatts}W, 권장 ${wattNeed}W입니다. 더 큰 파워가 안전합니다.`, status: "warn" },
    isCableCompatible(gpu, psu)
      ? { title: "GPU 보조전원", detail: `${gpu.connector} 그래픽카드 전원 조건을 파워가 지원합니다.`, status: "good" }
      : { title: "GPU 보조전원", detail: `${gpu.connector} GPU는 PCIe 5.0/ATX 3.x 파워가 더 안전합니다.`, status: "warn" },
    psu.depthMm <= pcCase.psuClearanceMm
      ? { title: "파워 장착 공간", detail: `${psu.depthMm}mm 파워가 ${pcCase.psuClearanceMm}mm 공간 안에 들어갑니다.`, status: "good" }
      : { title: "파워 장착 공간", detail: `${psu.depthMm}mm 파워가 케이스 파워 공간보다 깁니다.`, status: "warn" },
    gpu.vramGb >= 12
      ? { title: "GPU VRAM", detail: `${gpu.vramGb}GB VRAM이라 QHD/작업용 여유가 좋습니다.`, status: "good" }
      : { title: "GPU VRAM", detail: `${gpu.vramGb}GB VRAM입니다. FHD 중심이면 가능, 작업/고해상도면 12GB 이상 권장입니다.`, status: "info" }
  ];
}
