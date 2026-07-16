import { Search } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setQuery } from "@/redux/slices/menuSlice";

export default function MenuSearch() {
  const dispatch = useAppDispatch();
  const query = useAppSelector((s) => s.menu.query);
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={query}
        onChange={(e) => dispatch(setQuery(e.target.value))}
        placeholder="Search menu..."
        className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
