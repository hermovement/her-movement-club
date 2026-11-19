/* Her Movement Club – Adventskalender 01.–24.12.2026
   Jeden Tag ploppt ein Türchen auf (vor dem Morgen-Check). Alle Türchen bis heute
   lassen sich über „Adventskalender“ auf der Startseite wieder öffnen.
   Coach sieht unter Mehr → „Adventskalender“ eine Vorschau aller 24 Türchen. */
const ADV_YEAR = 2026, ADV_CODE = "Xmas-HappyME15", ADV_VALID = "31.01.2027";
const ADV = [
  ["s", "Diese Zeit gehört auch dir", "Der Dezember ist voll mit Terminen, Geschenken und To-dos. Nimm dir heute 10 Minuten nur für dich: Tee, Musik, durchatmen. Du hast es verdient."],
  ["u", "Kniebeugen in Zeitlupe", "3 × 12 Kniebeugen. 3 Sekunden runter, kurz halten, kraftvoll hoch. Füße hüftbreit, Knie zeigen in Richtung Zehen."],
  ["m", "Dranbleiben reicht", "Du musst im Dezember nicht perfekt sein. Dranbleiben reicht, auch mit Plätzchen in der Hand."],
  ["u", "Plank", "3 × 30 Sekunden Unterarmstütz. Bauch fest, Po leicht angespannt, Blick zum Boden. Zu schwer? Knie ablegen."],
  ["s", "Danke, Körper", "Dein Körper trägt dich durch jeden einzelnen Tag. Sag heute mal bewusst Danke zu ihm, statt ihn zu kritisieren."],
  ["m", "Nikolaus-Tag 🎅", "Stiefel geputzt? Gönn dir heute etwas, das dir guttut. Ganz ohne schlechtes Gewissen."],
  ["u", "Glute Bridges", "3 × 15 Hüftheben in Rückenlage. Oben 2 Sekunden halten und den Po fest anspannen."],
  ["s", "Leise Stärke", "Stärke ist nicht immer laut. Manchmal heißt Stärke einfach: weitermachen."],
  ["u", "Frische Luft", "20 Minuten spazieren gehen. Handy in die Tasche, Schultern locker, einfach atmen und schauen."],
  ["m", "Nur du und du", "Vergleich dich nur mit einer Frau: mit der, die du gestern warst."],
  ["u", "Ausfallschritte rückwärts", "3 × 10 pro Bein. Großer Schritt nach hinten, hinteres Knie Richtung Boden, über die vordere Ferse hochdrücken."],
  ["s", "Pausen zählen", "Erholung ist auch Training. Wenn dein Körper heute Ruhe will, ist das kein Rückschritt."],
  ["u", "Wandsitzen", "3 × 30 Sekunden mit dem Rücken an der Wand sitzen, Knie etwa im rechten Winkel. Brennt? Dann machst du's richtig."],
  ["m", "Kleine Dinge", "Ein Glas Wasser mehr, ein kurzer Spaziergang, Eiweiß zu jeder Mahlzeit. Kleine Dinge machen den großen Unterschied."],
  ["u", "Liegestütze", "3 × 8 Liegestütze. Auf den Knien ist völlig in Ordnung. Körper bleibt eine gerade Linie."],
  ["s", "Genug", "Du bist genug. Genau jetzt, genau so."],
  ["u", "Mobility-Pause", "10 × Katze-Kuh im Vierfüßlerstand, dann pro Seite 30 Sekunden Hüftöffner im Ausfallschritt. Tut so gut nach langem Sitzen."],
  ["m", "Genieß es", "Weihnachtsfeier, Plätzchen, Glühwein? Genieß es mit allen Sinnen. Morgen geht es einfach normal weiter."],
  ["u", "Burpees light", "3 × 6 Burpees ohne Sprung: in die Hocke, Füße nach hinten in den Stütz, zurück, aufrichten. Tempo nach Gefühl."],
  ["s", "Deine beste Freundin", "Sei heute so lieb zu dir, wie du es zu deiner besten Freundin wärst."],
  ["u", "Seitstütz", "2 × 20 Sekunden pro Seite. Ellbogen unter der Schulter, Hüfte hoch. Leichter mit abgelegtem unteren Knie."],
  ["m", "Was du geschafft hast", "Schau zurück auf dieses Jahr: Was hast du alles geschafft? Schreib dir drei Dinge auf und sei stolz darauf."],
  ["u", "Atmen gegen Weihnachtsstress", "5 Minuten: 4 Sekunden einatmen, 6 Sekunden ausatmen. Hand auf den Bauch. Das beruhigt dein Nervensystem."],
  ["g", "Frohe Weihnachten 🎁", ""],
];
const ADV_T = { s: ["💛", "Für dich"], m: ["✨", "Motivation"], u: ["💪", "Übung des Tages"], g: ["🎁", "Geschenk"] };
const advDate = n => ADV_YEAR + "-12-" + String(n).padStart(2, "0");
const advToday = () => { const t = today(); return t >= advDate(1) && t <= advDate(24) ? +t.slice(8, 10) : 0; };
const advSeen = n => { try { return localStorage.getItem("adv:" + n) === "1" || (window.__advSeen || {})[n]; } catch (e) { return (window.__advSeen || {})[n]; } };
const advMark = n => { (window.__advSeen ||= {})[n] = 1; try { localStorage.setItem("adv:" + n, "1"); } catch (e) { } };
let advOpenNow = 0, advRevealed = false;
const ADV_CSS = `.adv-ov{position:fixed;inset:0;z-index:9100;background:rgba(5,4,8,.78);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}
.adv-box{width:100%;max-width:460px;border-radius:28px;border:1px solid var(--gold);background:radial-gradient(90% 70% at 85% 0%,rgba(230,211,138,.22),transparent 60%),radial-gradient(70% 60% at 0% 100%,rgba(220,200,245,.18),transparent 65%),var(--stage);padding:24px 20px;display:flex;flex-direction:column;gap:14px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.6)}
.adv-door{margin:4px auto;width:160px;height:160px;border-radius:24px;border:2px dashed var(--gold);display:grid;place-items:center;font-family:var(--f-display);font-size:4rem;font-weight:700;color:var(--gold);background:rgba(230,211,138,.08);cursor:pointer;transition:transform .25s}
.adv-door:hover{transform:scale(1.03)}
.adv-in{animation:advIn .5s ease both}@keyframes advIn{from{opacity:0;transform:scale(.9) rotateY(70deg)}to{opacity:1;transform:none}}
.adv-code{font-family:var(--f-ui);font-weight:700;font-size:1.25rem;letter-spacing:.06em;border:2px dashed var(--gold);border-radius:14px;padding:12px;color:var(--gold);user-select:all}
.adv-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.adv-grid button{aspect-ratio:1;border-radius:16px;border:1px solid var(--line);background:var(--stage);color:var(--cream);font-family:var(--f-display);font-size:1.5rem;font-weight:700;cursor:pointer}
.adv-grid button.open{border-color:var(--gold);background:rgba(230,211,138,.12);color:var(--gold)}
.adv-grid button.today{border:2px solid var(--gold);box-shadow:0 0 18px rgba(230,211,138,.35)}
.adv-grid button:disabled{opacity:.35;cursor:default}
@media (prefers-reduced-motion:reduce){.adv-in{animation:none}}`;
(function () { try { if (!document.getElementById("advcss")) document.head.insertAdjacentHTML("beforeend", `<style id="advcss">${ADV_CSS}</style>`); } catch (e) { } })();
function advContent(n) {
  const [t, h, txt] = ADV[n - 1], T = ADV_T[t];
  if (t === "g") return `<p class="eyebrow" style="margin:0">${T[0]} Türchen 24 · ${T[1]}</p><h2 style="margin:0">${h}</h2>
    <p style="margin:0;line-height:1.5">Danke, dass du dieses Jahr mit mir unterwegs warst. Als kleines Dankeschön bekommst du <b class="gold">15 € Rabatt auf einen Leistungsmonat deiner Wahl</b>.</p>
    <div class="adv-code" aria-label="Rabattcode">${ADV_CODE}</div>
    <p class="tiny muted" style="margin:0">Einlösbar bis ${ADV_VALID}. Schick mir einfach den Code, ich ziehe die 15 € bei deiner nächsten Rechnung ab.</p>
    <div class="row" style="justify-content:center;gap:8px"><button class="btn small quiet" data-act="advCopy">Code kopieren</button><a class="btn small" href="https://wa.me/491638550620?text=${encodeURIComponent("Hallo Lisa-Marie 🎄 Ich möchte meinen Weihnachts-Code einlösen: " + ADV_CODE)}" target="_blank" rel="noopener">Per WhatsApp einlösen</a></div>`;
  return `<p class="eyebrow" style="margin:0">${T[0]} Türchen ${n} · ${T[1]}</p><h2 style="margin:0">${esc(h)}</h2><p style="margin:0;line-height:1.55;font-size:1.02rem">${esc(txt)}</p>${t === "u" ? `<p class="tiny muted" style="margin:0">Mach nur, was sich heute gut anfühlt.</p>` : ""}`;
}
function advOverlay(n, reveal) {
  let el = document.getElementById("advOv");
  if (!el) { el = document.createElement("div"); el.id = "advOv"; el.className = "adv-ov"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Adventskalender Türchen " + n); document.body.appendChild(el); }
  el.innerHTML = `<div class="adv-box">${reveal ? `<div class="adv-in" style="display:flex;flex-direction:column;gap:12px">${advContent(n)}</div><button class="btn block" data-act="advClose">${n === advToday() ? "Weiter in den Tag" : "Schließen"}</button>`
    : `<p class="eyebrow" style="margin:0">🎄 Adventskalender</p><h2 style="margin:0">Dein Türchen für heute</h2><button class="adv-door" data-act="advReveal" aria-label="Türchen ${n} öffnen">${n}</button><p class="tiny muted" style="margin:0">Antippen zum Öffnen</p><button class="linkbtn small" data-act="advClose">Später</button>`}</div>`;
}
function advClose() { const el = document.getElementById("advOv"); if (el) el.remove(); if (advOpenNow) advMark(advOpenNow); advOpenNow = 0; advRevealed = false; try { smPopSync(); } catch (e) { } }
// Pop-up: vor dem Morgen-Check
const _smPopSyncADV = smPopSync;
smPopSync = function () {
  const n = advToday(); const home = !!document.querySelector(".h3hero");
  if (n && home && !advSeen(n) && S.profile) { if (!document.getElementById("advOv")) { advOpenNow = n; advRevealed = false; advOverlay(n, false); } const sp = document.getElementById("smPop"); if (sp) sp.remove(); return; }
  if (document.getElementById("advOv")) return; _smPopSyncADV();
};
// Übersicht aller Türchen
VIEWS.advent = () => {
  const n = advToday(), co = S.sess?.role === "coach", pre = co && !n;
  return `<div class="pageh"><div class="eyebrow">🎄 1. bis 24. Dezember</div><h1>Adventskalender</h1><p class="small muted">${pre ? "Vorschau für dich: So sehen die Mädels ihre Türchen. Ab 1. Dezember öffnet sich jeden Morgen eines automatisch." : "Jeden Tag ein Türchen: mal ein Spruch, mal Motivation, mal eine Übung. Am 24. wartet ein Geschenk."}</p></div>
   <section class="card"><div class="adv-grid">${ADV.map((x, i) => { const k = i + 1, ok = pre || co || k <= n; return `<button class="${k <= n || pre ? "open" : ""} ${k === n ? "today" : ""}" data-act="advShow" data-v="${k}" ${ok ? "" : "disabled"} aria-label="Türchen ${k}${ok ? "" : " (noch zu)"}">${k}</button>`; }).join("")}</div></section>`;
};
if (typeof ME_ROUTES !== "undefined") ME_ROUTES.push("advent");
// Startseite: Zeile im Dezember
const _homeADV = VIEWS.home;
VIEWS.home = () => {
  const h = _homeADV(); const n = advToday(); if (!n) return h;
  const row = `<button class="h3row" data-act="go" data-r="advent">${h3Row("var(--gold)", "star", "🎄 Adventskalender", "Türchen " + n + (n === 24 ? " · dein Geschenk wartet" : " · alle bisherigen nochmal ansehen"), true)}</button>`;
  const i = h.indexOf(`<section class="h3card">`, h.indexOf(`<div class="h3sec"><h3>Dein Tag</h3>`)); if (i < 0) return h; return h.slice(0, i + 24) + row + h.slice(i + 24);
};
// Coach: Kachel für die Vorschau
const _coachMoreADV = coachMore;
coachMore = function () { return _coachMoreADV().replace(`<div class="grid2">`, `<div class="grid2"><button class="tile" data-act="go" data-r="advent" style="border-color:var(--gold)"><span aria-hidden="true" style="font-size:1.4rem">🎄</span><b>Adventskalender</b><span>Vorschau der 24 Türchen</span></button>`); };
window.addEventListener("click", e => {
  const b = e.target.closest?.("[data-act]"); if (!b) return; const a = b.dataset.act;
  if (a === "advReveal") { e.stopImmediatePropagation(); advRevealed = true; advOverlay(advOpenNow || advToday(), true); }
  else if (a === "advClose") { e.stopImmediatePropagation(); advClose(); }
  else if (a === "advShow") { e.stopImmediatePropagation(); advOpenNow = +b.dataset.v; advOverlay(advOpenNow, true); }
  else if (a === "advCopy") { e.stopImmediatePropagation(); try { navigator.clipboard.writeText(ADV_CODE).then(() => toast("Code kopiert")); } catch (x) { toast(ADV_CODE); } }
}, true);
document.addEventListener("keydown", e => { if (e.key === "Escape" && document.getElementById("advOv")) advClose(); });
