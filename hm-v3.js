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
  let n = 0, run = 0, best = 0; for (let d = from; d <= to; d = addD(d, 1)) { if (v3DayOk(c, d)) { n++; run++; best = Math.max(best, run); } else if (d !== today() && !(window.v5Paused && v5Paused(S.profile, d))) run = 0; }
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
    else if (/timer/.test(c.proof || "") && !done[c.id]) { const t = num(c.secs) || 60; h = h.replace(btn, `<button class="btn small" data-act="v3Timer" data-id="${c.id}">⏱ Timer starten (${v3Fmt(t)})</button>`); }
    else if (c.proof === "video" && !done[c.id]) h = h.replace(btn, v3WaBtn(c));
    if (done[c.id] && S.profile?.chTimer?.[c.id]) h = h.replace(btn, `<span class="pill good">⏱ ${v3Fmt(S.profile.chTimer[c.id].secs)} gehalten ✓</span>`);
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
      ${c.auto ? `<div class="field"><label for="ch${i}days">Tage</label><input class="inp num" id="ch${i}days" data-ch="${i}.days" inputmode="numeric" value="${esc(c.days || "")}" placeholder="z. B. 20"></div>` : `<div class="field"><label for="ch${i}proof">Nachweis</label>${sel("proof", { "": "Ehrlich abhaken", video: "Video per WhatsApp", timer: "Timer in der App", timervideo: "Timer + Video" }, c.proof)}</div>`}</div>
      ${!c.auto && /timer/.test(c.proof || "") ? `<div class="grid2" style="align-items:end"><div class="field"><label for="ch${i}secs">Timer in Sekunden</label><input class="inp num" id="ch${i}secs" data-ch="${i}.secs" inputmode="numeric" value="${esc(c.secs || "")}" placeholder="90 = 1:30 Min."></div><div></div></div><p class="tiny muted">Die Challenge wird erst abgehakt, wenn der Timer ganz durchgelaufen ist.</p>` : ""}
      ${c.auto ? `<div class="grid2" style="align-items:end"><div class="field"><label for="ch${i}mode">Zählweise</label>${sel("mode", { "": "insgesamt", streak: "am Stück" }, c.mode)}</div>${c.auto === "steps" ? `<div class="field"><label for="ch${i}min">Schritte pro Tag</label><input class="inp num" id="ch${i}min" data-ch="${i}.min" inputmode="numeric" value="${esc(c.min || "")}" placeholder="10000"></div>` : "<div></div>"}</div><p class="tiny muted">Die App hakt die Challenge automatisch ab, sobald die Tage erreicht sind.</p>` : ""}`;
    h = h.replace(`<button class="btn small danger" data-act="chDel" data-i="${i}">Entfernen</button></div>`, `<button class="btn small danger" data-act="chDel" data-i="${i}">Entfernen</button></div>${box}`);
  });
  return h;
};
document.addEventListener("change", e => { const t = e.target; if (t?.dataset?.ch && /\.(auto|mode|proof)$/.test(t.dataset.ch)) setTimeout(() => render(), 0); }, true);
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

// ---------- Challenge-Timer (z. B. Plank) ----------
const v3Fmt = t => { t = Math.max(0, Math.round(num(t))); return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"); };
const v3WaBtn = c => `<a class="btn small" data-act="v3Proof" data-id="${c.id}" href="https://wa.me/491638550620?text=${encodeURIComponent("Hallo Lisa-Marie 💪 Ich habe die Challenge „" + c.title + "“ geschafft! Hier mein Video:")}" target="_blank" rel="noopener">Geschafft · Video an Lisa</a>`;
let v3T = null;
function v3Beep(f, ms) { try { const A = v3T.ac || (v3T.ac = new (window.AudioContext || window.webkitAudioContext)()); const o = A.createOscillator(), g = A.createGain(); o.frequency.value = f; g.gain.value = .15; o.connect(g); g.connect(A.destination); o.start(); o.stop(A.currentTime + ms / 1000); } catch (e) { } }
function v3TimerStop() { if (!v3T) return; clearInterval(v3T.iv); try { v3T.lock?.release(); } catch (e) { } document.getElementById("v3Tov")?.remove(); v3T = null; }
function v3TimerDraw() {
  const o = document.getElementById("v3Tov"); if (!o || !v3T) return; const c = v3T.c, T = v3T.total;
  const prep = v3T.phase === "prep", left = prep ? v3T.prep : v3T.left, frac = prep ? 1 : left / T, R = 110, L = 2 * Math.PI * R;
  o.querySelector(".v3big").textContent = prep ? left : v3Fmt(left);
  o.querySelector(".v3lab").textContent = prep ? "Mach dich bereit …" : v3T.phase === "done" ? "Geschafft! 🎉" : "Halten! Du schaffst das 💪";
  o.querySelector("circle.fg").setAttribute("stroke-dashoffset", String(L * (1 - frac)));
  if (v3T.phase === "done") { o.querySelector(".v3hint").textContent = "Challenge abgehakt · +" + num(c.points) + " Punkte"; }
  if (v3T.phase === "done") o.querySelector(".v3btns").innerHTML = (c.proof === "timervideo" ? v3WaBtn(c).replace('class="btn small"', 'class="btn"').replace("Geschafft · Video an Lisa", "Video an Lisa schicken") : "") + `<button class="btn ${c.proof === "timervideo" ? "quiet" : ""}" data-act="v3Tclose">Fertig</button>`;
}
function v3TimerStart(c) {
  v3TimerStop(); const T = num(c.secs) || 60; v3T = { c, total: T, left: T, prep: 5, phase: "prep" };
  const R = 110, L = 2 * Math.PI * R;
  document.body.insertAdjacentHTML("beforeend", `<div id="v3Tov" role="dialog" aria-modal="true" aria-label="Challenge-Timer" style="position:fixed;inset:0;z-index:9999;background:var(--bg,#0e0d10);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:24px;text-align:center">
    <div class="eyebrow">${esc(c.title)}</div>
    <div style="position:relative;width:260px;height:260px"><svg width="260" height="260" viewBox="0 0 260 260" style="transform:rotate(-90deg)"><circle cx="130" cy="130" r="${R}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="12"/><circle class="fg" cx="130" cy="130" r="${R}" fill="none" stroke="var(--lilac,#cdb9f0)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${L}" stroke-dashoffset="0" style="transition:stroke-dashoffset 1s linear"/></svg>
      <div class="v3big num" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:4rem;font-weight:700"></div></div>
    <div class="v3lab" style="font-size:1.1rem"></div>
    <p class="tiny muted v3hint" style="max-width:300px">Bildschirm bleibt an. Abbrechen zählt nicht, du kannst jederzeit neu starten.</p>
    <div class="v3btns stack" style="gap:10px;width:100%;max-width:300px"><button class="btn quiet" data-act="v3Tclose">Abbrechen</button></div></div>`);
  try { navigator.wakeLock?.request("screen").then(l => { if (v3T) v3T.lock = l; }).catch(() => { }); } catch (e) { }
  v3Beep(660, 120); v3TimerDraw();
  v3T.iv = setInterval(() => {
    if (!v3T) return;
    if (v3T.phase === "prep") { v3T.prep--; if (v3T.prep <= 0) { v3T.phase = "run"; v3T.end = Date.now() + T * 1000; v3Beep(880, 300); try { navigator.vibrate?.(200); } catch (e) { } } else v3Beep(660, 80); }
    else if (v3T.phase === "run") { v3T.left = Math.max(0, Math.ceil((v3T.end - Date.now()) / 1000)); if (v3T.left <= 3 && v3T.left > 0) v3Beep(660, 80);
      if (v3T.left <= 0) { v3T.phase = "done"; clearInterval(v3T.iv); v3Beep(990, 500); try { navigator.vibrate?.([200, 100, 200]); } catch (e) { }
        const ch = S.profile.challenges ||= {}; ch[c.id] = today(); (S.profile.chTimer ||= {})[c.id] = { secs: T, at: new Date().toISOString() }; saveProfile(); queueScore(); toast("Challenge geschafft 💪 +" + num(c.points)); render(); } }
    v3TimerDraw();
  }, 1000);
}
window.addEventListener("click", e => {
  const b = e.target.closest?.("[data-act]"); if (!b) return; const a = b.dataset.act;
  if (a === "v3Timer") { e.stopImmediatePropagation(); const c = (S.challenges?.list || []).find(x => x.id === b.dataset.id); if (c && S.profile) v3TimerStart(c); }
  else if (a === "v3Tclose") { e.stopImmediatePropagation(); v3TimerStop(); }
}, true);
document.addEventListener("keydown", e => { if (e.key === "Escape" && v3T && v3T.phase !== "done") v3TimerStop(); });
