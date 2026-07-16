import type { Order } from "@/types";
import { formatCurrency, formatTime } from "@/utils/format";

const badgeColor: Record<Order["orderStatus"], string> = {
  pending: "bg-yellow-500/15 text-yellow-600",
  confirmed: "bg-blue-500/15 text-blue-600",
  preparing: "bg-orange-500/15 text-orange-600",
  completed: "bg-emerald-500/15 text-emerald-600",
  cancelled: "bg-red-500/15 text-red-600",
};

export default function OrderDetails({ order }: { order: Order }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">Order #{order._id.slice(-6)}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Placed {formatTime(order.createdAt)}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${badgeColor[order.orderStatus] ?? "bg-muted"}`}
        >
          {order.orderStatus}
        </span>
      </div>

      <div className="mt-4 divide-y divide-border">
        {order.items.map((item, idx) => (
          <div key={item._id ?? idx} className="flex items-center justify-between py-2 text-sm">
            <span>
              {item.quantity}× {item.itemName ?? "Item"}
            </span>
            <span>{formatCurrency(item.totalPrice ?? item.basePrice * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-between border-t border-border pt-4 font-semibold">
        <span>Total</span>
        <span>{formatCurrency(order.total)}</span>
      </div>
    </div>
  );
}
