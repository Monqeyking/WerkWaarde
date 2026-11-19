"use client";

import { useState } from "react";

/** Code block with a copy button; falls back to selecting the text when the clipboard is blocked. */
export default function CopyCode({ code }: { code: string }) {
  const [state, setState] = useState<"idle" | "copied" | "select">("idle");
  return <div className="embed-code">
    <pre><code id="embed-snippet">{code}</code></pre>
    <button type="button" className="primary-button" onClick={async () => {
      try {
        await navigator.clipboard.writeText(code);
        setState("copied");
      } catch {
        const range = document.createRange();
        range.selectNodeContents(document.getElementById("embed-snippet")!);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
        setState("select");
      }
    }}>{state === "copied" ? "Gekopieerd ✓" : "Kopieer code"}</button>
    {state === "select" && <small>Kopiëren lukte niet automatisch. De code is geselecteerd: druk op Ctrl+C (of Cmd+C).</small>}
  </div>;
}
