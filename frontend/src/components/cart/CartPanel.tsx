import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { clearCart } from "@/redux/slices/cartSlice";
import CartItemRow from "./CartItemRow";
import PlaceOrderButton from "./PlaceOrderButton";
import EmptyState from "../common/EmptyState";
import { formatCurrency } from "@/utils/format";

export default function CartPanel() {
  const dispatch = useAppDispatch();
  const sessionId = useAppSelector((s) => s.session.sessionId);
  const cart = useAppSelector((s) => s.cart.cart);
  const items = cart?.items ?? [];

  const onClear = async () => {
    if (!sessionId) return;
    try {
      await dispatch(clearCart(sessionId)).unwrap();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Clear failed");
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Cart</h3>
        {items.length > 0 && (
          <button onClick={onClear} className="text-xs text-muted-foreground hover:underline">
            Clear
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState title="Cart is empty" description="Add items from the menu." />
      ) : (
        <>
          <div className="divide-y divide-border">
            {items.map((i) => (
              <CartItemRow key={i._id} item={i} />
            ))}
          </div>
          <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(cart?.subtotal)}</span>
            </div>
            {typeof cart?.tax === "number" && (
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>{formatCurrency(cart.tax)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatCurrency(cart?.total)}</span>
            </div>
          </div>
          <div className="mt-3">
            <PlaceOrderButton />
          </div>
        </>
      )}
    </div>
  );
}
