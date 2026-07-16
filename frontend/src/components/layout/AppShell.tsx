import { Outlet } from "react-router-dom";
import Header from "./Header";
import StatusBar from "./StatusBar";

export default function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <StatusBar />
    </div>
  );
}
