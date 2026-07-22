import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

import { fetchRestaurants } from "@/redux/slices/restaurantSlice";
import { fetchMenu } from "@/redux/slices/menuSlice";
import { fetchAnalytics } from "@/redux/slices/analyticsSlice";

export function useBootstrap() {
  const dispatch = useAppDispatch();

  const sessionId = useAppSelector((s) => s.session.sessionId);

  // Load restaurant + menu once
  useEffect(() => {
    dispatch(fetchRestaurants());
    dispatch(fetchMenu());
  }, [dispatch]);

  // Load analytics only for active voice session
  useEffect(() => {
    if (!sessionId) return;

    dispatch(fetchAnalytics(sessionId));
  }, [sessionId, dispatch]);
}