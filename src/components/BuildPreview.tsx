import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
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
type PreviewBox = { width: number; height: number; depth: number };
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

const boardBoxes: Record<MotherboardPart["formFactor"], PreviewBox> = {
  ATX: { width: 50, height: 40, depth: 18 },
  "M-ATX": { width: 40, height: 40, depth: 18 },
  "M-ITX": { width: 29, height: 29, depth: 16 }
};

const defaultPositions: Record<PreviewKey, Position> = {
  motherboard: { x: 35, y: 14 },
  cpu: { x: 36, y: 34 },
  memory: { x: 19, y: 23 },
  gpu: { x: 18, y: 64 },
  psu: { x: 70, y: 35 }
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
  const ramLabel = memory.moduleType === "노트북용" ? "노트북 RAM" : "PC RAM";

  const dimensions = useMemo<Record<PreviewKey, PreviewBox>>(() => {
    const board = boardBoxes[motherboard.formFactor];
    const laptopRam = memory.moduleType === "노트북용";

    return {
      motherboard: board,
      cpu: { width: 13, height: 17, depth: clamp(cpu.tdpWatts / 4, 18, 34) },
      memory: {
        width: laptopRam ? 27 : clamp(memory.modules * 5 + 10, 15, 29),
        height: laptopRam ? 12 : 31,
        depth: laptopRam ? 12 : 28
      },
      gpu: {
        width: clamp((gpu.lengthMm / pcCase.gpuClearanceMm) * 72, 30, 82),
        height: clamp(10 + gpu.vramGb * 0.35, 12, 22),
        depth: clamp(16 + gpu.vramGb * 0.75, 18, 40)
      },
      psu: {
        width: clamp((psu.depthMm / pcCase.psuClearanceMm) * 34, 20, 38),
        height: 15,
        depth: psu.formFactor === "SFX" ? 18 : 30
      }
    };
  }, [cpu.tdpWatts, gpu.lengthMm, gpu.vramGb, memory.moduleType, memory.modules, motherboard.formFactor, pcCase.gpuClearanceMm, pcCase.psuClearanceMm, psu.depthMm, psu.formFactor]);

  const ramCount = clamp(memory.modules, 1, 4);

  useEffect(() => {
    setPositions((current) =>
      Object.fromEntries(
        Object.entries(current).map(([key, position]) => {
          const size = dimensions[key as PreviewKey];
          return [key, { x: clamp(position.x, 1, 99 - size.width), y: clamp(position.y, 8, 98 - size.height) }];
        })
      ) as Record<PreviewKey, Position>
    );
  }, [dimensions]);

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

  function startDrag(key: PreviewKey, event: ReactPointerEvent<HTMLButtonElement>) {
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
      "--depth": `${size.depth}px`,
      "--depth-neg": `${-size.depth}px`,
      "--depth-half-neg": `${-size.depth / 2}px`,
      "--shadow-x": `${size.depth * 0.8}px`,
      "--shadow-y": `${size.depth * 0.9}px`,
      "--z": `${Math.max(4, size.depth - 2)}px`,
      height: `${size.height}%`,
      left: `${position.x}%`,
      top: `${position.y}%`,
      width: `${size.width}%`
    } as CSSProperties;
  }

  return (
    <section className={`build-preview is-${mode}`} aria-label="선택 부품 장착 프리뷰">
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
        <div className="case-cuboid" aria-hidden="true">
          <i className="case-floor" />
          <i className="case-wall case-wall-top" />
          <i className="case-wall case-wall-right" />
          <i className="case-wall case-wall-bottom" />
          <i className="case-wall case-wall-left" />
        </div>
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
            <small>{memory.capacityGb}GB {ramLabel}</small>
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
