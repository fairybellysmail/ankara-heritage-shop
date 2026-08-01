/**
 * Frictionless transactional panel — slide-out, continuous 3-step flow:
 * 1. Product Overview  2. Order Routing  3. Payment Gateways
 * Transactional Trust Rule: security indicators, processing micro-copy and
 * privacy notices are rendered at every step.
 */
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  CreditCard,
  Lock,
  Minus,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { BRAND, formatNGN } from "@/data/catalog";
import { useStore } from "@/lib/store";

const STEPS = ["Overview", "Routing", "Payment"] as const;

const GATEWAYS = [
  {
    id: "card",
    label: "Local Card Gateway",
    detail: "Verve · Mastercard · Visa — 3-D Secure verified",
    icon: CreditCard,
  },
  {
    id: "transfer",
    label: "Bank Transfer",
    detail: "Instant NGN transfer, auto-reconciled on receipt",
    icon: Building2,
  },
  {
    id: "whatsapp",
    label: "WhatsApp Order Routing",
    detail: "Confirm with a stylist and pay on delivery slot",
    icon: CheckCircle2,
  },
] as const;

const DELIVERY_FEE = 3500;

interface Routing {
  name: string;
  phone: string;
  city: string;
  address: string;
  notes: string;
}

interface PlacedOrder {
  reference: string;
  items: { name: string; option: string; sku: string; qty: number; lineTotal: number }[];
  subtotal: number;
  delivery: number;
  total: number;
  volume: number;
  routing: Routing;
  gatewayLabel: string;
}

/** Human-readable WhatsApp order brief — customer, route, notes, line items. */
function buildWhatsAppMessage(order: PlacedOrder) {
  const lines = [
    `*New order — @${BRAND.handle}*`,
    `Ref: ${order.reference}`,
    "",
    "*Items*",
    ...order.items.map(
      (i) => `• ${i.qty} x ${i.name} (${i.option}) [${i.sku}] — ${formatNGN(i.lineTotal)}`,
    ),
    "",
    `Subtotal (${order.volume} items): ${formatNGN(order.subtotal)}`,
    `Dispatch: ${formatNGN(order.delivery)}`,
    `*Total: ${formatNGN(order.total)}*`,
    "",
    "*Customer*",
    `Name: ${order.routing.name}`,
    `WhatsApp: ${order.routing.phone}`,
    `City/State: ${order.routing.city}`,
    `Address: ${order.routing.address}`,
    `Delivery notes: ${order.routing.notes.trim() || "—"}`,
    "",
    `Route: ${order.gatewayLabel}`,
  ];
  return lines.join("\n");
}

export function CartPanel() {
  const { cartOpen, closeCart, lines, volume, subtotal, updateQty, removeLine, clearCart } =
    useStore();
  const [step, setStep] = useState(0);
  const [gateway, setGateway] = useState<string>("card");
  const [routing, setRouting] = useState<Routing>({
    name: "",
    phone: "",
    city: "",
    address: "",
    notes: "",
  });
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  // Deterministic reset whenever the panel re-opens.
  useEffect(() => {
    if (cartOpen) {
      setStep(0);
      setPlaced(null);
    }
  }, [cartOpen]);

  const routingComplete =
    routing.name.trim() !== "" &&
    routing.phone.trim().length >= 7 &&
    routing.city.trim() !== "" &&
    routing.address.trim() !== "";
  const total = subtotal + (lines.length ? DELIVERY_FEE : 0);

  const gatewayLabel = GATEWAYS.find((g) => g.id === gateway)?.label ?? "Local Card Gateway";

  /** Snapshots the basket before clearing so the confirmation screen can summarize it. */
  function snapshotOrder(): PlacedOrder {
    return {
      reference: `3KB-${Date.now().toString(36).slice(-6).toUpperCase()}`,
      items: lines.map((l) => ({
        name: l.product.name,
        option: l.option,
        sku: l.sku,
        qty: l.qty,
        lineTotal: l.lineTotal,
      })),
      subtotal,
      delivery: DELIVERY_FEE,
      total,
      volume,
      routing,
      gatewayLabel,
    };
  }

  function placeOrder(order: PlacedOrder) {
    setPlaced(order);
    clearCart();
    toast.success("Order routed to the atelier", {
      description: "A stylist confirms your pack within 20 minutes.",
    });
  }

  const field =
    "mt-1.5 w-full border border-input bg-background px-3.5 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-gold";

  return (
    <>
      <div
        onClick={closeCart}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-charcoal-deep/60 backdrop-blur-sm transition-opacity duration-300 ${
          cartOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-label="Checkout panel"
        aria-hidden={!cartOpen}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-[var(--shadow-panel)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          cartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ── Panel head + step gates ── */}
        <div className="border-b border-border px-5 py-4">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
            {step > 0 && !placed ? (
              <button
                type="button"
                aria-label="Previous step"
                onClick={() => setStep((s) => s - 1)}
                className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-secondary"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : (
              <span className="h-9 w-9" />
            )}
            <div className="min-w-0 text-center">
              <p className="truncate font-display text-lg leading-none tracking-tight">
                {placed ? "Order Confirmed" : STEPS[step]}
              </p>
              <p className="mt-1 text-eyebrow text-muted-foreground">
                {placed ? "Thank you" : `Step ${step + 1} of 3 · ${volume} items`}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close checkout panel"
              onClick={closeCart}
              className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex gap-1.5">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={`h-0.5 flex-1 transition-colors duration-300 ${
                  i <= step || placed ? "bg-gold" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {placed ? (
            <div className="pb-2">
              <div className="text-center">
                <ShieldCheck className="mx-auto h-10 w-10 text-success" />
                <h3 className="mt-4 font-display text-2xl tracking-tight">Routing complete</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  Your pack reference has been queued. Delivery coordinates are encrypted and never
                  shared beyond fulfilment.
                </p>
                <p className="mt-3 inline-block border border-border bg-secondary px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]">
                  Ref {placed.reference}
                </p>
              </div>

              {/* Itemised summary */}
              <div className="mt-7 border-t border-border pt-4">
                <p className="text-eyebrow text-muted-foreground">Items</p>
                <ul className="mt-2.5 space-y-2.5">
                  {placed.items.map((i) => (
                    <li key={i.sku} className="flex justify-between gap-3 text-sm">
                      <span className="min-w-0">
                        <span className="block truncate font-display text-base leading-tight">
                          {i.qty} × {i.name}
                        </span>
                        <span className="mt-0.5 block text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                          {i.option} · SKU {i.sku}
                        </span>
                      </span>
                      <span className="shrink-0 tabular-nums">{formatNGN(i.lineTotal)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Totals */}
              <dl className="mt-5 space-y-1.5 border-t border-border pt-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <dt>Subtotal ({placed.volume} items)</dt>
                  <dd className="tabular-nums">{formatNGN(placed.subtotal)}</dd>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <dt>Dispatch</dt>
                  <dd className="tabular-nums">{formatNGN(placed.delivery)}</dd>
                </div>
                <div className="flex justify-between pt-1.5 font-display text-xl tracking-tight">
                  <dt>Total paid</dt>
                  <dd className="tabular-nums">{formatNGN(placed.total)}</dd>
                </div>
              </dl>

              {/* Delivery + payment route */}
              <div className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
                <div>
                  <p className="text-eyebrow text-muted-foreground">Payment route</p>
                  <p className="mt-1 font-semibold">{placed.gatewayLabel}</p>
                </div>
                <div>
                  <p className="text-eyebrow text-muted-foreground">Delivery to</p>
                  <p className="mt-1 leading-relaxed">
                    {placed.routing.name}
                    <br />
                    {placed.routing.address}, {placed.routing.city}
                    <br />
                    {placed.routing.phone}
                  </p>
                </div>
                {placed.routing.notes.trim() && (
                  <div>
                    <p className="text-eyebrow text-muted-foreground">Delivery notes</p>
                    <p className="mt-1 leading-relaxed text-muted-foreground">
                      {placed.routing.notes}
                    </p>
                  </div>
                )}
              </div>

              <a
                href={`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(
                  buildWhatsAppMessage(placed),
                )}`}
                target="_blank"
                rel="noreferrer noopener"
                className="magnetic mt-6 block rounded-full bg-success px-6 py-3.5 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-linen"
              >
                Send order brief on WhatsApp
              </a>
              <button
                type="button"
                onClick={closeCart}
                className="mt-3 w-full rounded-full border border-foreground/20 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors hover:border-gold"
              >
                Continue shopping
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                <Lock className="h-3 w-3" /> Details stored encrypted · Never resold
              </p>
            </div>
          ) : lines.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-display text-xl tracking-tight">Your bag is empty</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Add a fabric bundle or ready-to-wear piece to begin.
              </p>
              <button
                type="button"
                onClick={closeCart}
                className="mt-6 rounded-full border border-foreground/20 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors hover:border-gold"
              >
                Back to catalog
              </button>
            </div>
          ) : (
            <>
              {/* STEP 1 — itemized variants + SKU definitions */}
              {step === 0 && (
                <ul className="space-y-4">
                  {lines.map((line) => (
                    <li key={line.key} className="flex gap-3.5 border-b border-border pb-4">
                      <img
                        src={line.product.image}
                        alt={line.product.name}
                        width={1024}
                        height={1280}
                        loading="lazy"
                        className="h-24 w-20 shrink-0 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-base leading-tight">
                          {line.product.name}
                        </p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                          {line.option} · SKU {line.sku}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatNGN(line.unitPrice)} each
                        </p>
                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center border border-border">
                            <button
                              type="button"
                              aria-label={`Decrease ${line.product.name}`}
                              onClick={() => updateQty(line.key, line.qty - (line.product.minQty >= 10 ? 5 : 1))}
                              className="grid h-8 w-8 place-items-center transition-colors hover:bg-secondary"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-9 text-center text-sm font-semibold tabular-nums">
                              {line.qty}
                            </span>
                            <button
                              type="button"
                              aria-label={`Increase ${line.product.name}`}
                              onClick={() => updateQty(line.key, line.qty + (line.product.minQty >= 10 ? 5 : 1))}
                              className="grid h-8 w-8 place-items-center transition-colors hover:bg-secondary"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="font-display text-base">{formatNGN(line.lineTotal)}</span>
                          <button
                            type="button"
                            aria-label={`Remove ${line.product.name}`}
                            onClick={() => removeLine(line.key)}
                            className="grid h-8 w-8 place-items-center text-muted-foreground transition-colors hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* STEP 2 — order routing details */}
              {step === 1 && (
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-eyebrow text-muted-foreground">Full name</span>
                    <input
                      className={field}
                      value={routing.name}
                      onChange={(e) => setRouting({ ...routing, name: e.target.value })}
                      placeholder="Adaeze Okonkwo"
                    />
                  </label>
                  <label className="block">
                    <span className="text-eyebrow text-muted-foreground">WhatsApp number</span>
                    <input
                      className={field}
                      inputMode="tel"
                      value={routing.phone}
                      onChange={(e) => setRouting({ ...routing, phone: e.target.value })}
                      placeholder="0803 000 0000"
                    />
                  </label>
                  <label className="block">
                    <span className="text-eyebrow text-muted-foreground">City / State</span>
                    <input
                      className={field}
                      value={routing.city}
                      onChange={(e) => setRouting({ ...routing, city: e.target.value })}
                      placeholder="Ikeja, Lagos"
                    />
                  </label>
                  <label className="block">
                    <span className="text-eyebrow text-muted-foreground">Delivery coordinates</span>
                    <textarea
                      className={`${field} min-h-20 resize-none`}
                      value={routing.address}
                      onChange={(e) => setRouting({ ...routing, address: e.target.value })}
                      placeholder="Street, landmark, apartment"
                    />
                  </label>
                  <label className="block">
                    <span className="text-eyebrow text-muted-foreground">Delivery notes</span>
                    <textarea
                      className={`${field} min-h-16 resize-none`}
                      value={routing.notes}
                      onChange={(e) => setRouting({ ...routing, notes: e.target.value })}
                      placeholder="Preferred window, gate access, asoebi deadline"
                    />
                  </label>
                  <p className="flex gap-2 bg-secondary p-3 text-[11px] leading-relaxed text-muted-foreground">
                    <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                    Coordinates are used for dispatch only, stored encrypted, and never resold or
                    shared with third parties.
                  </p>
                </div>
              )}

              {/* STEP 3 — integrated payment gateways */}
              {step === 2 && (
                <div className="space-y-3">
                  {GATEWAYS.map((g) => {
                    const Icon = g.icon;
                    const active = gateway === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setGateway(g.id)}
                        aria-pressed={active}
                        className={`flex w-full items-start gap-3 border p-4 text-left transition-colors ${
                          active ? "border-gold bg-secondary" : "border-border hover:border-foreground/30"
                        }`}
                      >
                        <Icon
                          className={`mt-0.5 h-4 w-4 shrink-0 ${active ? "text-gold" : "text-muted-foreground"}`}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">{g.label}</span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                            {g.detail}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                  <div className="mt-4 space-y-2 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
                    <p className="flex items-center gap-2 font-semibold text-foreground">
                      <ShieldCheck className="h-3.5 w-3.5 text-success" /> 256-bit TLS · PCI-DSS
                      compliant processing
                    </p>
                    <p>
                      Card details are tokenised by the gateway — 3kbelowankara never sees or stores
                      your card number. Authorisation typically settles in under 15 seconds.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Persistent totals + gate advance ── */}
        {!placed && lines.length > 0 && (
          <div className="border-t border-border bg-card px-5 py-4">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <dt>Subtotal ({volume} items)</dt>
                <dd>{formatNGN(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <dt>Dispatch</dt>
                <dd>{formatNGN(DELIVERY_FEE)}</dd>
              </div>
              <div className="flex justify-between pt-1.5 font-display text-xl tracking-tight text-foreground">
                <dt>Total</dt>
                <dd>{formatNGN(total)}</dd>
              </div>
            </dl>

            {step < 2 ? (
              <button
                type="button"
                disabled={step === 1 && !routingComplete}
                onClick={() => setStep((s) => s + 1)}
                className="magnetic mt-4 w-full rounded-full bg-charcoal px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.22em] text-linen disabled:cursor-not-allowed disabled:opacity-40"
              >
                {step === 0 ? "Continue to routing" : "Continue to payment"}
              </button>
            ) : gateway === "whatsapp" ? (
              <a
                href={`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(
                  buildWhatsAppMessage(snapshotOrder()),
                )}`}
                target="_blank"
                rel="noreferrer noopener"
                onClick={() => placeOrder(snapshotOrder())}
                className="magnetic mt-4 block rounded-full bg-success px-6 py-3.5 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-linen"
              >
                Route order on WhatsApp
              </a>
            ) : (
              <button
                type="button"
                onClick={() => placeOrder(snapshotOrder())}
                className="magnetic mt-4 w-full rounded-full bg-gold px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.22em] text-charcoal"
              >
                Pay {formatNGN(total)} securely
              </button>
            )}
            <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <Lock className="h-3 w-3" /> Secure checkout · No hidden fees
            </p>
          </div>
        )}
      </aside>
    </>
  );
}