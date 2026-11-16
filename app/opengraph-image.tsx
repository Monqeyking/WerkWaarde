import { ImageResponse } from "next/og";
import { SITE_NAME } from "../lib/site";

export const alt = `${SITE_NAME}: wat levert een nieuwe baan je écht op?`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Preview image shown when a link is shared (WhatsApp, LinkedIn, Slack, …). */
export default function OpenGraphImage() {
  const bars = [
    { label: "Netto loon", value: "+€ 374", color: "#129783", width: 520 },
    { label: "Auto en reizen", value: "−€ 145", color: "#ec8b4a", width: 210 },
    { label: "Lunch en parkeren", value: "−€ 92", color: "#ec8b4a", width: 140 },
  ];
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", background: "linear-gradient(135deg, #f5f8f9 0%, #eef6f6 55%, #f4f7ff 100%)", color: "#172d42", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, width: 64, height: 64, padding: "12px 12px", borderRadius: 16, background: "#172d42" }}>
          <div style={{ width: 10, height: 14, borderRadius: 3, background: "#5c7a92" }} />
          <div style={{ width: 10, height: 26, borderRadius: 3, background: "#8fd9cc" }} />
          <div style={{ width: 10, height: 40, borderRadius: 3, background: "#129783" }} />
        </div>
        {/* The image renderer lays out text nodes as separate flex items, so draw each part as its own box with no gap. */}
        <div style={{ display: "flex", fontSize: 40, fontWeight: 800, letterSpacing: -1.5 }}>
          <span>Netto</span><span style={{ color: "#129783", marginLeft: -2 }}>plaatje</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ fontSize: 68, fontWeight: 800, letterSpacing: -3, lineHeight: 1.02, maxWidth: 900 }}>Wat levert een nieuwe baan je écht op?</div>
        <div style={{ fontSize: 28, color: "#6e7f8e" }}>Salaris, pensioen, auto, reiskosten en reistijd in één overzicht.</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {bars.map((bar) => <div key={bar.label} style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 230, fontSize: 22, color: "#516473" }}>{bar.label}</div>
          <div style={{ width: bar.width, height: 18, borderRadius: 9, background: bar.color }} />
          <div style={{ fontSize: 24, fontWeight: 800 }}>{bar.value}</div>
        </div>)}
      </div>
    </div>,
    size,
  );
}
