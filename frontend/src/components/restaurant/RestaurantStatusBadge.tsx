import { useAppSelector } from "@/redux/hooks";

export default function RestaurantStatusBadge() {
  const restaurant = useAppSelector((s) => s.restaurant.current);
  const isOpen = restaurant?.isOpen ?? false;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isOpen ? "bg-green-500/15 text-green-600" : "bg-red-500/15 text-red-600"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isOpen ? "bg-green-500" : "bg-red-500"}`} />
      {isOpen ? "Open" : "Closed"}
    </span>
  );
}
