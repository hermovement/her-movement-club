/* Her Movement Club – Erweiterungen v4 (Nov 2026)
   Essenszeiten: Jede Mahlzeit bekommt automatisch die Uhrzeit, zu der sie eingetragen wird.
   Wer nachträgt, kann die Uhrzeit im Eintrag ändern („Gegessen um“).
   Kundin und Coach sehen pro Tag die Essenszeiten und die längste Pause. */

const V4_GAP_WARN = 5 * 60; // ab 5 Stunden ohne Essen wird die Pause markiert
const v4Pad = n => String(n).padStart(2, "0");
const v4HM = ts => { const d = new Date(ts); return v4Pad(d.getHours()) + ":" + v4Pad(d.getMinutes()); };
const v4LocalDate = ts => { const d = new Date(ts); return d.getFullYear() + "-" + v4Pad(d.getMonth() + 1) + "-" + v4Pad(d.getDate()); };
const v4Min = hm => { const m = /^(\d{1,2}):(\d{2})$/.exec(hm || ""); return m ? +m[1] * 60 + +m[2] : null; };
const v4Dur = min => Math.floor(min / 60) + ":" + v4Pad(min % 60) + " h";
// Uhrzeit einer Mahlzeit: selbst gesetzt > automatisch (nur wenn am selben Tag eingetragen und nicht von der Coach angelegt)
function v4MealTime(m, date) {
  if (!m) return null; if (m.eatAt) return m.eatAt;
  if (m.at && !m.byCoach && v4LocalDate(m.at) === date) return v4HM(m.at);
  return null;
}
function v4DayTimes(D, date) {
  const L = (D?.meals || []).map(m => ({ m, t: v4MealTime(m, date) })).filter(x => x.t).sort((a, b) => v4Min(a.t) - v4Min(b.t));
  let gap = null; for (let i = 1; i < L.length; i++) { const g = v4Min(L[i].t) - v4Min(L[i - 1].t); if (!gap || g > gap.min) gap = { min: g, from: L[i - 1], to: L[i] }; }
  return { list: L, gap, missing: (D?.meals || []).length - L.length };
}
function v4Summary(D, date, coach) {
  const s = v4DayTimes(D, date); if (!s.list.length) return "";
  const warn = s.gap && s.gap.min >= V4_GAP_WARN;
  const times = s.list.map(x => `<span class="num">${x.t}</span> <span class="muted">${esc(x.m.slot || "")}</span>`).join(" · ");
  const gapTxt = s.gap ? `Längste Pause: <b class="num" style="color:${warn ? "var(--warn)" : "inherit"}">${v4Dur(s.gap.min)}</b> <span class="muted">(${s.gap.from.t}–${s.gap.to.t})</span>` : "";
  const tip = warn ? (coach ? " · ein Gesprächsthema?" : " · nächstes Mal vielleicht einen Snack dazwischen?") : "";
  return `<div class="small" style="line-height:1.6">🕒 ${times}${gapTxt ? `<br>${gapTxt}${tip}` : ""}${s.missing ? `<br><span class="tiny muted">${s.missing} Mahlzeit${s.missing > 1 ? "en" : ""} ohne Uhrzeit (nachgetragen)</span>` : ""}</div>`;
}
window.v4GapCell = (D, date) => { const s = v4DayTimes(D, date); return s.gap ? `<span class="num" style="color:${s.gap.min >= V4_GAP_WARN ? "var(--warn)" : "inherit"}">${v4Dur(s.gap.min)}</span>` : "–"; };

// ---- Kundin: Ernährung ----
const _foodV4 = VIEWS.food;
VIEWS.food = () => {
  let h = _foodV4(); const d = S.foodDate || today(), D = S.days[d]; if (!D) return h;
  (D.meals || []).forEach(m => { const t = v4MealTime(m, d); if (t) h = h.replace(`<button class="linkbtn" data-act="editMeal" data-id="${m.id}">`, `<span class="tiny muted num">🕒 ${t}</span><button class="linkbtn" data-act="editMeal" data-id="${m.id}">`); });
  const sum = v4Summary(D, d, false); if (!sum) return h;
  const at = h.indexOf(`<section class="card"><div class="row between"><h3>Letzte 7 Tage</h3>`);
  const card = `<section class="card"><h3>Essenszeiten</h3>${sum}<p class="tiny muted">Die Uhrzeit wird beim Eintragen automatisch gespeichert.</p></section>`;
  return at >= 0 ? h.slice(0, at) + card + h.slice(at) : h + card;
};

// ---- Coach: Reiter Ernährung bei der Kundin ----
const _coachClientV4 = coachClient;
coachClient = function () {
  let h = _coachClientV4(); if (S.c.tab !== "ernaehrung") return h;
  const uid = uidFor(S.c.sel); const days = (uid && S.c.days[uid]) || {};
  Object.entries(days).forEach(([date, D]) => {
    (D.meals || []).forEach(m => { const t = v4MealTime(m, date); if (t) h = h.replace(`<button class="linkbtn" data-act="cEditMeal" data-d="${date}" data-id="${m.id}">`, `<span class="tiny muted num">🕒 ${t}</span><button class="linkbtn" data-act="cEditMeal" data-d="${date}" data-id="${m.id}">`); });
    const sum = v4Summary(D, date, true); if (!sum) return;
    const hd = `<h3>${fmtLong(date)}</h3>`; const i = h.indexOf(hd); if (i < 0) return;
    const j = h.indexOf(`<div class="list">`, i); if (j < 0) return;
    h = h.slice(0, j) + `<div style="margin:2px 0 6px">${sum}</div>` + h.slice(j);
  });
  return h;
};

// ---- Eintrag: „Gegessen um“ ----
const _mealSheetV4 = mealSheet;
mealSheet = function () {
  let h = _mealSheetV4(); const m = S.meal; if (!m) return h;
  const date = ctxDate(); let v = m.eatAt || (m.at && v4LocalDate(m.at) === date && !m.byCoach ? v4HM(m.at) : "");
  if (!v && !m.id && date === today() && !S.mealCtx) v = v4HM(Date.now());
  const field = `<div class="field" style="flex-direction:row;align-items:center;gap:10px"><label for="v4t" style="margin:0">Gegessen um</label><input class="inp num" type="time" id="v4t" value="${v}" style="width:auto"><span class="tiny muted">${date === today() && !S.mealCtx ? "automatisch, nur beim Nachtragen ändern" : "beim Nachtragen gern ergänzen"}</span></div>`;
  const k = h.lastIndexOf(`<div class="row">`, h.indexOf(`data-act="saveMeal"`)); return k >= 0 ? h.slice(0, k) + field + h.slice(k) : h;
};
document.addEventListener("input", e => { if (e.target?.id === "v4t" && S.meal) { S.meal.eatAt = e.target.value || null; S.meal.eatTouched = true; } }, true);
let v4Pending = null;
window.addEventListener("click", e => {
  const b = e.target.closest?.('[data-act="saveMeal"]'); if (!b || !S.meal || !S.meal.items?.length) return;
  if (!S.meal.id) S.meal.id = uidGen();
  const el = document.getElementById("v4t"); const v = el ? el.value : S.meal.eatAt;
  const auto = !S.meal.eatTouched && !S.meal.eatAt; // unverändert → automatische Zeit genügt
  v4Pending = { id: S.meal.id, eatAt: auto && ctxDate() === today() && !S.mealCtx ? null : (v || null) };
}, true);
const _commitV4 = commitCtxDay;
commitCtxDay = function () {
  if (v4Pending) { try { const m = (ctxDay().meals || []).find(x => x.id === v4Pending.id); if (m) { if (v4Pending.eatAt) m.eatAt = v4Pending.eatAt; else delete m.eatAt; } } catch (e) { } v4Pending = null; }
  return _commitV4.apply(this, arguments);
};
