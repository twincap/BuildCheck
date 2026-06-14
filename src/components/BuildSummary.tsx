import { formatWon, getCategoryLabel, getSelectedParts, type Selection } from "../constants/data";

type Props = {
  selection: Selection;
};

export function BuildSummary({ selection }: Props) {
  const selectedParts = getSelectedParts(selection);
  const total = selectedParts.reduce((sum, part) => sum + part.price, 0);
  const watts = selectedParts.reduce((sum, part) => sum + part.watts, 0);

  return (
    <aside className="summary-panel" aria-label="견적 요약">
      <p className="eyebrow">Live quote</p>
      <h2>{formatWon(total)}</h2>
      <div className="summary-stat">
        <span>예상 소비전력</span>
        <strong>{watts}W</strong>
      </div>
      <div className="summary-stat">
        <span>선택 부품</span>
        <strong>{selectedParts.length}개</strong>
      </div>
      <div className="selected-list">
        {selectedParts.map((part) => (
          <div key={part.id}>
            <span>{getCategoryLabel(part.category)}</span>
            <strong>{part.name}</strong>
          </div>
        ))}
      </div>
    </aside>
  );
}
