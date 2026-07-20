import type { Order } from "@/types";
import { formatCurrency, formatTime } from "@/utils/format";

const badgeColor: Record<Order["orderStatus"], string> = {
  pending: "bg-yellow-500/15 text-yellow-600",
  confirmed: "bg-blue-500/15 text-blue-600",
  preparing: "bg-orange-500/15 text-orange-600",
  completed: "bg-emerald-500/15 text-emerald-600",
  cancelled: "bg-red-500/15 text-red-600",
};

type Modifier = {
  groupName?: string;
  name?: string;
  optionName?: string;
  price?: number;
};

export default function OrderDetails({ order }: { order: Order }) {
  const items = order.items ?? [];

  const subtotal =
    (order as any).subtotal ??
    items.reduce((sum, item: any) => {
      return sum + Number(item.totalPrice);
    }, 0);

  const tax =
    (order as any).tax ??
    Math.max(Number(order.total ?? 0) - Number(subtotal ?? 0), 0);

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            Order #{order._id.slice(-6)}
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Placed {formatTime(order.createdAt)}
          </p>
        </div>

        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
            badgeColor[order.orderStatus] ?? "bg-muted"
          }`}
        >
          {order.orderStatus}
        </span>
      </div>

      <div className="mt-5 divide-y divide-border">
        {items.map((item: any, idx: number) => {
          const modifiers: Modifier[] = item.selectedModifiers ?? [];

          const itemTotal = Number(
            item.totalPrice
          );

          return (
            <div
              key={item._id ?? item.cartItemId ?? idx}
              className="py-3"
            >
              <div className="flex items-start justify-between gap-4 text-sm">
                <div>
                  <p className="font-medium">
                    {item.quantity}× {item.itemName ?? item.name ?? "Item"}
                  </p>

                  {modifiers.length > 0 && (
                    <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                      {modifiers.map((modifier, modifierIndex) => (
                        <p key={modifierIndex}>
                          {modifier.groupName}:{" "}
                          {modifier.optionName ?? modifier.name}
                          {modifier.price ? (
                            <> +{formatCurrency(modifier.price)}</>
                          ) : null}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <span className="font-medium">
                  {formatCurrency(itemTotal)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        <div className="flex justify-between text-muted-foreground">
          <span>Tax</span>
          <span>{formatCurrency(tax)}</span>
        </div>

        <div className="flex justify-between pt-2 text-base font-semibold">
          <span>Total</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
      </div>
    </div>
  );
}