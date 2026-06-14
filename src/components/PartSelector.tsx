import { useMemo, useState } from "react";
import {
  categories,
  formatWon,
  getPartsByCategory,
  getSearchText,
  type Category,
  type Selection
} from "../constants/data";

type Props = {
  activeCategory: Category;
  selection: Selection;
  onSelect: (category: Category, id: string) => void;
};

export function PartSelector({ activeCategory, selection, onSelect }: Props) {
  const [queries, setQueries] = useState<Record<Category, string>>({
    cpu: "",
    motherboard: "",
    memory: "",
    gpu: "",
    psu: "",
    case: ""
  });

  const visibleParts = useMemo(() => {
    return Object.fromEntries(
      categories.map((category) => {
        const query = queries[category.id].trim().toLowerCase();
        const filtered = getPartsByCategory(category.id).filter((part) => {
          if (!query) return true;
          return getSearchText(part).includes(query);
        });
        return [category.id, filtered];
      })
    ) as Record<Category, ReturnType<typeof getPartsByCategory>>;
  }, [queries]);

  const visibleCategories = categories.filter((category) => category.id === activeCategory);

  return (
    <section className="part-selector" aria-label="부품 선택">
      {visibleCategories.map((category) => (
        <div className="part-group" key={category.id}>
          <div className="group-heading">
            <strong>{category.label}</strong>
            <span>{category.helper}</span>
            <input
              aria-label={`${category.label} 검색`}
              className="part-search"
              onChange={(event) => setQueries((current) => ({ ...current, [category.id]: event.target.value }))}
              placeholder={`${category.label} 검색`}
              type="search"
              value={queries[category.id]}
            />
          </div>
          <div className="option-grid">
            {visibleParts[category.id].map((part) => {
              const active = selection[category.id] === part.id;
              return (
                <button
                  className={`part-card ${active ? "is-active" : ""}`}
                  data-tone={part.tone}
                  key={part.id}
                  onClick={() => onSelect(category.id, part.id)}
                >
                  <span className="part-maker">{part.maker}</span>
                  <strong>{part.name}</strong>
                  <small>{part.specs.join(" · ")}</small>
                  <em>{formatWon(part.price)}</em>
                </button>
              );
            })}
            {visibleParts[category.id].length === 0 && (
              <div className="empty-result">검색 결과 없음. 다른 키워드 입력.</div>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
