import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchOrder } from "@/redux/slices/orderSlice";
import OrderDetails from "@/components/order/OrderDetails";
import Loading from "@/components/common/Loading";

export default function OrderPage() {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const order = useAppSelector((s) => s.order.current);

  useEffect(() => {
    if (id && order?._id !== id) dispatch(fetchOrder(id));
  }, [id, order?._id, dispatch]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Order</h1>
        <Link to="/" className="text-sm text-muted-foreground hover:underline">
          Back to home
        </Link>
      </div>
      {!order ? <Loading label="Loading order..." /> : <OrderDetails order={order} />}
    </div>
  );
}
