import { configureStore } from "@reduxjs/toolkit";
import sessionReducer from "./slices/sessionSlice";
import restaurantReducer from "./slices/restaurantSlice";
import menuReducer from "./slices/menuSlice";
import cartReducer from "./slices/cartSlice";
import orderReducer from "./slices/orderSlice";
import transcriptReducer from "./slices/transcriptSlice";
import analyticsReducer from "./slices/analyticsSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    restaurant: restaurantReducer,
    menu: menuReducer,
    cart: cartReducer,
    order: orderReducer,
    transcript: transcriptReducer,
    analytics: analyticsReducer,
    ui: uiReducer,
  },
  middleware: (getDefault) => getDefault({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
