import { useAppSelector } from "@/redux/hooks";
import RestaurantStatusBadge from "./RestaurantStatusBadge";
import Loading from "../common/Loading";

export default function RestaurantInfo() {
  const { current, loading } = useAppSelector((s) => s.restaurant);
  if (loading) return <Loading label="Loading restaurant..." />;
  if (!current)
    return <p className="text-sm text-muted-foreground">No restaurant data.</p>;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{current.name}</h2>
          {current.description && (
            <p className="mt-1 text-sm text-muted-foreground">{current.description}</p>
          )}
        </div>
        <RestaurantStatusBadge />
      </div>
      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
        {current.address && <p>{current.address}</p>}
        {current.phone && <p>{current.phone}</p>}
      </div>
    </div>
  );
}
