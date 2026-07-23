import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import AppShell from "./components/layout/AppShell";
import Home from "./pages/Home";
import MenuPage from "./pages/Menu";
import CartPage from "./pages/Cart";
import OrderPage from "./pages/Order";
import OrdersHistoryPage from "./pages/Orders";
import AnalyticsPage from "./pages/Analytics";

import NotFound from "./pages/NotFound";
import { useBootstrap } from "./hooks/useBootstrap";
import { useSocketEvents } from "./socket/events";
import ErrorBoundary from "./components/common/ErrorBoundary";

export default function App() {
  useBootstrap();
  // useSocketEvents();

  useEffect(() => {
    document.title = "Voice AI Ordering";
  }, []);

  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrdersHistoryPage />} />
          <Route path="/order/:id" element={<OrderPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
