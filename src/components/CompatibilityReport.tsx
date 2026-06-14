import { getCompatibilityReport, type Selection } from "../constants/data";

type Props = {
  selection: Selection;
};

export function CompatibilityReport({ selection }: Props) {
  const report = getCompatibilityReport(selection);
  const warningCount = report.filter((item) => item.status === "warn").length;

  return (
    <section className="report-panel" aria-label="호환성 리포트">
      <div className="report-heading">
        <p className="eyebrow">호환성</p>
        <h2>{warningCount === 0 ? "조립 가능" : `${warningCount}개 확인 필요`}</h2>
      </div>
      <div className="report-list">
        {report.map((item) => (
          <article 
            className={`report-card report-${item.status}`} 
            key={item.title}
          >
            <div>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
