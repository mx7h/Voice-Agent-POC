import MenuSearch from "@/components/menu/MenuSearch";
import MenuCategories from "@/components/menu/MenuCategories";
import MenuList from "@/components/menu/MenuList";

export default function MenuPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <h1 className="text-2xl font-semibold">Menu</h1>
      <MenuSearch />
      <MenuCategories />
      <MenuList />
    </div>
  );
}
