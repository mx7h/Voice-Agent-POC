import { NavLink } from "react-router-dom";
import { Mic } from "lucide-react";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/menu", label: "Menu" },
  { to: "/cart", label: "Cart" },
  { to: "/orders", label: "Orders" },
  { to: "/analytics", label: "Analytics" },
  { to: "/call-logs", label: "Call Logs" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-2 font-semibold">
          <Mic className="h-5 w-5 text-primary" />
          <span>Voice AI Ordering</span>
        </div>
        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 text-sm transition ${
                  isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
