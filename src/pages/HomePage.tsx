import { useState } from "react";
import { BuildPreview } from "../components/BuildPreview";
import { BuildSummary } from "../components/BuildSummary";
import { CompatibilityReport } from "../components/CompatibilityReport";
import { PartSelector } from "../components/PartSelector";
import { categories, initialSelection, type Category, type Selection } from "../constants/data";

export function HomePage() {
  const [selection, setSelection] = useState<Selection>(initialSelection);
  const [activeCategory, setActiveCategory] = useState<Category>("cpu");

  function handleSelect(category: Category, id: string) {
    setSelection((current) => ({ ...current, [category]: id }));
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">PC BuildCheck</p>
          <h1>PC 부품 호환성 견적 빌더</h1>
          <p>
            다나와 카테고리 기준으로 확장한 부품 데이터를 검색하고, 소켓·RAM 규격·GPU VRAM·파워·케이스
            장착 공간을 즉시 비교하는 React 견적 화면입니다.
          </p>
        </div>
        <BuildPreview selection={selection} />
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
            {category.id.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="workspace">
        <PartSelector activeCategory={activeCategory} selection={selection} onSelect={handleSelect} />
        <div className="side-stack">
          <BuildSummary selection={selection} />
          <CompatibilityReport selection={selection} />
        </div>
      </div>
    </main>
  );
}
