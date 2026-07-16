import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getSocket } from "./socket";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setCart, fetchCart } from "@/redux/slices/cartSlice";
import { setCurrent } from "@/redux/slices/orderSlice";
import { appendEntry, setPartial } from "@/redux/slices/transcriptSlice";
import { setAnalytics } from "@/redux/slices/analyticsSlice";
import { setStatus as setRestaurantStatus } from "@/redux/slices/restaurantSlice";
import { setSocketStatus } from "@/redux/slices/uiSlice";
import type { Cart, Order, Analytics, TranscriptEntry } from "@/types";

export const EVENTS = {
  SESSION_JOIN: "session:join",
  SESSION_LEAVE: "session:leave",
  SESSION_JOINED: "session:joined",
  SESSION_LEFT: "session:left",
  CART_UPDATED: "cart:updated",
  ORDER_PLACED: "order:placed",
  TRANSCRIPT_UPDATED: "transcript:updated",
  ANALYTICS_UPDATED: "analytics:updated",
  RESTAURANT_STATUS: "restaurant:status",
} as const;

export function useSocketEvents() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const sessionId = useAppSelector((s) => s.session.sessionId);

  useEffect(() => {
    if (!sessionId) return;
    const socket = getSocket();

    const onConnect = () => {
      dispatch(setSocketStatus("connected"));
      socket.emit(EVENTS.SESSION_JOIN, { sessionId });
    };
    const onDisconnect = () => dispatch(setSocketStatus("disconnected"));
    const onConnecting = () => dispatch(setSocketStatus("connecting"));

    const onCart = (payload: Cart) => dispatch(setCart(payload));
    const onOrder = (payload: Order) => {
      dispatch(setCurrent(payload));
      // 1. Optimistic clear — instant UX
      dispatch(setCart(null));
      toast.success("Order placed!");
      navigate(`/order/${payload._id}`);
      // 2. Reconcile with server — guarantees correctness even if cart:updated was missed
      dispatch(fetchCart(sessionId));
    };
    const onTranscript = (payload: TranscriptEntry | { partial: string }) => {
      if ("partial" in payload) dispatch(setPartial(payload.partial));
      else dispatch(appendEntry(payload));
    };
    const onAnalytics = (payload: Analytics) => dispatch(setAnalytics(payload));
    const onRestaurant = (payload: { isOpen: boolean }) => {
      dispatch(setRestaurantStatus(payload));
      toast(payload.isOpen ? "Restaurant is open" : "Restaurant is closed");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("reconnect_attempt", onConnecting);
    socket.on(EVENTS.CART_UPDATED, onCart);
    socket.on(EVENTS.ORDER_PLACED, onOrder);
    socket.on(EVENTS.TRANSCRIPT_UPDATED, onTranscript);
    socket.on(EVENTS.ANALYTICS_UPDATED, onAnalytics);
    socket.on(EVENTS.RESTAURANT_STATUS, onRestaurant);

    dispatch(setSocketStatus("connecting"));
    socket.connect();

    return () => {
      try {
        socket.emit(EVENTS.SESSION_LEAVE, { sessionId });
      } catch {
        /* noop */
      }
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("reconnect_attempt", onConnecting);
      socket.off(EVENTS.CART_UPDATED, onCart);
      socket.off(EVENTS.ORDER_PLACED, onOrder);
      socket.off(EVENTS.TRANSCRIPT_UPDATED, onTranscript);
      socket.off(EVENTS.ANALYTICS_UPDATED, onAnalytics);
      socket.off(EVENTS.RESTAURANT_STATUS, onRestaurant);
    };
  }, [sessionId, dispatch, navigate]);
}
