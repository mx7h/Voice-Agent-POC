
## Goal

Replace the current TanStack Start scaffold with a plain Vite + React 19 + TypeScript SPA that consumes the existing backend at `http://localhost:5000/api/v1` (configurable) and its Socket.IO gateway at `http://localhost:5000`. No backend code will be written.

## Stack

React 19, TypeScript, Vite, Tailwind v4, shadcn/ui, Redux Toolkit + react-redux, react-router-dom v6, axios, socket.io-client, react-hook-form, zod, react-hot-toast.

## Teardown of the TanStack shell

Remove: `src/routes/`, `src/routeTree.gen.ts`, `src/router.tsx`, `src/server.ts`, `src/start.ts`, TanStack-specific deps (`@tanstack/react-router`, `@tanstack/react-start`, `@tanstack/react-query`, router vite plugin), and the TanStack error-reporting hooks it wires. Keep Tailwind v4 setup in `src/styles.css` and shadcn primitives under `src/components/ui/`.

Add: standard SPA entry (`index.html` at project root, `src/main.tsx` mounting `<BrowserRouter><Provider><App/></Provider></BrowserRouter>`), `src/App.tsx` with routes. Update `vite.config.ts` to a plain React SPA config.

Env: `VITE_API_URL` (default `http://localhost:5000/api/v1`), `VITE_SOCKET_URL` (default `http://localhost:5000`). Add `.env.example`.

## Folder structure

Exactly as specified:

```text
src/
  api/          axios.ts, restaurant.api.ts, menu.api.ts, session.api.ts,
                cart.api.ts, order.api.ts, analytics.api.ts, callLog.api.ts
  components/
    layout/     AppShell, Header, Footer (connection/session bar)
    restaurant/ RestaurantInfo, RestaurantStatusBadge
    menu/       MenuCategories, MenuList, MenuItemCard, MenuSearch
    cart/       CartPanel, CartItemRow, CartSummary, PlaceOrderButton
    transcript/ TranscriptPanel, VoiceRecorder (mic), ConversationStatus
    analytics/  AnalyticsPanel, StatTile
    order/      OrderDetails, OrderStatusBadge
    common/     Loading, ErrorBoundary, EmptyState, ConfirmDialog
  hooks/        useSession, useSocket, useCart, useMenu, useRestaurant,
                useAnalytics, useTranscript, useVoiceRecorder
  pages/
    Home/       three-panel dashboard (restaurant + menu | transcript | cart+analytics)
    Menu/       full menu browser
    Cart/       cart-only view
    Order/      OrderConfirmation, OrderList
    Analytics/  analytics dashboard
  redux/
    slices/     sessionSlice, restaurantSlice, menuSlice, cartSlice,
                orderSlice, transcriptSlice, analyticsSlice, uiSlice
    store.ts, hooks.ts (typed useAppDispatch/useAppSelector)
  socket/       socket.ts (singleton client), events.ts (event constants + typed handlers)
  types/        api DTOs, redux state, socket payloads
  utils/        formatting (currency, time), classnames, storage
  App.tsx, main.tsx
```

## Application flow

1. On app mount: dispatch `bootstrapSession` thunk → `POST /sessions` → store `sessionId` in Redux + `localStorage` (reuse if present and `GET /sessions/:id` still valid).
2. Connect Socket.IO singleton, emit `session:join` with `sessionId`. Emit `session:leave` on unload.
3. In parallel, fetch restaurant (`GET /restaurant`), menu (`GET /menu`), cart (`GET /cart/:sessionId`), analytics (`GET /analytics/:sessionId`), call log (`GET /call-logs/:sessionId`).
4. Render Home dashboard.

## Routing (react-router-dom v6)

- `/` → Home dashboard
- `/menu` → Menu page (search, category filter, add-to-cart)
- `/cart` → Cart page
- `/order/:id` → Order confirmation / details
- `/analytics` → Analytics page
- `*` → NotFound

`AppShell` renders header + Outlet + footer status bar (connection state, socket state, sessionId).

## Redux slices

- `sessionSlice`: `sessionId`, `status: 'idle'|'creating'|'ready'|'error'`.
- `restaurantSlice`: current restaurant, `isOpen`, list.
- `menuSlice`: items, categories (derived), selectedCategory, searchQuery, loading.
- `cartSlice`: items, totals; optimistic add/remove reconciled by `cart:updated`.
- `orderSlice`: last placed order, orders list, current order by id.
- `transcriptSlice`: array of `{ role, text, at }` entries, live partials, conversationStatus.
- `analyticsSlice`: session analytics snapshot.
- `uiSlice`: socket connection state, toasts config, modals.

Thunks per slice for the REST endpoints listed in the spec (`createAsyncThunk`).

## Socket wiring

`src/socket/socket.ts` exports `getSocket()` — lazy singleton with `autoConnect: false`, `withCredentials: true`. `src/socket/events.ts` centralizes event names and registers listeners once inside a `SocketProvider` mounted in `App`:

- `connect` / `disconnect` → `uiSlice.setSocketStatus`
- `session:joined` / `session:left` → session log
- `cart:updated` → replace cart state
- `order:placed` → set current order + `navigate('/order/:id')` + toast
- `transcript:updated` → append to transcript
- `analytics:updated` → replace analytics
- `restaurant:status` → update `isOpen` + toast

## Voice assistant (Web Speech API + mic capture)

`VoiceRecorder` component uses `navigator.mediaDevices.getUserMedia` with `MediaRecorder` for capture, and `SpeechRecognition` (webkit-prefixed fallback) for on-device interim transcript rendered locally in the Transcript panel. The authoritative transcript is still driven by `transcript:updated` from the server. Recorded audio blob is exposed via a `onAudio(blob)` callback so future backend upload can be added; for now it stays client-side. Includes push-to-talk button, waveform indicator, permission-denied state, unsupported-browser fallback.

## UX details

- Toaster (`react-hot-toast`) mounted at root.
- Loading skeletons for menu/cart.
- Optimistic add-to-cart with rollback on error.
- `ErrorBoundary` around each page.
- Responsive: 3-column desktop, stacked on mobile via Tailwind breakpoints.
- Menu search debounced 250ms, hits `/menu/search?q=`; category filter hits `/menu/category/:category`.

## Non-goals (per your answers)

- No PATCH-based restaurant editing UI.
- No order status mutation UI.
- No auth.
- No server-side / backend code.

## Deliverable checklist

- TanStack shell removed, plain Vite SPA builds and dev-starts.
- All listed REST endpoints have a typed function in `src/api/*`.
- All listed socket events are handled.
- Redux slices + typed hooks in place; store wired via `<Provider>`.
- All five pages render with live data against `localhost:5000` when the backend is running.
- Mic capture works in Chrome/Edge with graceful fallback.
- Env vars documented in `.env.example` and README snippet.
