import { useEffect, useRef } from "react";

import { cartApi } from "@/api/cart.api";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setCart } from "@/redux/slices/cartSlice";

export function useCartPolling(enabled: boolean) {
  const dispatch = useAppDispatch();

  const sessionId = useAppSelector(
    (state) => state.session.sessionId,
  );

  const intervalRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    const stopPolling = () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    stopPolling();

    console.log("[CART POLLING STATE]", {
      enabled,
      sessionId,
    });

    if (!enabled || !sessionId) {
      dispatch(setCart(null));
      return stopPolling;
    }

    let active = true;

    const fetchCart = async () => {
      if (inFlightRef.current) return;

      try {
        inFlightRef.current = true;

        console.log("[CART POLLING FETCH]", sessionId);

        const cart = await cartApi.get(sessionId);

        console.log("[CART POLLING RESULT]", cart);

        if (active) {
          dispatch(setCart(cart));
        }
      } catch (error) {
        if (active) {
          console.warn("[CART POLLING ERROR]", error);
        }
      } finally {
        inFlightRef.current = false;
      }
    };

    void fetchCart();

    intervalRef.current = window.setInterval(fetchCart, 1500);

    return () => {
      active = false;
      stopPolling();
    };
  }, [enabled, sessionId, dispatch]);
}