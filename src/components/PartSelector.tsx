import { useEffect, useMemo, useState } from "react";
import { categories, formatWon, registerLiveParts, type Category, type Part, type Selection } from "../constants/data";

type Props = {
  activeCategory: Category;
  selection: Selection;
  onSelect: (category: Category, id: string) => void;
};

const emptyQueries: Record<Category, string> = {
  cpu: "",
  motherboard: "",
  memory: "",
  gpu: "",
  psu: "",
  case: ""
};

const emptyLiveResults: Record<Category, Part[]> = {
  cpu: [],
  motherboard: [],
  memory: [],
  gpu: [],
  psu: [],
  case: []
};

export function PartSelector({ activeCategory, selection, onSelect }: Props) {
  const [queries, setQueries] = useState<Record<Category, string>>(emptyQueries);
  const [liveResults, setLiveResults] = useState<Record<Category, Part[]>>(emptyLiveResults);
  const [loadingCategory, setLoadingCategory] = useState<Category | null>(null);
  const [error, setError] = useState("");

  const activeMeta = categories.find((category) => category.id === activeCategory) ?? categories[0];
  const activeQuery = queries[activeCategory].trim();

  useEffect(() => {
    const query = activeQuery;

    if (query.length === 0) {
      setError("");
      setLoadingCategory(null);
      setLiveResults((current) => ({ ...current, [activeCategory]: [] }));
      return;
    }

    if (query.length < 2) {
      setLiveResults((current) => ({ ...current, [activeCategory]: [] }));
      setError("검색어를 두 글자 이상 입력하세요.");
      setLoadingCategory(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoadingCategory(activeCategory);
      setError("");

      try {
        const response = await fetch(
          `/api/danawa-search?category=${activeCategory}&q=${encodeURIComponent(query)}&pages=4&limit=160`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error("다나와 검색 요청 실패");
        const data = (await response.json()) as { items?: Part[]; error?: string };
        if (data.error) throw new Error(data.error);
        const items = data.items ?? [];
        registerLiveParts(items);
        setLiveResults((current) => ({ ...current, [activeCategory]: items }));
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        setLiveResults((current) => ({ ...current, [activeCategory]: [] }));
        setError(fetchError instanceof Error ? fetchError.message : "검색 실패");
      } finally {
        if (!controller.signal.aborted) setLoadingCategory(null);
      }
    }, 450);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [activeCategory, activeQuery]);

  const visibleParts = useMemo(() => {
    if (activeQuery.length === 0) return [];
    return liveResults[activeCategory];
  }, [activeCategory, activeQuery, liveResults]);

  function handleSelect(part: Part) {
    if (part.source === "danawa") registerLiveParts([part]);
    onSelect(activeCategory, part.id);
  }

  return (
    <section className="part-selector" aria-label="부품 선택">
      <div className="part-group">
        <div className="group-heading">
          <strong>{activeMeta.label}</strong>
          <span>{activeMeta.helper}</span>
          <input
            aria-label={`${activeMeta.label} 검색`}
            className="part-search"
            onChange={(event) => setQueries((current) => ({ ...current, [activeCategory]: event.target.value }))}
            placeholder="다나와에서 검색"
            type="search"
            value={queries[activeCategory]}
          />
          <p className="search-state">
            {activeQuery
              ? loadingCategory === activeCategory
                ? "다나와 검색 중"
                : `${visibleParts.length}개 결과`
              : "검색어를 입력하세요."}
          </p>
        </div>
        <div className="option-grid">
          {visibleParts.map((part) => {
            const active = selection[activeCategory] === part.id;
            return (
              <button
                className={`part-card ${active ? "is-active" : ""}`}
                data-tone={part.tone}
                key={part.id}
                onClick={() => handleSelect(part)}
                type="button"
              >
                <span className="part-maker">{part.maker}</span>
                <strong>{part.name}</strong>
                <small>{part.specs.join(" · ")}</small>
                <span className="part-card-foot">
                  <em>{formatWon(part.price)}</em>
                  {part.source === "danawa" && <b>실시간</b>}
                </span>
              </button>
            );
          })}
          {error && <div className="empty-result">{error}</div>}
          {!error && activeQuery.length === 0 && <div className="empty-result">부품명을 검색하면 다나와 결과가 표시됩니다.</div>}
          {!error && activeQuery && !loadingCategory && visibleParts.length === 0 && (
            <div className="empty-result">다나와 결과가 없습니다. 검색어를 바꿔보세요.</div>
          )}
        </div>
      </div>
    </section>
  );
}
