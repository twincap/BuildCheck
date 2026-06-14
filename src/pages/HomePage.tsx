import { useState } from "react";
import { BuildPreview } from "../components/BuildPreview";
import { BuildSummary } from "../components/BuildSummary";
import { CompatibilityReport } from "../components/CompatibilityReport";
import { PartSelector } from "../components/PartSelector";
import { categories, initialSelection, type Category, type Selection } from "../constants/data";

const tabLabels: Record<Category, string> = {
  cpu: "CPU",
  motherboard: "메인보드",
  memory: "RAM",
  gpu: "GPU",
  psu: "파워",
  case: "케이스"
};

type PreviewMode = "2d" | "3d";

export function HomePage() {
  const [selection, setSelection] = useState<Selection>(initialSelection);
  const [activeCategory, setActiveCategory] = useState<Category>("cpu");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("2d");

  function handleSelect(category: Category, id: string) {
    setSelection((current) => ({ ...current, [category]: id }));
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">빌드체크</p>
          <h1>PC 부품 견적 빌더</h1>
          <p>장착 공간과 소비 전력을 한눈에 비교합니다.</p>
        </div>
        <BuildPreview mode={previewMode} onModeChange={setPreviewMode} onNavigate={setActiveCategory} selection={selection} />
      </section>

      <div className="category-tabs" aria-label="부품 카테고리 선택">
        {categories.map((category) => (
          <button
            aria-pressed={activeCategory === category.id}
            className={activeCategory === category.id ? "is-active" : ""}
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            type="button"
          >
            {tabLabels[category.id]}
          </button>
        ))}
      </div>

      <div className="workspace">
        <PartSelector activeCategory={activeCategory} selection={selection} onSelect={handleSelect} />
        <div className="side-stack">
          <CompatibilityReport selection={selection} />
          <BuildSummary selection={selection} />
        </div>
      </div>
    </main>
  );
}
