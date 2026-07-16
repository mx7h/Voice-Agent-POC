import { X } from "lucide-react";
import toast from "react-hot-toast";
import type { CartItem } from "@/types";
import { formatCurrency } from "@/utils/format";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { removeFromCart } from "@/redux/slices/cartSlice";

export default function CartItemRow({ item }: { item: CartItem }) {
  const dispatch = useAppDispatch();
  const sessionId = useAppSelector((s) => s.session.sessionId);

  const onRemove = async () => {
    if (!sessionId || !item._id) return;
    try {
      await dispatch(removeFromCart({ sessionId, cartItemId: item._id })).unwrap();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Remove failed");
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {item.quantity}× {item.itemName ?? "Item"}
        </p>
        {item.selectedModifiers && item.selectedModifiers.length > 0 && (
          <p className="truncate text-xs text-muted-foreground">
            {item.selectedModifiers.map((m) => m.optionName).join(", ")}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm">{formatCurrency(item.totalPrice ?? item.basePrice * item.quantity)}</span>
        <button
          onClick={onRemove}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent"
          aria-label="Remove"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
