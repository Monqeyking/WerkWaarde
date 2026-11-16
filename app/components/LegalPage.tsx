import AdSlot from "./AdSlot";
import { SiteFooter, SiteNav } from "./SiteChrome";

type LegalPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
  /** Name used in ad reporting, e.g. the page path. */
  adPlacement?: string;
};

export default function LegalPage({ eyebrow, title, intro, children, adPlacement = "info" }: LegalPageProps) {
  return <main>
    <SiteNav />
    <section className="legal-wrap shell">
      <div className="sub-hero legal-hero"><span className="section-kicker">{eyebrow}</span><h1>{title}</h1><p>{intro}</p></div>
      <article className="legal-card">{children}</article>
    </section>
    <AdSlot placement={adPlacement} />
    <SiteFooter />
  </main>;
}
