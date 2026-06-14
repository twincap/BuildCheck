import { categories, parts, type Category, type Selection } from "../constants/data";

type Props = {
  selection: Selection;
  onSelect: (category: Category, id: string) => void;
};

export function PartSelector({ selection, onSelect }: Props) {
  return (
    <section className="part-selector" aria-label="부품 선택">
      {categories.map((category) => (
        <div className="part-group" key={category.id}>
          <div className="group-heading">
            <strong>{category.label}</strong>
            <span>{category.helper}</span>
          </div>
          <div className="option-grid">
            {parts
              .filter((part) => part.category === category.id)
              .map((part) => {
                const active = selection[category.id] === part.id;
                return (
                  <button
                    className={`part-card ${active ? "is-active" : ""}`}
                    data-tone={part.tone}
                    key={part.id}
                    onClick={() => onSelect(category.id, part.id)}
                  >
                    <span>{part.name}</span>
                    <small>{part.short}</small>
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </section>
  );
}
