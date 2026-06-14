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
  motherboard: { x: 4, y: 34, z: 4 },
  cpu: { x: 35, y: 45, z: 18 },
  memory: { x: 48, y: 34, z: 25 },
  gpu: { x: 9, y: 72, z: 32 },
  psu: { x: 64, y: 58, z: 10 }
};

const keyToCategory: Record<PreviewKey, Category> = {
  motherboard: "motherboard",
  cpu: "cpu",
  memory: "memory",
  gpu: "gpu",
  psu: "psu"
};

const defaultRotation: Rotation = { x: 56, y: 0, z: -24 };

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
  if (key === "motherboard") {
    const box = dimensions(parts.motherboard);
    return { width: box.width, height: box.height, depth: box.depth };
  }
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
    depthPx: clamp((physical.depth / space.depth) * 96, 10, 66)
  };
}

function clampPosition(position: Position, size: DisplayBox) {
  return {
    x: clamp(position.x, 0, 100 - size.width),
    y: clamp(position.y, 0, 100 - size.height),
    z: clamp(position.z, 0, 100 - size.zSize)
  };
}

function overlaps2d(a: Position, aSize: DisplayBox, b: Position, bSize: DisplayBox) {
  return a.x < b.x + bSize.width && a.x + aSize.width > b.x && a.y < b.y + bSize.height && a.y + aSize.height > b.y;
}

function resolveCollisions(key: PreviewKey, positions: Record<PreviewKey, Position>, sizes: Record<PreviewKey, DisplayBox>) {
  let next = clampPosition(positions[key], sizes[key]);
  const others = (Object.keys(positions) as PreviewKey[]).filter((item) => item !== key);

  for (let pass = 0; pass < 10; pass += 1) {
    let changed = false;

    for (const other of others) {
      const otherPosition = positions[other];
      const otherSize = sizes[other];
      if (!overlaps2d(next, sizes[key], otherPosition, otherSize)) continue;

      const candidates = [
        { ...next, x: otherPosition.x + otherSize.width + 1 },
        { ...next, x: otherPosition.x - sizes[key].width - 1 },
        { ...next, y: otherPosition.y + otherSize.height + 1 },
        { ...next, y: otherPosition.y - sizes[key].height - 1 },
        { ...next, z: otherPosition.z + otherSize.zSize + 1 },
        { ...next, z: otherPosition.z - sizes[key].zSize - 1 }
      ].map((candidate) => clampPosition(candidate, sizes[key]));

      next =
        candidates.find((candidate) => !others.some((item) => overlaps2d(candidate, sizes[key], positions[item], sizes[item]))) ??
        candidates[0];
      changed = true;
    }

    if (!changed) break;
  }

  return { ...positions, [key]: next };
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
  const sizes = useMemo<Record<PreviewKey, DisplayBox>>(() => {
    const parts = { cpu, motherboard, memory, gpu, psu };
    return {
      motherboard: displayBox("motherboard", previewBox("motherboard", parts), space),
      cpu: displayBox("cpu", previewBox("cpu", parts), space),
      memory: displayBox("memory", previewBox("memory", parts), space),
      gpu: displayBox("gpu", previewBox("gpu", parts), space),
      psu: displayBox("psu", previewBox("psu", parts), space)
    };
  }, [cpu, gpu, memory, motherboard, psu, space]);

  const ramCount = clamp(memory.modules, 1, 4);

  useEffect(() => {
    setPositions((current) => {
      let next = (Object.keys(current) as PreviewKey[]).reduce(
        (next, key) => ({ ...next, [key]: clampPosition(current[key], sizes[key]) }),
        {} as Record<PreviewKey, Position>
      );
      (Object.keys(next) as PreviewKey[]).forEach((key) => {
        next = resolveCollisions(key, next, sizes);
      });
      return next;
    });
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
          x: clamp(drag.origin.x + dy * 0.35, 18, 76),
          y: clamp(drag.origin.y + dx * 0.45, -55, 55),
          z: drag.origin.z + dx * 0.05
        });
        return;
      }

      const px = (dx / rect.width) * 100;
      const py = (dy / rect.height) * 100;
      if (Math.abs(px) > 0.4 || Math.abs(py) > 0.4) drag.moved = true;

      setPositions((current) => ({
        ...current,
        [drag.key]: clampPosition(
          {
            ...drag.origin,
            x: drag.origin.x + px,
            y: drag.origin.y + py
          },
          sizes[drag.key]
        )
      }));
    }

    function handlePointerUp() {
      const drag = dragRef.current;
      if (drag?.type === "part") {
        if (!drag.moved) onNavigate(keyToCategory[drag.key]);
        setPositions((current) => resolveCollisions(drag.key, current, sizes));
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
      pointer: { x: event.clientX, y: event.clientY },
      moved: false
    };
  }

  function moveZ(key: PreviewKey, event: WheelEvent<HTMLButtonElement>) {
    if (mode !== "3d") return;
    event.preventDefault();
    event.stopPropagation();

    setPositions((current) => {
      const next = {
        ...current,
        [key]: clampPosition(
          {
            ...current[key],
            z: current[key].z + (event.deltaY > 0 ? -6 : 6)
          },
          sizes[key]
        )
      };
      return resolveCollisions(key, next, sizes);
    });
  }

  function styleFor(key: PreviewKey) {
    const position = positions[key];
    const size = sizes[key];
    return {
      "--depth": `${size.depthPx}px`,
      "--depth-neg": `${-size.depthPx}px`,
      "--depth-half-neg": `${-size.depthPx / 2}px`,
      "--shadow-x": `${size.depthPx * 0.55}px`,
      "--shadow-y": `${size.depthPx * 0.65}px`,
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

      <div
        className="preview-case"
        onPointerDown={startRotate}
        style={sceneStyle}
        title="3D: 빈 공간 드래그로 회전, 부품 드래그로 X/Y 이동, 부품 위 휠로 Z 이동"
      >
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
            onWheel={(event) => moveZ("motherboard", event)}
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
            onWheel={(event) => moveZ("cpu", event)}
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
            onWheel={(event) => moveZ("memory", event)}
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
            onWheel={(event) => moveZ("gpu", event)}
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
            onWheel={(event) => moveZ("psu", event)}
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
