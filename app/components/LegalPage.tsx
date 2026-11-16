import { SiteFooter, SiteNav } from "./SiteChrome";

type LegalPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
};

export default function LegalPage({ eyebrow, title, intro, children }: LegalPageProps) {
  return <main>
    <SiteNav />
    <section className="legal-wrap shell">
      <div className="sub-hero legal-hero"><span className="section-kicker">{eyebrow}</span><h1>{title}</h1><p>{intro}</p></div>
      <article className="legal-card">{children}</article>
    </section>
    <SiteFooter />
  </main>;
}
