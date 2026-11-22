"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Lang = "nl" | "en";
type Pair = readonly [nl: string, en: string];

const OPTIONS: ReadonlyArray<{ lang: Lang; label: string; name: string; home: string }> = [
  { lang: "nl", label: "NL", name: "Nederlands", home: "/" },
  { lang: "en", label: "EN", name: "English", home: "/en" },
];

/**
 * NL/EN toggle in the top bar. It links to the same page in the other language
 * when there is one (the hreflang pairs), and otherwise to that language's home.
 * The pairs come in as a prop so the list stays out of the client bundle on pages
 * that render the navigation on the server.
 */
export function LanguageSwitch({ current, pairs }: { current: Lang; pairs: readonly Pair[] }) {
  const path = usePathname();
  const pair = pairs.find(([nl, en]) => nl === path || en === path);
  return <div className="lang-switch" role="group" aria-label={current === "en" ? "Language" : "Taal"}>
    {OPTIONS.map((option) => option.lang === current
      ? <span key={option.lang} className="active" aria-current="true" title={option.name}>{option.label}</span>
      : <Link key={option.lang} href={pair ? pair[option.lang === "nl" ? 0 : 1] : option.home} hrefLang={option.lang} lang={option.lang}
          title={option.name} aria-label={option.name}>{option.label}</Link>)}
  </div>;
}
