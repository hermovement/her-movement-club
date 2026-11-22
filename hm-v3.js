/* Her Movement Club – Erweiterungen v3 (Nov 2026)
   1) Links: Video-Workouts ohne Link öffnen direkt die YouTube-Suche; Links in Texten sind antippbar
   2) Ernährung: Favoriten & eigene Lebensmittel sofort auswählbar (leere Suche), „Eintragen“ in „Meine Lebensmittel“
   3) Challenges: automatisch geprüfte Challenges (Eiweiß, Schritte, Wasser, Kalorien, Training, Tracking) mit Fortschritt,
      Nachweis-Option „Video an Lisa-Marie“ für Übungs-Challenges */

// ---------- 1) Links ----------
const v3YT = t => "https://www.youtube.com/results?search_query=" + encodeURIComponent(t);
const _videoCardV3 = videoCard;
videoCard = function (b, bi) {
  let h = _videoCardV3(b, bi); const v = b && b.video;
  if (v && !v.url && v.title) h = h.replace(/<span class="tiny muted">Link folgt von [^<]*<\/span>/, `<a class="btn small" href="${esc(v3YT(v.title))}" target="_blank" rel="noopener">▶ Auf YouTube öffnen</a>`);
  return h;
};
const V3_URL = /(\bhttps?:\/\/[^\s<>"')]+|\bwww\.[^\s<>"')]+|\b(?:youtu\.be|youtube\.com)\/[^\s<>"')]+)/gi;
function v3Linkify(scope) {
  if (!scope) return; const w = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, { acceptNode: n => { if (!n.nodeValue || !/https?:\/\/|www\.|youtu/i.test(n.nodeValue)) return NodeFilter.FILTER_REJECT; const p = n.parentElement; if (!p || p.closest("a,button,input,textarea,select,script,style,label")) return NodeFilter.FILTER_REJECT; return NodeFilter.FILTER_ACCEPT; } });
  const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
  nodes.forEach(n => { const s = n.nodeValue; V3_URL.lastIndex = 0; if (!V3_URL.test(s)) return; V3_URL.lastIndex = 0; const frag = document.createDocumentFragment(); let last = 0, m;
    while ((m = V3_URL.exec(s))) { let u = m[0].replace(/[.,;:!?]+$/, ""); frag.appendChild(document.createTextNode(s.slice(last, m.index))); const a = document.createElement("a"); a.href = safeUrl(u); a.target = "_blank"; a.rel = "noopener"; a.textContent = /youtu/i.test(u) ? "▶ Video öffnen" : u; a.className = "lil"; frag.appendChild(a); last = m.index + u.length; }
    frag.appendChild(document.createTextNode(s.slice(last))); n.parentNode.replaceChild(frag, n); });
}
const _doRenderV3 = doRender;
doRender = function () { _doRenderV3(); try { v3Linkify(document.getElementById("root")); } catch (e) { } try { v3AutoChallenges(); } catch (e) { } };
const _drawSheetV3 = drawSheet;
drawSheet = function () { _drawSheetV3(); try { v3Linkify(document.getElementById("layer")); } catch (e) { } };

// ---------- 2) Ernährung ----------
const _searchRowsV3 = searchRows;
searchRows = function (res, q) {
  if (q) return _searchRowsV3(res, q);
  const favs = S.profile?.favs || []; const foods = allFoods(); S.searchCache = foods;
  const mine = foods.map((F, idx) => ({ F, idx })).filter(x => x.F[7] === "mine");
  let h = "";
  if (favs.length) h += `<div class="label" style="margin-top:4px">★ Deine Favoriten</div>` + favs.map((f, i) => { const s = mealSum(f.items); return `<div class="li"><span class="gold">★</span><div class="grow"><div class="t">${esc(f.name)}</div><div class="s num">${Math.round(s.kcal)} kcal · E ${Math.round(s.p)} g</div></div><button class="btn small quiet" data-act="useFav" data-i="${i}">Übernehmen</button></div>`; }).join("");
  if (mine.length) h += `<div class="label" style="margin-top:8px">Meine Lebensmittel</div>` + _searchRowsV3(mine, "__mine__");
  return h + _searchRowsV3(res, q);
};
const _myfoodsV3 = VIEWS.myfoods;
VIEWS.myfoods = () => _myfoodsV3().replace(/(<button class="linkbtn" data-act="editFood" data-id="([^"]+)")/g, `<button class="btn small quiet" data-act="v3UseFood" data-id="$2">+ Eintragen</button>$1`);
// „Zuletzt & Favoriten“ heißt jetzt „★ Favoriten“
const _mealSheetV3 = mealSheet;
mealSheet = function () { return _mealSheetV3().replace(">Zuletzt & Favoriten</button>", ">★ Favoriten</button>"); };

// ---------- 3) Challenges ----------
const V3_AUTO = { "": "Selbst abhaken", protein: "Eiweißziel", steps: "Schritte", water: "Wasserziel", kcal: "Kalorienziel", training: "Training", tracking: "2+ Mahlzeiten" };
function v3DayOk(c, d) {
  const D = S.days[d]; if (!D) return false;
  const gl = () => goalList(d); const g = k => !!(gl().find(x => x.k === k) || {}).done;
  switch (c.auto) {
    case "protein": return g("protein");
    case "water": return g("water");
    case "kcal": return g("kcal");
    case "steps": return num(D.steps) >= (num(c.min) || num(S.profile?.goals?.steps) || 10000);
    case "training": return (D.workouts || []).length > 0;
    case "tracking": return (D.meals || []).length >= 2;
  } return false;
}
function v3Prog(c) {
  if (!c.auto || !S.profile) return null; const target = Math.max(1, num(c.days) || 1); const from = c.start || monthKey() + "-01", to = c.end && c.end < today() ? c.end : today();
  let n = 0, run = 0, best = 0; for (let d = from; d <= to; d = addD(d, 1)) { if (v3DayOk(c, d)) { n++; run++; best = Math.max(best, run); } else if (d !== today()) run = 0; }
  const v = c.mode === "streak" ? best : n; return { v, target, done: v >= target, streak: c.mode === "streak" };
}
let v3Busy = false;
function v3AutoChallenges() {
  if (v3Busy || !S.profile || !(S.sess?.role === "client" || S.profile.key === "__lisa")) return;
  const list = (S.challenges?.list || []).filter(c => c.auto && (!c.start || c.start <= today())); if (!list.length) return;
  const ch = S.profile.challenges ||= {}; const won = [];
  list.forEach(c => { if (ch[c.id]) return; const p = v3Prog(c); if (p && p.done) { ch[c.id] = today(); won.push(c); } });
  if (won.length) { v3Busy = true; try { saveProfile(); queueScore(); } catch (e) { } setTimeout(() => { v3Busy = false; try { toast("🏆 Challenge geschafft: " + won.map(c => c.title).join(", ") + " (+" + won.reduce((a, c) => a + num(c.points), 0) + ")"); render(); } catch (e) { } }, 50); }
}
const _challengesV3 = VIEWS.challenges;
VIEWS.challenges = () => {
  let h = _challengesV3(); const done = S.profile?.challenges || {};
  (S.challenges?.list || []).forEach(c => {
    const btn = new RegExp(`<button class="btn small[^"]*" data-act="chDone" data-id="${c.id}">[^<]*</button>`);
    if (c.auto) { const p = v3Prog(c); const pct = p ? Math.min(100, Math.round(p.v / p.target * 100)) : 0;
      h = h.replace(btn, done[c.id] ? `<span class="pill good">Geschafft ✓</span>` : `<span class="tiny muted" style="text-align:right">${p ? p.v + " / " + p.target + (p.streak ? " Tage am Stück" : " Tage") : ""}</span>`);
      h = h.replace(`<div class="s">${esc(c.desc || "")}${c.end ? " · bis " + fmt(c.end) : ""}</div>`, `<div class="s">${esc(c.desc || "")}${c.end ? " · bis " + fmt(c.end) : ""}</div><div class="bar" style="margin-top:6px"><i style="width:${done[c.id] ? 100 : pct}%"></i></div><div class="tiny muted" style="margin-top:4px">🤖 Die App prüft das automatisch anhand deiner Einträge${p && p.streak ? " (Tage am Stück)" : ""}.</div>`); }
    else if (c.proof === "video" && !done[c.id]) h = h.replace(btn, `<a class="btn small" data-act="v3Proof" data-id="${c.id}" href="https://wa.me/491638550620?text=${encodeURIComponent("Hallo Lisa-Marie 💪 Ich habe die Challenge „" + c.title + "“ geschafft! Hier mein Video:")}" target="_blank" rel="noopener">Geschafft · Video an Lisa</a>`);
  });
  return h;
};
// Coach-Editor: Prüfung & Nachweis je Challenge
const _coachChallengesV3 = coachChallenges;
coachChallenges = function () {
  let h = _coachChallengesV3();
  (S.c.ch || []).forEach((c, i) => {
    const sel = (k, opts, v) => `<select class="inp" id="ch${i}${k}" data-ch="${i}.${k}">${Object.entries(opts).map(([a, l]) => `<option value="${a}" ${String(v || "") === a ? "selected" : ""}>${l}</option>`).join("")}</select>`;
    const box = `<div class="grid2" style="align-items:end"><div class="field"><label for="ch${i}auto">Wie wird geprüft?</label>${sel("auto", V3_AUTO, c.auto)}</div>
      ${c.auto ? `<div class="field"><label for="ch${i}days">Tage</label><input class="inp num" id="ch${i}days" data-ch="${i}.days" inputmode="numeric" value="${esc(c.days || "")}" placeholder="z. B. 20"></div>` : `<div class="field"><label for="ch${i}proof">Nachweis</label>${sel("proof", { "": "Ehrlich abhaken", video: "Video per WhatsApp" }, c.proof)}</div>`}</div>
      ${c.auto ? `<div class="grid2" style="align-items:end"><div class="field"><label for="ch${i}mode">Zählweise</label>${sel("mode", { "": "insgesamt", streak: "am Stück" }, c.mode)}</div>${c.auto === "steps" ? `<div class="field"><label for="ch${i}min">Schritte pro Tag</label><input class="inp num" id="ch${i}min" data-ch="${i}.min" inputmode="numeric" value="${esc(c.min || "")}" placeholder="10000"></div>` : "<div></div>"}</div><p class="tiny muted">Die App hakt die Challenge automatisch ab, sobald die Tage erreicht sind.</p>` : ""}`;
    h = h.replace(`<button class="btn small danger" data-act="chDel" data-i="${i}">Entfernen</button></div>`, `<button class="btn small danger" data-act="chDel" data-i="${i}">Entfernen</button></div>${box}`);
  });
  return h;
};
document.addEventListener("change", e => { const t = e.target; if (t?.dataset?.ch && /\.(auto|mode)$/.test(t.dataset.ch)) setTimeout(() => render(), 0); }, true);
window.addEventListener("click", e => {
  const b = e.target.closest?.("[data-act]"); if (!b) return; const a = b.dataset.act;
  if (a === "v3UseFood") { e.stopImmediatePropagation(); const f = (S.foods || {})[b.dataset.id]; if (!f) return; const F = [f.name, num(f.kcal), num(f.p), num(f.c), num(f.f), num(f.pg) || 100, f.plabel || "Portion", "mine", f.brand || ""]; S.mealCtx = null; S.meal = newMeal({ mode: "search" }); S.meal.items.push(itemFromF(F, num(f.pg) || 100)); S.meal.name = f.name; sheet(mealSheet); }
  else if (a === "v3Proof") { const ch = S.profile.challenges ||= {}; ch[b.dataset.id] = today(); saveProfile(); queueScore(); setTimeout(() => { toast("Super! Schick Lisa-Marie dein Video 💪"); render(); }, 100); }
}, true);
// Gescanntes Lebensmittel bearbeitet → Barcode bleibt gemerkt
window.addEventListener("click", e => {
  const b = e.target.closest?.('[data-act="saveFood"]'); if (!b || !S.fedit?.id) return; const id = S.fedit.id, code = S.foods?.[id]?.code; if (!code) return;
  setTimeout(() => { const f = S.foods?.[id]; if (f && !f.code) { f.code = code; try { writeNow("members/" + S.uid + "/foods/" + id, f); } catch (x) { } } }, 1500);
}, true);
