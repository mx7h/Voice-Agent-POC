export const formatCurrency = (v: number | undefined | null, currency = "USD") =>
  typeof v === "number"
    ? new Intl.NumberFormat("en-US", { style: "currency", currency }).format(v)
    : "—";

export const formatTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
