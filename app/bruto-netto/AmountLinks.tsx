import Link from "next/link";
import { AMOUNT_PAGES, amountLabel, amountPath } from "../../lib/amounts";

/** Grid of links to the amount pages (all, or only `only`); the current one is marked. */
export default function AmountLinks({ current, heading = "Veelgezochte bedragen", only, more }: { current?: string; heading?: string; only?: readonly string[]; more?: boolean }) {
  const pages = only ? AMOUNT_PAGES.filter((page) => only.includes(page.slug)) : AMOUNT_PAGES;
  const groups = [
    { title: "Per maand", pages: pages.filter((page) => page.kind === "maand") },
    { title: "Per jaar", pages: pages.filter((page) => page.kind === "jaar") },
  ];
  return <div className="amount-links">
    <h2>{heading}</h2>
    {groups.map((group) => <div key={group.title} className="amount-links-group">
      <span className="section-kicker">{group.title}</span>
      <div className="amount-links-grid">
        {group.pages.map((page) => page.slug === current
          ? <span key={page.slug} className="amount-link current" aria-current="page">{amountLabel(page)}</span>
          : <Link key={page.slug} className="amount-link" href={amountPath(page)}>{amountLabel(page)}</Link>)}
      </div>
    </div>)}
    {more && <p className="amount-links-more"><Link href="/bruto-netto">Alle {AMOUNT_PAGES.length} bedragen bij de bruto-nettocalculator →</Link></p>}
  </div>;
}
