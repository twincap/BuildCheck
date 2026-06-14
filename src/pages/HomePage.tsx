import { useState } from "react";
import visual from "../assets/compat-board.svg";
import { BuildSummary } from "../components/BuildSummary";
import { CompatibilityReport } from "../components/CompatibilityReport";
import { PartSelector } from "../components/PartSelector";
import { danawaCategoryUrls, initialSelection, type Category, type Selection } from "../constants/data";

export function HomePage() {
  const [selection, setSelection] = useState<Selection>(initialSelection);

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
          <div className="source-strip" aria-label="다나와 데이터 카테고리">
            {Object.entries(danawaCategoryUrls).map(([category, url]) => (
              <a href={url} key={category} rel="noreferrer" target="_blank">
                {category}
              </a>
            ))}
          </div>
        </div>
        <img src={visual} alt="PC 부품 호환성 보드 일러스트" />
      </section>

      <div className="workspace">
        <PartSelector selection={selection} onSelect={handleSelect} />
        <div className="side-stack">
          <BuildSummary selection={selection} />
          <CompatibilityReport selection={selection} />
        </div>
      </div>
    </main>
  );
}
