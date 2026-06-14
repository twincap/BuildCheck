import { useEffect, useRef, useState } from "react";
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
type PreviewKey = "motherboard" | "cpu" | "memory" | "gpu" | "psu";
type Position = { x: number; y: number };
type DragState = {
  key: PreviewKey;
  origin: Position;
  pointer: { x: number; y: number };
  moved: boolean;
};

type Props = {
  mode: PreviewMode;
  selection: Selection;
  onModeChange: (mode: PreviewMode) => void;
  onNavigate: (category: Category) => void;
};

const boardSizes: Record<MotherboardPart["formFactor"], { width: number; height: number }> = {
  ATX: { width: 48, height: 58 },
  "M-ATX": { width: 43, height: 48 },
  "M-ITX": { width: 30, height: 32 }
};

const defaultPositions: Record<PreviewKey, Position> = {
  motherboard: { x: 8, y: 20 },
  cpu: { x: 24, y: 39 },
  memory: { x: 45, y: 32 },
  gpu: { x: 16, y: 66 },
  psu: { x: 68, y: 78 }
};

const keyToCategory: Record<PreviewKey, Category> = {
  motherboard: "motherboard",
  cpu: "cpu",
  memory: "memory",
  gpu: "gpu",
  psu: "psu"
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function BuildPreview({ mode, selection, onModeChange, onNavigate }: Props) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [positions, setPositions] = useState<Record<PreviewKey, Position>>(defaultPositions);

  const cpu = getPart(selection.cpu) as CpuPart;
  const motherboard = getPart(selection.motherboard) as MotherboardPart;
  const memory = getPart(selection.memory) as MemoryPart;
  const gpu = getPart(selection.gpu) as GpuPart;
  const psu = getPart(selection.psu) as PsuPart;
  const pcCase = getPart(selection.case) as CasePart;

  const board = boardSizes[motherboard.formFactor];
  const dimensions: Record<PreviewKey, { width: number; height: number }> = {
    motherboard: board,
    cpu: { width: 13, height: clamp((cpu.tdpWatts / pcCase.cpuCoolerClearanceMm) * 38, 14, 28) },
    memory: { width: clamp(memory.modules * 5 + 10, 15, 28), height: 32 },
    gpu: { width: clamp((gpu.lengthMm / pcCase.gpuClearanceMm) * 72, 28, 78), height: 15 },
    psu: { width: clamp((psu.depthMm / pcCase.psuClearanceMm) * 36, 18, 38), height: 14 }
  };
  const ramCount = clamp(memory.modules, 1, 4);

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const drag = dragRef.current;
      const stage = stageRef.current;
      if (!drag || !stage) return;

      const rect = stage.getBoundingClientRect();
      const size = dimensions[drag.key];
      const dx = ((event.clientX - drag.pointer.x) / rect.width) * 100;
      const dy = ((event.clientY - drag.pointer.y) / rect.height) * 100;

      if (Math.abs(dx) > 0.6 || Math.abs(dy) > 0.6) drag.moved = true;

      setPositions((current) => ({
        ...current,
        [drag.key]: {
          x: clamp(drag.origin.x + dx, 1, 99 - size.width),
          y: clamp(drag.origin.y + dy, 8, 98 - size.height)
        }
      }));
    }

    function handlePointerUp() {
      const drag = dragRef.current;
      if (drag && !drag.moved) onNavigate(keyToCategory[drag.key]);
      dragRef.current = null;
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dimensions, onNavigate]);

  function startDrag(key: PreviewKey, event: React.PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    dragRef.current = {
      key,
      origin: positions[key],
      pointer: { x: event.clientX, y: event.clientY },
      moved: false
    };
  }

  function styleFor(key: PreviewKey) {
    const position = positions[key];
    const size = dimensions[key];
    return {
      height: `${size.height}%`,
      left: `${position.x}%`,
      top: `${position.y}%`,
      width: `${size.width}%`
    };
  }

  return (
    <section className={`build-preview is-${mode}`} aria-label="선택 부품 비율 프리뷰">
      <div className="preview-meta">
        <div>
          <p className="eyebrow">장착 프리뷰</p>
          <strong>{pcCase.name}</strong>
        </div>
        <button
          aria-pressed={mode === "3d"}
          className="preview-toggle"
          onClick={() => onModeChange(mode === "2d" ? "3d" : "2d")}
          type="button"
        >
          <span>2D</span>
          <i />
          <span>3D</span>
        </button>
      </div>

      <div className="preview-case">
        <button className="preview-case-label" onClick={() => onNavigate("case")} type="button">
          케이스 GPU 공간 {pcCase.gpuClearanceMm}mm
        </button>
        <div className="preview-stage" ref={stageRef}>
          <button
            className="preview-part preview-board"
            data-kind="board"
            onPointerDown={(event) => startDrag("motherboard", event)}
            style={styleFor("motherboard")}
            type="button"
          >
            <span>메인보드</span>
            <small>{motherboard.formFactor}</small>
          </button>
          <button
            className="preview-part preview-cpu"
            data-kind="cpu"
            onPointerDown={(event) => startDrag("cpu", event)}
            style={styleFor("cpu")}
            type="button"
          >
            <span>CPU</span>
            <small>{cpu.socket}</small>
          </button>
          <button
            className="preview-part preview-ram"
            data-kind="ram"
            onPointerDown={(event) => startDrag("memory", event)}
            style={styleFor("memory")}
            type="button"
          >
            <span className="ram-sticks">
              {Array.from({ length: ramCount }).map((_, index) => (
                <i key={index} />
              ))}
            </span>
            <small>{memory.capacityGb}GB RAM</small>
          </button>
          <button
            className="preview-part preview-gpu"
            data-kind="gpu"
            onPointerDown={(event) => startDrag("gpu", event)}
            style={styleFor("gpu")}
            type="button"
          >
            <span>GPU</span>
            <strong>{gpu.lengthMm}mm</strong>
            <small>{gpu.vramGb}GB</small>
          </button>
          <button
            className="preview-part preview-psu"
            data-kind="psu"
            onPointerDown={(event) => startDrag("psu", event)}
            style={styleFor("psu")}
            type="button"
          >
            <span>파워</span>
            <strong>{psu.capacityWatts}W</strong>
          </button>
        </div>
      </div>
    </section>
  );
}
