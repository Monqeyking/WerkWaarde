import Link from "next/link";
import { Fragment } from "react";

const LINK = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;

/** Renders plain text with inline `[text](/path)` links to internal pages. */
export function RichText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    parts.push(<Link key={index} href={match[2]}>{match[1]}</Link>);
    last = index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts.map((part, index) => <Fragment key={index}>{part}</Fragment>)}</>;
}

/** Plain text without link markup, for meta tags and structured data. */
export function stripLinks(text: string) {
  return text.replace(LINK, "$1");
}
