/**
 * Content script for vacancy sites: puts an indicative net amount next to each
 * gross salary on the page. Everything happens in the page; nothing is sent anywhere.
 */
import { detailUrl, netLabel, netTooltip, parseSalary, type Salary } from "./salary.ts";

const HOST_TAG = "nettoplaatje-netto";
const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "SELECT", "OPTION", "TITLE", "HEAD", HOST_TAG.toUpperCase()]);
const done = new WeakSet<Node>();

const STYLE = `
  :host { all: initial; display: inline-block; margin: 2px 0 2px 6px; vertical-align: middle; }
  a { display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px; border-radius: 999px;
      background: #e3f5f0; color: #0d7a6a; font: 700 12px/1.5 Arial, Helvetica, sans-serif;
      text-decoration: none; white-space: nowrap; cursor: pointer; }
  a:hover { background: #cdeee5; }
  svg { flex: none; }
`;

const ICON = `<svg viewBox="8 12 48 44" width="12" height="12" aria-hidden="true"><rect x="12" y="40" width="9" height="12" rx="2.5" fill="#5c7a92"/><rect x="27.5" y="30" width="9" height="22" rx="2.5" fill="#8fd9cc"/><rect x="43" y="16" width="9" height="36" rx="2.5" fill="#129783"/></svg>`;

function badge(salary: Salary): HTMLElement {
  const host = document.createElement(HOST_TAG);
  const root = host.attachShadow({ mode: "closed" });
  const style = document.createElement("style");
  style.textContent = STYLE;
  const link = document.createElement("a");
  const url = detailUrl(salary);
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener";
  link.title = netTooltip(salary);
  link.innerHTML = ICON;
  link.append(document.createTextNode(netLabel(salary)));
  // Vacancy cards are often links themselves: open only Nettoplaatje, not the vacancy.
  link.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    window.open(url, "_blank", "noopener");
  });
  root.append(style, link);
  return host;
}

function skip(element: Element | null): boolean {
  for (let node = element; node; node = node.parentElement) {
    if (SKIP.has(node.tagName) || (node as HTMLElement).isContentEditable) return true;
  }
  return false;
}

/** Whether this element cuts off what does not fit ("€ 3.157 - € 4.245 per maand…"). */
function clips(element: Element): boolean {
  const style = getComputedStyle(element);
  return style.textOverflow === "ellipsis" || /hidden|clip/.test(style.overflowX) || style.webkitLineClamp !== "none";
}

/** The outermost of the nearest few ancestors that clip; the badge goes after it so it stays visible. */
function clippingBox(element: Element): Element | null {
  let box: Element | null = null;
  for (let node: Element | null = element, depth = 0; node && depth < 3; node = node.parentElement, depth++) {
    if (clips(node)) box = node;
  }
  return box;
}

/** Put a badge after the salary in this text node, or after its short parent when the text is split up. */
function handle(node: Text) {
  const parent = node.parentElement;
  if (done.has(node) || !parent || done.has(parent) || skip(parent)) return;
  done.add(node);
  let salary = parseSalary(node.textContent ?? "");
  let split = false;
  if (!salary) {
    const whole = parent.textContent ?? "";
    if (whole.length > 160) return;
    salary = parseSalary(whole);
    split = true;
  }
  if (!salary) return;
  done.add(parent);
  const box = clippingBox(parent);
  if (box) box.after(badge(salary));
  else if (split) parent.append(badge(salary));
  else node.after(badge(salary));
}

function scan(root: Node) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => (/€\s?\d/.test(node.textContent ?? "") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  const found: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) found.push(node as Text);
  found.forEach(handle);
}

// Search results load more cards while you scroll or filter: scan again, at most a few times a second.
let pending = false;
const observer = new MutationObserver(() => {
  if (pending) return;
  pending = true;
  setTimeout(() => {
    pending = false;
    scan(document.body);
  }, 400);
});

scan(document.body);
observer.observe(document.body, { childList: true, subtree: true, characterData: true });
