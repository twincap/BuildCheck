import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent
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

type PreviewMode = "2d" | "3d";
type PreviewKey = "motherboard" | "cpu" | "memory" | "gpu" | "psu";
type Position = { x: number; y: number; z: number };
type PreviewBox = { width: number; height: number; depth: number };
type DisplayBox = PreviewBox & { zSize: number; depthPx: number };
type Rotation = { x: number; y: number; z: number };
type DragState =
  | {
      type: "part";
      key: PreviewKey;
      origin: Position;
      originAll: Record<PreviewKey, Position>;
      pointer: { x: number; y: number };
      moved: boolean;
    }
  | {
      type: "rotate";
      origin: Rotation;
      pointer: { x: number; y: number };
    };

type Props = {
  mode: PreviewMode;
  selection: Selection;
  onModeChange: (mode: PreviewMode) => void;
  onNavigate: (category: Category) => void;
};

const defaultPositions: Record<PreviewKey, Position> = {
  motherboard: { x: 8, y: 34, z: 8 },
  cpu: { x: 34, y: 46, z: 28 },
  memory: { x: 47, y: 28, z: 36 },
  gpu: { x: 8, y: 72, z: 42 },
  psu: { x: 66, y: 58, z: 18 }
};

const keyToCategory: Record<PreviewKey, Category> = {
  motherboard: "motherboard",
  cpu: "cpu",
  memory: "memory",
  gpu: "gpu",
  psu: "psu"
};

const defaultRotation: Rotation = { x: 58, y: -18, z: -24 };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

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

function previewBox(key: PreviewKey, parts: {
  cpu: CpuPart;
  motherboard: MotherboardPart;
  memory: MemoryPart;
  gpu: GpuPart;
  psu: PsuPart;
}) {
  if (key === "motherboard") return dimensions(parts.motherboard);
  if (key === "cpu") {
    const box = dimensions(parts.cpu);
    return { width: box.width, height: box.height, depth: Math.max(box.depth, Math.round(parts.cpu.tdpWatts / 4)) };
  }
  if (key === "memory") {
    const box = dimensions(parts.memory);
    return { width: box.width, height: box.height, depth: Math.max(box.depth * parts.memory.modules, box.depth) };
  }
  if (key === "gpu") return dimensions(parts.gpu);

  const box = dimensions(parts.psu);
  return { width: box.depth, height: box.height, depth: box.width };
}

function displayBox(key: PreviewKey, physical: PreviewBox, space: PreviewBox): DisplayBox {
  const minWidth = key === "cpu" ? 8 : key === "memory" ? 12 : 10;
  const minHeight = key === "cpu" ? 10 : key === "memory" ? 10 : 9;

  return {
    width: clamp((physical.width / space.width) * 100, minWidth, 96),
    height: clamp((physical.height / space.height) * 100, minHeight, 96),
    depth: physical.depth,
    zSize: clamp((physical.depth / space.depth) * 100, 4, 48),
    depthPx: clamp((physical.depth / space.depth) * 130, 14, 96)
  };
}

function clampPosition(position: Position, size: DisplayBox) {
  return {
    x: clamp(position.x, 0, 100 - size.width),
    y: clamp(position.y, 0, 100 - size.height),
    z: clamp(position.z, 0, 100 - size.zSize)
  };
}

function clampPartPosition(
  key: PreviewKey,
  position: Position,
  positions: Record<PreviewKey, Position>,
  sizes: Record<PreviewKey, DisplayBox>
) {
  const clamped = clampPosition(position, sizes[key]);
  if (key !== "cpu") return clamped;

  const board = positions.motherboard;
  const boardSize = sizes.motherboard;
  return {
    x: clamp(clamped.x, board.x, board.x + boardSize.width - sizes.cpu.width),
    y: clamp(clamped.y, board.y, board.y + boardSize.height - sizes.cpu.height),
    z: clamp(board.z + Math.max(8, sizes.motherboard.zSize), 0, 100 - sizes.cpu.zSize)
  };
}

function constrainPositions(positions: Record<PreviewKey, Position>, sizes: Record<PreviewKey, DisplayBox>) {
  const next = (Object.keys(positions) as PreviewKey[]).reduce(
    (result, key) => ({ ...result, [key]: clampPosition(positions[key], sizes[key]) }),
    {} as Record<PreviewKey, Position>
  );
  next.cpu = clampPartPosition("cpu", next.cpu, next, sizes);
  return next;
}

export function BuildPreview({ mode, selection, onModeChange, onNavigate }: Props) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [positions, setPositions] = useState<Record<PreviewKey, Position>>(defaultPositions);
  const [rotation, setRotation] = useState<Rotation>(defaultRotation);

  const cpu = getPart(selection.cpu) as CpuPart;
  const motherboard = getPart(selection.motherboard) as MotherboardPart;
  const memory = getPart(selection.memory) as MemoryPart;
  const gpu = getPart(selection.gpu) as GpuPart;
  const psu = getPart(selection.psu) as PsuPart;
  const pcCase = getPart(selection.case) as CasePart;
  const ramLabel = memory.moduleType === "노트북용" ? "노트북 RAM" : "PC RAM";

  const space = useMemo(() => caseSpace(pcCase), [pcCase]);
  const physicalBoxes = useMemo<Record<PreviewKey, PreviewBox>>(() => {
    const parts = { cpu, motherboard, memory, gpu, psu };
    return {
      motherboard: previewBox("motherboard", parts),
      cpu: previewBox("cpu", parts),
      memory: previewBox("memory", parts),
      gpu: previewBox("gpu", parts),
      psu: previewBox("psu", parts)
    };
  }, [cpu, gpu, memory, motherboard, psu]);
  const sizes = useMemo<Record<PreviewKey, DisplayBox>>(
    () => ({
      motherboard: displayBox("motherboard", physicalBoxes.motherboard, space),
      cpu: displayBox("cpu", physicalBoxes.cpu, space),
      memory: displayBox("memory", physicalBoxes.memory, space),
      gpu: displayBox("gpu", physicalBoxes.gpu, space),
      psu: displayBox("psu", physicalBoxes.psu, space)
    }),
    [physicalBoxes, space]
  );

  useEffect(() => {
    setPositions((current) => constrainPositions(current, sizes));
  }, [sizes]);

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const drag = dragRef.current;
      const stage = stageRef.current;
      if (!drag || !stage) return;

      const rect = stage.getBoundingClientRect();
      const dx = event.clientX - drag.pointer.x;
      const dy = event.clientY - drag.pointer.y;

      if (drag.type === "rotate") {
        setRotation({
          x: clamp(drag.origin.x + dy * 0.35, 16, 78),
          y: clamp(drag.origin.y + dx * 0.45, -70, 70),
          z: drag.origin.z + dx * 0.05
        });
        return;
      }

      const px = (dx / rect.width) * 100;
      const py = (dy / rect.height) * 100;
      if (Math.abs(px) > 0.4 || Math.abs(py) > 0.4) drag.moved = true;

      setPositions((current) => {
        const candidate = {
          ...drag.origin,
          x: drag.origin.x + px,
          y: drag.origin.y + py
        };

        if (drag.key === "motherboard") {
          const board = clampPartPosition("motherboard", candidate, current, sizes);
          const boardDx = board.x - drag.origin.x;
          const boardDy = board.y - drag.origin.y;
          return constrainPositions(
            {
              ...current,
              motherboard: board,
              cpu: {
                ...drag.originAll.cpu,
                x: drag.originAll.cpu.x + boardDx,
                y: drag.originAll.cpu.y + boardDy
              }
            },
            sizes
          );
        }

        return {
          ...current,
          [drag.key]: clampPartPosition(drag.key, candidate, current, sizes)
        };
      });
    }

    function handlePointerUp() {
      const drag = dragRef.current;
      if (drag?.type === "part") {
        if (!drag.moved) onNavigate(keyToCategory[drag.key]);
        setPositions((current) => constrainPositions(current, sizes));
      }
      dragRef.current = null;
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [onNavigate, sizes]);

  function startRotate(event: ReactPointerEvent<HTMLDivElement>) {
    if (mode !== "3d") return;
    if ((event.target as HTMLElement).closest(".preview-part, .preview-toggle, .preview-case-label")) return;

    dragRef.current = {
      type: "rotate",
      origin: rotation,
      pointer: { x: event.clientX, y: event.clientY }
    };
  }

  function startDrag(key: PreviewKey, event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = {
      type: "part",
      key,
      origin: positions[key],
      originAll: positions,
      pointer: { x: event.clientX, y: event.clientY },
      moved: false
    };
  }

  function moveZ(key: PreviewKey, event: WheelEvent<HTMLButtonElement>) {
    if (mode !== "3d" || key === "cpu") return;
    event.preventDefault();
    event.stopPropagation();

    setPositions((current) =>
      constrainPositions(
        {
          ...current,
          [key]: clampPosition(
            {
              ...current[key],
              z: current[key].z + (event.deltaY > 0 ? -7 : 7)
            },
            sizes[key]
          )
        },
        sizes
      )
    );
  }

  function dimensionLabel(key: PreviewKey) {
    const box = physicalBoxes[key];
    return `${box.width}x${box.height}x${box.depth}mm`;
  }

  function styleFor(key: PreviewKey) {
    const position = positions[key];
    const size = sizes[key];
    return {
      "--depth": `${size.depthPx}px`,
      "--depth-neg": `${-size.depthPx}px`,
      "--shadow-x": `${size.depthPx * 0.75}px`,
      "--shadow-y": `${size.depthPx * 0.85}px`,
      "--z": `${position.z}px`,
      height: `${size.height}%`,
      left: `${position.x}%`,
      top: `${position.y}%`,
      width: `${size.width}%`
    } as CSSProperties;
  }

  const sceneStyle = {
    "--case-aspect": `${space.width} / ${space.height}`,
    "--scene-rotate-x": `${rotation.x}deg`,
    "--scene-rotate-y": `${rotation.y}deg`,
    "--scene-rotate-z": `${rotation.z}deg`
  } as CSSProperties;

  return (
    <section className={`build-preview is-${mode}`} aria-label="선택 부품 장착 미리보기">
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

      <div className="preview-case" onPointerDown={startRotate} style={sceneStyle}>
        <div className="case-cuboid" aria-hidden="true">
          <i className="case-face case-front" />
          <i className="case-face case-back" />
          <i className="case-face case-top" />
          <i className="case-face case-right" />
          <i className="case-face case-bottom" />
          <i className="case-face case-left" />
        </div>
        <button className="preview-case-label" onClick={() => onNavigate("case")} type="button">
          케이스 GPU 공간 {pcCase.gpuClearanceMm}mm
        </button>
        <div className="preview-stage" ref={stageRef}>
          <button
            className="preview-part preview-board"
            data-kind="board"
            onPointerDown={(event) => startDrag("motherboard", event)}
            onWheel={(event) => moveZ("motherboard", event)}
            style={styleFor("motherboard")}
            type="button"
          >
            <span>메인보드</span>
            <small>{motherboard.formFactor}</small>
            <small>{dimensionLabel("motherboard")}</small>
          </button>
          <button
            className="preview-part preview-cpu"
            data-kind="cpu"
            onPointerDown={(event) => startDrag("cpu", event)}
            onWheel={(event) => moveZ("cpu", event)}
            style={styleFor("cpu")}
            type="button"
          >
            <span>CPU</span>
            <small>{cpu.socket}</small>
            <small>{dimensionLabel("cpu")}</small>
          </button>
          <button
            className="preview-part preview-ram"
            data-kind="ram"
            onPointerDown={(event) => startDrag("memory", event)}
            onWheel={(event) => moveZ("memory", event)}
            style={styleFor("memory")}
            type="button"
          >
            <span>RAM</span>
            <small>{memory.capacityGb}GB {ramLabel}</small>
            <small>{dimensionLabel("memory")}</small>
          </button>
          <button
            className="preview-part preview-gpu"
            data-kind="gpu"
            onPointerDown={(event) => startDrag("gpu", event)}
            onWheel={(event) => moveZ("gpu", event)}
            style={styleFor("gpu")}
            type="button"
          >
            <span>GPU</span>
            <strong>{dimensionLabel("gpu")}</strong>
            <small>{gpu.vramGb}GB VRAM</small>
          </button>
          <button
            className="preview-part preview-psu"
            data-kind="psu"
            onPointerDown={(event) => startDrag("psu", event)}
            onWheel={(event) => moveZ("psu", event)}
            style={styleFor("psu")}
            type="button"
          >
            <span>파워</span>
            <strong>{psu.capacityWatts}W</strong>
            <small>{dimensionLabel("psu")}</small>
          </button>
        </div>
      </div>
    </section>
  );
}
