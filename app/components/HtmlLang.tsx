"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { langForPath } from "../../lib/lang";

/**
 * Keeps <html lang> right when the visitor moves between Dutch and English pages
 * without a full page load. The exported HTML already has the right value
 * (scripts/html-lang.mjs), so this changes nothing on the first load.
 */
export default function HtmlLang() {
  const pathname = usePathname();
  useEffect(() => {
    document.documentElement.lang = langForPath(pathname ?? "/");
  }, [pathname]);
  return null;
}
