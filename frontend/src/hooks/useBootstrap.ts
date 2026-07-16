import { useEffect } from "react";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { createSession, setSessionId } from "@/redux/slices/sessionSlice";
import { fetchRestaurants } from "@/redux/slices/restaurantSlice";
import { fetchMenu } from "@/redux/slices/menuSlice";
import { fetchCart } from "@/redux/slices/cartSlice";
import { fetchAnalytics } from "@/redux/slices/analyticsSlice";
import { sessionApi } from "@/api/session.api";
import { callLogApi } from "@/api/callLog.api";
import { setEntries } from "@/redux/slices/transcriptSlice";

const STORAGE_KEY = "voice-ai:sessionId";

export function useBootstrap() {
  const dispatch = useAppDispatch();
  const sessionId = useAppSelector((s) => s.session.sessionId);
  const status = useAppSelector((s) => s.session.status);

  // Create or reuse session
  useEffect(() => {
    if (status !== "idle") return;
    const existing = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (existing) {
      sessionApi
        .get(existing)
        .then(() => dispatch(setSessionId(existing)))
        .catch(() => {
          localStorage.removeItem(STORAGE_KEY);
          dispatch(createSession())
            .unwrap()
            .then((id) => localStorage.setItem(STORAGE_KEY, id))
            .catch((e) => toast.error(e.message ?? "Session error"));
        });
    } else {
      dispatch(createSession())
        .unwrap()
        .then((id) => localStorage.setItem(STORAGE_KEY, id))
        .catch((e) => toast.error(e?.message ?? "Session error"));
    }
  }, [status, dispatch]);

  // Load restaurant + menu
  useEffect(() => {
    dispatch(fetchRestaurants());
    dispatch(fetchMenu());
  }, [dispatch]);

  // Session-scoped data
  useEffect(() => {
    if (!sessionId) return;
    dispatch(fetchCart(sessionId));
    dispatch(fetchAnalytics(sessionId));
    callLogApi
      .bySession(sessionId)
      .then((log) => {
        if (log?.transcript) dispatch(setEntries(log.transcript));
      })
      .catch(() => {
        /* optional */
      });
  }, [sessionId, dispatch]);
}
