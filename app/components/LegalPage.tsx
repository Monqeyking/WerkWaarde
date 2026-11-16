import Link from "next/link";
type LegalPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
};

export default function LegalPage({ eyebrow, title, intro, children }: LegalPageProps) {
  return <main>
    <header className="topbar shell">
      <Link className="brand" href="/"><span className="brand-mark">WW</span><span>Werk<span>Waarde</span></span></Link>
      <Link className="legal-back" href="/">Terug naar de calculator →</Link>
    </header>
    <section className="legal-wrap shell">
      <div className="sub-hero legal-hero"><span className="section-kicker">{eyebrow}</span><h1>{title}</h1><p>{intro}</p></div>
      <article className="legal-card">{children}</article>
    </section>
    <footer className="footer shell"><div className="brand"><span className="brand-mark">WW</span><span>Werk<span>Waarde</span></span></div><span>Een heldere indicatie voor jouw werk- en mobiliteitskeuze.</span><span className="footer-links"><Link href="/uitleg">Uitleg</Link><Link href="/privacy">Privacy</Link><Link href="/cookies">Cookies</Link><Link href="/contact">Contact</Link></span></footer>
  </main>;
}
