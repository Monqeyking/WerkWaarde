import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "../components/AdSlot";
import { SiteFooter, SiteNav } from "../components/SiteChrome";
import { ARTICLES } from "../../lib/articles";
import { CALCULATORS } from "../../lib/calculators";

export const metadata: Metadata = {
  title: "Vragen over salaris, lease en een nieuwe baan",
  description: "Heldere antwoorden over bruto en netto, bijtelling, kilometervergoeding, vakantiegeld, pensioen en het vergelijken van twee banen. Met rekenvoorbeelden.",
  alternates: { canonical: "/vragen" },
};

export default function QuestionsPage() {
  return <main>
    <SiteNav active="questions" />
    <header className="sub-hero shell">
      <span className="hero-kicker"><span className="kicker-line"></span> Vragen en antwoorden</span>
      <h1>Wat je wilt weten voor je een baan kiest</h1>
      <p>Korte, heldere uitleg over salaris, belasting, auto en reizen. Elk antwoord verwijst naar een calculator waarmee je het voor jouw situatie uitrekent.</p>
    </header>
    <section className="shell">
      <div className="kb-grid">
        {ARTICLES.map((article) => <Link key={article.slug} href={`/vragen/${article.slug}`} className="related-card"><strong>{article.title}</strong><span>{article.description}</span></Link>)}
      </div>
      <div className="kb-tools">
        <h2>Zelf uitrekenen</h2>
        <div className="related-list">
          {CALCULATORS.map((tool) => <Link key={tool.href} href={tool.href} className="related-card"><strong>{tool.title}</strong><span>{tool.text}</span></Link>)}
        </div>
      </div>
    </section>
    <AdSlot placement="vragen" />
    <SiteFooter />
  </main>;
}
