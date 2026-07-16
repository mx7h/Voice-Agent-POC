import { useMemo } from "react";
import { useAppSelector } from "@/redux/hooks";
import MenuItemCard from "./MenuItemCard";
import Loading from "../common/Loading";
import EmptyState from "../common/EmptyState";

export default function MenuList() {
  const { items, selectedCategory, query, loading } = useAppSelector((s) => s.menu);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (selectedCategory && i.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)
      );
    });
  }, [items, selectedCategory, query]);

  if (loading && items.length === 0) return <Loading label="Loading menu..." />;
  if (filtered.length === 0)
    return <EmptyState title="No items" description="Try a different search or category." />;

  return (
    <div className="grid grid-cols-1 gap-2">
      {filtered.map((item) => (
        <MenuItemCard key={item._id} item={item} />
      ))}
    </div>
  );
}
