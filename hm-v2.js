/* Her Movement Club – Erweiterungen (Nov 2026)
   1) Eingaben & Ansicht bleiben erhalten, wenn man kurz in eine andere App wechselt
   2) Coach: Tagespunkte pro Kundin (Reiter „Tagespunkte“)
   3) Challenges: auf der Startseite sichtbar, Coach kann selbst abhaken
   Läuft im selben Kontext wie die App (nach dem Haupt-Script geladen). */

// ---------- 1) Zustand merken ----------
const V2_KEY = "hmV2State";
const V2_MAX_AGE = 3 * 3600 * 1000;
let v2Restored = false, v2Drafts = {};
const v2Read = () => { try { const o = JSON.parse(sessionStorage.getItem(V2_KEY) || localStorage.getItem(V2_KEY) || "null"); return o && Date.now() - o.t < V2_MAX_AGE ? o : null; } catch (e) { return null; } };
function v2FieldKey(el) {
  if (!el || !/INPUT|TEXTAREA|SELECT/.test(el.tagName) || el.type === "file" || el.type === "password" || el.type === "checkbox" || el.type === "radio") return null;
  if (el.id) return "#" + el.id;
  const d = Object.entries(el.dataset || {}).map(([k, v]) => k + "=" + v).sort().join("&"); return d ? "[" + d + "]" : null;
}
function v2Snapshot() {
  try {
    const st = { t: Date.now(), uid: S.uid || null, route: S.route || null, scroll: window.scrollY || 0, drafts: v2Drafts };
    if (S.c) st.c = { view: S.c.view, sel: S.c.sel, tab: S.c.tab, meTab: S.c.meTab };
    if (S.meal && document.getElementById("layer")?.innerHTML) st.meal = S.meal;
    const s = JSON.stringify(st); sessionStorage.setItem(V2_KEY, s); try { localStorage.setItem(V2_KEY, s); } catch (e) { }
  } catch (e) { }
}
document.addEventListener("input", e => { const k = v2FieldKey(e.target); if (!k) return; v2Drafts[k] = { v: e.target.value, t: Date.now() }; }, true);
// Gespeichert → Entwurf vergessen
document.addEventListener("click", e => { const b = e.target.closest?.("[data-act]"); if (!b) return; if (/save|send|submit|add|done|close|delete|del|remove|speicher/i.test(b.dataset.act)) setTimeout(() => { v2Drafts = {}; v2Snapshot(); }, 300); }, true);
document.addEventListener("visibilitychange", () => { if (document.hidden) v2Snapshot(); });
window.addEventListener("pagehide", v2Snapshot);
function v2ApplyDrafts(scope) {
  const now = Date.now(); Object.entries(v2Drafts).forEach(([k, o]) => {
    if (!o || now - o.t > V2_MAX_AGE) { delete v2Drafts[k]; return; }
    let el = null; try { el = k[0] === "#" ? document.getElementById(k.slice(1)) : null; if (!el && k[0] === "[") { const sel = k.slice(1, -1).split("&").map(p => { const i = p.indexOf("="); return `[data-${p.slice(0, i).replace(/[A-Z]/g, m => "-" + m.toLowerCase())}="${CSS.escape(p.slice(i + 1))}"]`; }).join(""); el = (scope || document).querySelector(sel); } } catch (e) { }
    if (el && el !== document.activeElement && el.value !== o.v) { el.value = o.v; try { el.dispatchEvent(new Event("input", { bubbles: true })); } catch (e) { } }
  });
}
function v2TryRestore() {
  if (v2Restored) return; const st = v2Read(); if (!st) { v2Restored = true; return; }
  if (!S.sess || !S.uid) return; // erst nach Anmeldung
  v2Restored = true; if (st.uid && st.uid !== S.uid) return;
  v2Drafts = st.drafts || {};
  try {
    if (st.c && S.sess.role === "coach" && S.c) { Object.assign(S.c, Object.fromEntries(Object.entries(st.c).filter(([, v]) => v != null))); }
    else if (st.route && st.route !== S.route && typeof VIEWS[st.route] === "function") S.route = st.route;
    if (st.meal && typeof sheet === "function" && typeof mealSheet === "function") { S.meal = st.meal; setTimeout(() => { try { sheet(mealSheet); v2ApplyDrafts(document.getElementById("layer")); } catch (e) { } }, 60); }
  } catch (e) { }
  setTimeout(() => { try { doRender(); v2ApplyDrafts(); window.scrollTo(0, st.scroll || 0); } catch (e) { } }, 30);
}
const _doRenderV2 = doRender;
doRender = function () { _doRenderV2(); try { v2TryRestore(); } catch (e) { } };

// ---------- 2) Tagespunkte pro Kundin ----------
const V2_PK = ["training", "mobility", "food", "goals", "journal", "checkups"];
// Challenge-Punkte des Tages (zählen im Monat schon mit; hier nur, damit sie auch am Tag sichtbar sind)
function v2ChDay(prof, d) { const done = prof?.challenges || {}; return (S.challenges?.list || []).filter(c => done[c.id] && String(done[c.id]).slice(0, 10) === d).reduce((a, c) => a + num(c.points), 0); }
function v2DayTable(key, n) {
  const uid = uidFor(key); if (!uid) return `<div class="empty">${esc(clientName(key))} hat sich noch nicht angemeldet.</div>`;
  const prof = S.c.members[uid] || {}, ib = S.c.masters[key] || {}, days = S.c.days[uid] || {};
  const rows = []; let sum = 0;
  for (let i = 0; i < n; i++) {
    const d = addD(today(), -i), D = days[d]; const b = D ? pointsBreakdown(D, prof, ib) : {};
    const chd = v2ChDay(prof, d); const tot = Object.values(b).reduce((a, x) => a + (num(x) || 0), 0) + chd; sum += tot;
    const meals = D ? (D.meals || []).length : 0, wk = D ? (D.workouts || []).length : 0;
    rows.push(`<tr${tot ? "" : ' style="opacity:.55"'}><td>${fmt(d, { weekday: "short", day: "2-digit", month: "2-digit" })}</td>${V2_PK.map(k => `<td class="num">${num(b[k]) || "–"}</td>`).join("")}<td class="num">${chd || "–"}</td><td class="num"><b class="gold">${tot}</b></td><td class="tiny muted">${meals} Mahlz. · ${wk} Train.</td></tr>`);
  }
  const m = monthKey(); const ch = chPointsFor(prof, m);
  return `<section class="card"><div class="row between"><h3>Tagespunkte · letzte ${n} Tage</h3><span class="pill gold num">${sum} Punkte</span></div>
   <div class="tablewrap"><table class="t"><thead><tr><th>Tag</th>${V2_PK.map(k => `<th>${({ checkups: "Check-up" })[k] || PT_LABEL[k] || k}</th>`).join("")}<th>Challenge</th><th>Summe</th><th></th></tr></thead><tbody>${rows.join("")}</tbody></table></div>
   <p class="tiny muted">Ernährung: ${PTS.food} Punkte ab 2 getrennt gespeicherten Mahlzeiten pro Tag (nicht pro Mahlzeit). Challenges stehen am Tag, an dem sie abgehakt wurden (diesen Monat ${ch} Punkte).</p>
   <div class="row">${[7, 14, 31].map(x => `<button class="btn small ${x === n ? "" : "quiet"}" data-act="v2Days" data-v="${x}">${x} Tage</button>`).join("")}</div></section>`;
}
const _coachClientV2 = coachClient;
coachClient = function () {
  const tab = S.c.tab; let h = _coachClientV2();
  const btn = `<button class="${tab === "tagespunkte" ? "on" : ""}" data-act="ctab" data-v="tagespunkte">Tagespunkte</button>`;
  const at = h.indexOf(`data-act="ctab" data-v="persoenlich">`); if (at >= 0) { const s = h.lastIndexOf("<button", at); h = h.slice(0, s) + btn + h.slice(s); }
  if (tab === "tagespunkte") h += `<section class="stack">${v2DayTable(S.c.sel, S.c.v2n || 14)}</section>`;
  return h;
};
// Punkte-Übersicht: Name antippen → direkt Tagespunkte
const _coachPointsV2 = coachPoints;
coachPoints = function () { return _coachPointsV2().replace(/data-act="openClient" data-k="([^"]+)"/g, 'data-act="v2OpenPts" data-k="$1"') + `<p class="tiny muted">Tipp: Namen antippen zeigt die Punkte Tag für Tag.</p>`; };

// ---------- 3) Challenges ----------
const _homeV2pts = VIEWS.home;
VIEWS.home = () => { const h = _homeV2pts(); const c = S.profile ? v2ChDay(S.profile, today()) : 0; if (!c) return h; return h.replace(/(\d+) Punkte heute/, (m, n) => (+n + c) + " Punkte heute"); };
const v2ActiveCh = () => (S.challenges?.list || []).filter(c => (!c.start || c.start <= today()) && (!c.end || c.end >= today()));
// Startseite: Zeile „Challenges“ in den Aufklapp-Zeilen
const _homeV2 = VIEWS.home;
VIEWS.home = () => {
  let h = _homeV2(); const L = v2ActiveCh(); if (!L.length || !S.profile) return h;
  const done = S.profile.challenges || {}; const open = L.filter(c => !done[c.id]); const pts = L.filter(c => done[c.id]).reduce((a, c) => a + num(c.points), 0);
  const row = `<button class="h3row" data-act="v2Ch">${h3Row("var(--gold)", "star", "Challenges", open.length ? open.length + " offen · bis zu +" + open.reduce((a, c) => a + num(c.points), 0) + " Punkte" : "Alle geschafft ✓ · +" + pts + " Punkte", true)}</button>`;
  const i = h.indexOf(`<section class="h3card">`, h.indexOf(`<div class="h3sec"><h3>Dein Tag</h3>`)); if (i < 0) return h; return h.slice(0, i + 24) + row + h.slice(i + 24);
};
// Coach: in „Challenges“ selbst abhaken
const _coachChallengesV2 = coachChallenges;
coachChallenges = function () {
  try { ensureCoachSelf(); } catch (e) { }
  let h = _coachChallengesV2(); const mine = (S.profile && S.profile.key === "__lisa" && S.profile.challenges) || {};
  (S.c.ch || []).forEach((c, i) => { if (!c.id) return; const on = !!mine[c.id]; const b = `<div class="row" style="align-items:center;gap:10px"><button class="btn small ${on ? "quiet" : ""}" data-act="v2ChMe" data-id="${esc(c.id)}">${on ? "Ich hab's geschafft ✓" : "Ich hab's geschafft (+" + num(c.points) + ")"}</button><span class="tiny muted">zählt für deine eigenen Punkte</span></div>`;
    h = h.replace(`<button class="btn small danger" data-act="chDel" data-i="${i}">Entfernen</button></div>`, `<button class="btn small danger" data-act="chDel" data-i="${i}">Entfernen</button></div>${b}`); });
  return h;
};
document.addEventListener("click", e => {
  const el = e.target.closest?.("[data-act]"); if (!el) return; const a = el.dataset.act;
  if (a === "v2Days") { e.stopImmediatePropagation(); S.c.v2n = +el.dataset.v; render(); }
  else if (a === "v2OpenPts") { e.stopImmediatePropagation(); S.c.sel = el.dataset.k; S.c.tab = "tagespunkte"; S.c.view = "client"; S.c.draft = {}; S.c.dirty = false; render(); window.scrollTo(0, 0); }
  else if (a === "v2Ch") { e.stopImmediatePropagation(); if (S.sess?.role === "coach") { S.c.view = "me"; S.c.meTab = "challenges"; render(); } else go("challenges"); window.scrollTo(0, 0); }
  else if (a === "v2ChMe") { e.stopImmediatePropagation(); if (!S.profile || S.profile.key !== "__lisa") { toast("Dein Bereich lädt noch, bitte gleich nochmal tippen"); try { ensureCoachSelf(); } catch (x) { } return; }
    const ch = S.profile.challenges ||= {}; const id = el.dataset.id; if (ch[id]) delete ch[id]; else ch[id] = today(); saveProfile(); queueScore(); toast(ch[id] ? "Challenge geschafft 💪" : "Zurückgenommen"); render(); }
}, true);
