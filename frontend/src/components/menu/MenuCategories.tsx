import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setCategory } from "@/redux/slices/menuSlice";

export default function MenuCategories() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.menu.items);
  const selected = useAppSelector((s) => s.menu.selectedCategory);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.category && set.add(i.category));
    return Array.from(set);
  }, [items]);

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => dispatch(setCategory(null))}
        className={`rounded-full border px-3 py-1 text-xs ${
          !selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
        }`}
      >
        All
      </button>
      {categories.map((c) => (
        <button
          key={c}
          onClick={() => dispatch(setCategory(c))}
          className={`rounded-full border px-3 py-1 text-xs ${
            selected === c
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:bg-accent"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
