/*
 * Nettoplaatje embed resizer. Optional: without it the iframe keeps its fixed height.
 * Sizes every <iframe data-nettoplaatje> to the height the calculator reports.
 * Only accepts messages from nettoplaatje.nl, and only a number.
 */
(function () {
  if (window.__nettoplaatjeEmbed) return;
  window.__nettoplaatjeEmbed = true;
  var ORIGIN = "https://nettoplaatje.nl";
  window.addEventListener("message", function (event) {
    if (event.origin !== ORIGIN) return;
    var data = event.data;
    if (!data || data.type !== "nettoplaatje:height" || typeof data.height !== "number") return;
    var height = Math.min(Math.max(Math.round(data.height), 200), 2000);
    var frames = document.querySelectorAll("iframe[data-nettoplaatje]");
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].contentWindow === event.source) frames[i].style.height = height + "px";
    }
  });
})();
