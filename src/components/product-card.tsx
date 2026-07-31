/**
 * Edge-to-edge merchandising card. Consumes a structured Product metadata
 * object only — title, pattern, price attributes, stock status, variants.
 */
import { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatNGN, unitPriceFor, buildSku, type Product } from "@/data/catalog";
import { useStore } from "@/lib/store";

const STOCK_STYLES: Record<Product["stock_status"], string> = {
  "In Stock": "text-success before:bg-success",
  "Limited Stock": "text-clay before:bg-clay",
  "Inquire for Timeline": "text-muted-foreground before:bg-muted-foreground",
};

export function ProductCard({ product }: { product: Product }) {
  const { addLine, openCart } = useStore();
  const [option, setOption] = useState<string>(product.options[0] ?? product.variant);
  const [qty, setQty] = useState(product.minQty);
  const [justAdded, setJustAdded] = useState(false);

  const unitPrice = unitPriceFor(product, qty);
  const tierApplied = unitPrice < product.base_price;
  const step = product.minQty >= 10 ? 5 : 1;

  function handleAdd() {
    addLine(product, option, qty);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
    toast.success(`${product.name} added`, {
      description: `${buildSku(product, option)} · ${option} · ${qty} × ${formatNGN(unitPrice)}`,
      action: { label: "View bag", onClick: openCart },
    });
  }

  return (
    <article className="group flex flex-col border border-border bg-card transition-shadow duration-500 hover:shadow-[var(--shadow-editorial)]">
      <div className="media-zoom relative aspect-[4/5] bg-secondary">
        <img
          src={product.image}
          alt={`${product.name} — ${product.pattern} Ankara print`}
          width={1024}
          height={1280}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <span className="absolute left-0 top-4 bg-charcoal px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-linen">
          {product.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        {/* Catalog-SEO micro-layout: isolated title / stock / price blocks. */}
        <header className="min-w-0">
          <h3 className="font-display text-xl leading-snug tracking-tight">{product.name}</h3>
          <p className="mt-1 text-eyebrow text-muted-foreground">
            {product.pattern} · {product.variant}
          </p>
        </header>

        <p
          className={`mt-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] before:h-1.5 before:w-1.5 before:rounded-full before:content-[''] ${STOCK_STYLES[product.stock_status]}`}
        >
          {product.stock_status}
        </p>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

        <div className="mt-5">
          <p className="text-eyebrow text-muted-foreground">{product.optionLabel}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {product.options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setOption(opt)}
                aria-pressed={option === opt}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  option === opt
                    ? "border-charcoal bg-charcoal text-linen"
                    : "border-border text-foreground/70 hover:border-gold hover:text-foreground"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {product.volumeTiers && (
          <ul className="mt-4 space-y-1 border-l-2 border-gold/70 pl-3">
            {product.volumeTiers.map((tier) => (
              <li
                key={tier.minQty}
                className={`flex items-center justify-between text-xs ${
                  unitPrice === tier.unitPrice ? "font-bold text-foreground" : "text-muted-foreground"
                }`}
              >
                <span>{tier.label}</span>
                <span>{formatNGN(tier.unitPrice)} / pack</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto pt-6">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="font-display text-2xl leading-none tracking-tight">
                {formatNGN(unitPrice)}
              </p>
              <p className="mt-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {tierApplied ? "Volume rate applied" : `Per ${product.minQty >= 10 ? "pack" : "piece"}`}
              </p>
            </div>
            <div className="flex shrink-0 items-center border border-border">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQty((q) => Math.max(product.minQty, q - step))}
                className="grid h-9 w-9 place-items-center text-foreground/70 transition-colors hover:bg-secondary"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-10 text-center text-sm font-semibold tabular-nums">{qty}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQty((q) => q + step)}
                className="grid h-9 w-9 place-items-center text-foreground/70 transition-colors hover:bg-secondary"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className={`magnetic mt-4 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.22em] ${
              justAdded ? "bg-success text-linen" : "bg-charcoal text-linen hover:bg-charcoal-deep"
            }`}
          >
            {justAdded ? (
              <>
                <Check className="h-4 w-4" /> Added to bag
              </>
            ) : (
              <>Add · {formatNGN(unitPrice * qty)}</>
            )}
          </button>
          <p className="mt-2.5 text-center text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            SKU {buildSku(product, option)}
          </p>
        </div>
      </div>
    </article>
  );
}