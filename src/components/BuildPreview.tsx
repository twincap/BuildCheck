import {
  getPart,
  type CasePart,
  type Category,
  type CpuPart,
  type GpuPart,
  type MemoryPart,
  type MotherboardPart,
  type PsuPart,
  type Selection
} from "../constants/data";

type PreviewMode = "2d" | "3d";

type Props = {
  mode: PreviewMode;
  selection: Selection;
  onModeChange: (mode: PreviewMode) => void;
  onNavigate: (category: Category) => void;
};

const boardSizes: Record<MotherboardPart["formFactor"], { width: number; height: number }> = {
  ATX: { width: 54, height: 62 },
  "M-ATX": { width: 48, height: 48 },
  "M-ITX": { width: 34, height: 34 }
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function BuildPreview({ mode, selection, onModeChange, onNavigate }: Props) {
  const cpu = getPart(selection.cpu) as CpuPart;
  const motherboard = getPart(selection.motherboard) as MotherboardPart;
  const memory = getPart(selection.memory) as MemoryPart;
  const gpu = getPart(selection.gpu) as GpuPart;
  const psu = getPart(selection.psu) as PsuPart;
  const pcCase = getPart(selection.case) as CasePart;

  const board = boardSizes[motherboard.formFactor];
  const gpuWidth = clamp((gpu.lengthMm / pcCase.gpuClearanceMm) * 70, 28, 78);
  const psuWidth = clamp((psu.depthMm / pcCase.psuClearanceMm) * 36, 18, 42);
  const coolerHeight = clamp((cpu.tdpWatts / pcCase.cpuCoolerClearanceMm) * 42, 14, 32);
  const ramCount = clamp(memory.modules, 1, 4);

  return (
    <section className={`build-preview is-${mode}`} aria-label="선택 부품 비율 프리뷰">
      <div className="preview-meta">
        <div>
          <p className="eyebrow">Fit view</p>
          <strong>{pcCase.name}</strong>
        </div>
        <div className="preview-mode" aria-label="프리뷰 모드">
          <button className={mode === "2d" ? "is-active" : ""} onClick={() => onModeChange("2d")} type="button">
            2D
          </button>
          <button className={mode === "3d" ? "is-active" : ""} onClick={() => onModeChange("3d")} type="button">
            3D
          </button>
        </div>
      </div>
      <div className="preview-case">
        <button className="preview-case-label" onClick={() => onNavigate("case")} type="button">
          Case {pcCase.gpuClearanceMm}mm
        </button>
        <div className="preview-board" style={{ height: `${board.height}%`, width: `${board.width}%` }}>
          <button className="preview-board-label" onClick={() => onNavigate("motherboard")} type="button">
            MainBoard {motherboard.formFactor}
          </button>
          <button className="preview-cpu" onClick={() => onNavigate("cpu")} style={{ height: `${coolerHeight}%` }} type="button">
            CPU
            <small>{cpu.socket}</small>
          </button>
          <button className="preview-ram" onClick={() => onNavigate("memory")} type="button">
            {Array.from({ length: ramCount }).map((_, index) => (
              <i key={index} />
            ))}
            <small>{memory.capacityGb}GB RAM</small>
          </button>
        </div>
        <button className="preview-gpu" onClick={() => onNavigate("gpu")} style={{ width: `${gpuWidth}%` }} type="button">
          <span>GPU</span>
          <strong>{gpu.lengthMm}mm</strong>
          <small>{gpu.vramGb}GB</small>
        </button>
        <button className="preview-psu" onClick={() => onNavigate("psu")} style={{ width: `${psuWidth}%` }} type="button">
          <span>Power</span>
          <strong>{psu.capacityWatts}W</strong>
        </button>
      </div>
    </section>
  );
}
