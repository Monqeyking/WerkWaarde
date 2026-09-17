type LegalPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
};

export default function LegalPage({ eyebrow, title, intro, children }: LegalPageProps) {
  return <main>
    <header className="topbar shell">
      <a className="brand" href="/"><span className="brand-mark">WW</span><span>Werk<span>Waarde</span></span></a>
      <a className="legal-back" href="/">Terug naar de calculator →</a>
    </header>
    <section className="legal-wrap shell">
      <div className="sub-hero legal-hero"><span className="section-kicker">{eyebrow}</span><h1>{title}</h1><p>{intro}</p></div>
      <article className="legal-card">{children}</article>
    </section>
    <footer className="footer shell"><div className="brand"><span className="brand-mark">WW</span><span>Werk<span>Waarde</span></span></div><span>Een heldere indicatie voor jouw werk- en mobiliteitskeuze.</span><span className="footer-links"><a href="/privacy">Privacy</a><a href="/cookies">Cookies</a><a href="/contact">Contact</a></span></footer>
  </main>;
}
