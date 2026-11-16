import Link from "next/link";
import { AMOUNT_PAGES, amountLabel, amountPath } from "../../lib/amounts";

/** Grid of links to every amount page; the current one is marked. */
export default function AmountLinks({ current, heading = "Veelgezochte bedragen" }: { current?: string; heading?: string }) {
  const groups = [
    { title: "Per maand", pages: AMOUNT_PAGES.filter((page) => page.kind === "maand") },
    { title: "Per jaar", pages: AMOUNT_PAGES.filter((page) => page.kind === "jaar") },
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
  </div>;
}
