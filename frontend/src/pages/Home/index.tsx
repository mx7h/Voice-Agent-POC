import RestaurantInfo from "@/components/restaurant/RestaurantInfo";
import MenuCategories from "@/components/menu/MenuCategories";
import MenuSearch from "@/components/menu/MenuSearch";
import MenuList from "@/components/menu/MenuList";
import TranscriptPanel from "@/components/transcript/TranscriptPanel";
import CartPanel from "@/components/cart/CartPanel";
import AnalyticsPanel from "@/components/analytics/AnalyticsPanel";

export default function Home() {
  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 p-2 lg:grid-cols-12">
      {/* Left */}
      <section className="space-y-4 lg:col-span-4">
        <RestaurantInfo />
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 font-semibold">Menu</h3>
          <div className="space-y-3">
            <MenuSearch />
            <MenuCategories />
            <div className="max-h-[520px] overflow-y-auto pr-1">
              <MenuList />
            </div>
          </div>
        </div>
      </section>

      {/* Center */}
      <section className="lg:col-span-5">
        <div className="h-[720px]">
          <TranscriptPanel />
        </div>
      </section>

      {/* Right */}
      <section className="space-y-4 lg:col-span-3">
        <CartPanel />
        {/* <div>
          <h3 className="mb-2 px-1 text-sm font-semibold text-muted-foreground">Analytics</h3>
          <AnalyticsPanel />
        </div> */}
      </section>
    </div>
  );
}
