import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchOrders } from "@/redux/slices/orderSlice";
import Loading from "@/components/common/Loading";
import EmptyState from "@/components/common/EmptyState";
import { formatTime } from "@/utils/format";
import type { Order } from "@/types";

const statusStyles: Record<Order["orderStatus"], string> = {
  pending: "bg-yellow-500/15 text-yellow-600",
  confirmed: "bg-blue-500/15 text-blue-600",
  preparing: "bg-purple-500/15 text-purple-600",
  completed: "bg-green-500/15 text-green-600",
  cancelled: "bg-red-500/15 text-red-600",
};

export default function OrdersHistoryPage() {
  const dispatch = useAppDispatch();
  const sessionId = useAppSelector((s) => s.session.sessionId);
  const { list, loading, error } = useAppSelector((s) => s.order);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);



  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Orders History</h1>
          <p className="text-xs text-muted-foreground">
            Past orders for this session
          </p>
        </div>
        <button
          onClick={() => dispatch(fetchOrders())}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
        >
          Refresh
        </button>
      </div>

      {loading && <Loading />}
      {error && !loading && (
        <EmptyState title="Could not load orders" description={error} />
      )}
      {!loading && !error && list.length === 0 && (
        <EmptyState title="No past orders yet" description="Placed orders will appear here." />
      )}

      <ul className="space-y-2">
        {list.map((o) => (
          <li key={o._id}>
            <Link
              to={`/order/${o._id}`}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition hover:bg-accent"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-mono text-xs text-muted-foreground">
                    #{o._id.slice(-8)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusStyles[o.orderStatus]}`}
                  >
                    {o.orderStatus}
                  </span>
                </div>
                <p className="mt-1 text-sm">
                  {o.items?.length ?? 0} item{(o.items?.length ?? 0) === 1 ? "" : "s"}
                  {" · "}
                  <span className="text-muted-foreground">{formatTime(o.createdAt)}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">${o.total?.toFixed(2) ?? "0.00"}</p>
                <p className="text-xs text-muted-foreground">View →</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
