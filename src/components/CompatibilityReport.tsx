import { mockReport } from "../constants/data";

export function CompatibilityReport() {
  const warningCount = mockReport.filter((item) => item.status === "warn").length;

  return (
    <section className="report-panel" aria-label="호환성 리포트">
      <div className="report-heading">
        <p className="eyebrow">Compatibility</p>
        <h2>{warningCount === 0 ? "조립 가능" : `${warningCount}개 확인 필요`}</h2>
      </div>
      <div className="report-list">
        {mockReport.map((item) => (
          <article className={`report-card ${item.status}`} key={item.title}>
            <span>{item.status === "good" ? "OK" : "!"}</span>
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
