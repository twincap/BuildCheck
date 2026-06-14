import {
  getPart,
  type CasePart,
  type CpuPart,
  type GpuPart,
  type MemoryPart,
  type MotherboardPart,
  type PsuPart,
  type Selection
} from "../constants/data";

type Props = {
  selection: Selection;
};

const boardSizes: Record<MotherboardPart["formFactor"], { width: number; height: number }> = {
  ATX: { width: 54, height: 62 },
  "M-ATX": { width: 48, height: 48 },
  "M-ITX": { width: 34, height: 34 }
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function BuildPreview({ selection }: Props) {
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
    <section className="build-preview" aria-label="선택 부품 비율 프리뷰">
      <div className="preview-meta">
        <p className="eyebrow">Scale preview</p>
        <strong>{pcCase.name}</strong>
      </div>
      <div className="preview-case">
        <span className="preview-case-label">CASE {pcCase.gpuClearanceMm}mm GPU 공간</span>
        <div className="preview-board" style={{ height: `${board.height}%`, width: `${board.width}%` }}>
          <span>MAINBOARD {motherboard.formFactor}</span>
          <div className="preview-cpu" style={{ height: `${coolerHeight}%` }}>
            CPU
            <small>{cpu.socket}</small>
          </div>
          <div className="preview-ram">
            {Array.from({ length: ramCount }).map((_, index) => (
              <i key={index} />
            ))}
            <small>{memory.capacityGb}GB RAM</small>
          </div>
        </div>
        <div className="preview-gpu" style={{ width: `${gpuWidth}%` }}>
          <span>GPU</span>
          <strong>{gpu.lengthMm}mm</strong>
          <small>{gpu.vramGb}GB VRAM</small>
        </div>
        <div className="preview-psu" style={{ width: `${psuWidth}%` }}>
          <span>PSU</span>
          <strong>{psu.capacityWatts}W</strong>
        </div>
      </div>
    </section>
  );
}
