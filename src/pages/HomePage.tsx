import visual from "../assets/compat-board.svg";
import { BuildSummary } from "../components/BuildSummary";
import { CompatibilityReport } from "../components/CompatibilityReport";
import { PartSelector } from "../components/PartSelector";
import { initialSelection } from "../constants/data";

export function HomePage() {
  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">PC BuildCheck</p>
          <h1>PC 부품 호환성 견적 빌더</h1>
          <p>
            PC 부품을 고르면 소켓, 파워, 케이스 공간을 한 화면에서 비교할 수 있는 카드형 견적 서비스입니다.
          </p>
        </div>
        <img src={visual} alt="PC 부품 호환성 보드 일러스트" />
      </section>

      <div className="workspace">
        <PartSelector selection={initialSelection} />
        <div className="side-stack">
          <BuildSummary selection={initialSelection} />
          <CompatibilityReport />
        </div>
      </div>
    </main>
  );
}
