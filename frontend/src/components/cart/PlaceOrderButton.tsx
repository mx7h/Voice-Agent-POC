import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { placeOrder } from "@/redux/slices/orderSlice";
import { setCart, fetchCart } from "@/redux/slices/cartSlice";
import { useNavigate } from "react-router-dom";

export default function PlaceOrderButton() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const sessionId = useAppSelector((s) => s.session.sessionId);
  const cart = useAppSelector((s) => s.cart.cart);
  const loading = useAppSelector((s) => s.cart.loading);
  const disabled = !sessionId || !cart || cart.items.length === 0 || loading;

  const onPlace = async () => {
    if (!sessionId) return;
    try {
      const order = await dispatch(placeOrder(sessionId)).unwrap();
      // 1. Optimistic clear — instant UX
      dispatch(setCart(null));
      toast.success("Order placed!");
      navigate(`/order/${order._id}`);
      // 2. Reconcile with server — guarantees correctness even if cart:updated was missed
      dispatch(fetchCart(sessionId));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Order failed");
    }
  };

  return (
    <button
      onClick={onPlace}
      disabled={disabled}
      className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
    >
      Place Order
    </button>
  );
}
