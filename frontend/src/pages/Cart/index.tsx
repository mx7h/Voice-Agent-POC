import CartPanel from "@/components/cart/CartPanel";

export default function CartPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <h1 className="text-2xl font-semibold">Your Cart</h1>
      <CartPanel />
    </div>
  );
}
