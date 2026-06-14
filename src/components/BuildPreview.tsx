import {
  useMemo,
  type CSSProperties
} from "react";
import {
  getPart,
  type CasePart,
  type Category,
  type CpuPart,
  type GpuPart,
  type MemoryPart,
  type MotherboardPart,
  type Part,
  type PsuPart,
  type Selection
} from "../constants/data";

type PreviewKey = "motherboard" | "cpu" | "memory" | "gpu" | "psu";
type PreviewBox = { width: number; height: number; depth: number };

type Props = {
  selection: Selection;
  onNavigate: (category: Category) => void;
};


const keyToCategory: Record<PreviewKey, Category> = {
  motherboard: "motherboard",
  cpu: "cpu",
  memory: "memory",
  gpu: "gpu",
  psu: "psu"
};

function dimensions(part: Part): PreviewBox {
  if (part.dimensionsMm) return part.dimensionsMm;

  if (part.category === "cpu") return { width: 40, height: 40, depth: 7 };
  if (part.category === "motherboard") {
    if (part.formFactor === "ATX") return { width: 305, height: 244, depth: 35 };
    if (part.formFactor === "M-ITX") return { width: 170, height: 170, depth: 30 };
    return { width: 244, height: 244, depth: 35 };
  }
  if (part.category === "memory") {
    return part.moduleType === "노트북용" ? { width: 70, height: 30, depth: 4 } : { width: 133, height: 32, depth: 8 };
  }
  if (part.category === "gpu") return { width: part.lengthMm, height: 120, depth: part.vramGb >= 16 ? 60 : 45 };
  if (part.category === "psu") return { width: 150, height: 86, depth: part.depthMm };
  return { width: 210, height: 455, depth: Math.max(part.gpuClearanceMm + 40, 430) };
}

function caseSpace(pcCase: CasePart): PreviewBox {
  const box = dimensions(pcCase);
  return {
    width: Math.max(box.depth, pcCase.gpuClearanceMm + 40),
    height: box.height,
    depth: box.width
  };
}

export function BuildPreview({ selection, onNavigate }: Props) {
  const cpu = getPart(selection.cpu) as CpuPart;
  const motherboard = getPart(selection.motherboard) as MotherboardPart;
  const memory = getPart(selection.memory) as MemoryPart;
  const gpu = getPart(selection.gpu) as GpuPart;
  const psu = getPart(selection.psu) as PsuPart;
  const pcCase = getPart(selection.case) as CasePart;
  const ramLabel = memory.moduleType === "노트북용" ? "노트북 RAM" : "PC RAM";

  const parts = useMemo(() => ({
    cpu, motherboard, memory, gpu, psu
  }), [cpu, gpu, memory, motherboard, psu]);

  const space = useMemo(() => caseSpace(pcCase), [pcCase]);

  const partBoxes = useMemo(() => ({
    motherboard: dimensions(motherboard),
    cpu: dimensions(cpu),
    memory: dimensions(memory),
    gpu: dimensions(gpu),
    psu: dimensions(psu)
  }), [cpu, gpu, memory, motherboard, psu]);

  function formatDimension(box: PreviewBox) {
    return `${box.width}×${box.height}×${box.depth}mm`;
  }

  const partData = [
    {
      key: "motherboard" as PreviewKey,
      label: "메인보드",
      icon: "🖥️",
      details: [motherboard.formFactor, `${formatDimension(partBoxes.motherboard)}`],
      category: "motherboard" as Category
    },
    {
      key: "cpu" as PreviewKey,
      label: "CPU",
      icon: "⚙️",
      details: [cpu.socket, `${formatDimension(partBoxes.cpu)}`],
      category: "cpu" as Category
    },
    {
      key: "memory" as PreviewKey,
      label: "RAM",
      icon: "🧠",
      details: [`${memory.capacityGb}GB ${ramLabel}`, `${formatDimension(partBoxes.memory)}`],
      category: "memory" as Category
    },
    {
      key: "gpu" as PreviewKey,
      label: "GPU",
      icon: "🎮",
      details: [`${gpu.vramGb}GB VRAM`, `${formatDimension(partBoxes.gpu)}`],
      category: "gpu" as Category
    },
    {
      key: "psu" as PreviewKey,
      label: "파워",
      icon: "🔌",
      details: [`${psu.capacityWatts}W`, `${formatDimension(partBoxes.psu)}`],
      category: "psu" as Category
    }
  ];

  return (
    <section className="build-preview">
      <div className="preview-header">
        <div>
          <h3>장착 프리뷰</h3>
          <p className="preview-case-name">{pcCase.name}</p>
        </div>
      </div>
      <div className="preview-grid">
        {partData.map((part) => (
          <button
            key={part.key}
            className={`preview-card preview-${part.key}`}
            onClick={() => onNavigate(part.category)}
            type="button"
          >
            <div className="card-icon">{part.icon}</div>
            <div className="card-content">
              <strong>{part.label}</strong>
              <div className="card-details">
                {part.details.map((detail, i) => (
                  <small key={i}>{detail}</small>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
