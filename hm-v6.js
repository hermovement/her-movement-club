/* Her Movement Club – Erweiterungen v6 (Nov 2026)
   Zyklus Plus im Club: Ring & Wochenleiste, „Wie geht es dir?“-Erfassung mit Kategorien und Suche,
   Tipps des Tages, Tagesimpuls, Hormonkurve, Muster, Vorhersage-Genauigkeit, Spruch.
   Bausteine aus zp-core.js. Neue Einträge bleiben privat; geteilt wird höchstens eine Muster-Zusammenfassung. */

const V6_DIS_IC = { dry: "🏜️", sticky: "🫧", creamy: "🥛", watery: "💧", egg: "🥚", odd: "⚠️" };
const zpClub = {
  today: () => today(),
  sel: () => S.calSel || today(),
  edDate: () => S.zpDate || today(),
  phaseOn: d => phaseOn(d),
  inPeriod: d => inPeriod(d) || num(cyc().days[d]?.flow) >= 2,
  hormonal: () => cyc().settings.contra === "hormonal",
  day: d => cyc().days[d],
  days: () => cyc().days,
  hasEntry: d => { const e = cyc().days[d]; return !!e && Object.keys(e).some(k => !["amp", "moodQ", "sleepQ", "stress"].includes(k)); },
  starts: () => (stats()?.P || []).map(p => p.start).sort(),
  defaultLen: () => stats()?.len || 28,
  actStart: "perStart", actEnd: "perEnd",
  get flowLabels() { return FLOW.map(x => x.replace(/­/g, "")); },
  get discharge() { return DISCHARGE.map(x => ({ k: x.k, n: x.n, i: V6_DIS_IC[x.k] })); },
  weightAct: "zpWeight",
};
const v6On = () => typeof smCOk === "function" && smCOk() && !(typeof myWay === "function" && myWay() === "wechsel") && S.cycle && stats();

// ---------- Zyklus-Seite ----------
const _cycleV6 = VIEWS.cycle;
VIEWS.cycle = () => {
  const h = _cycleV6(); if (!v6On()) return h;
  try {
    const A = zpClub; const box = document.createElement("div"); box.innerHTML = h;
    const dial = box.querySelector(".phase svg.dial")?.closest(".phase");
    const top = document.createElement("div"); top.className = "stack"; top.style.gap = "14px";
    top.innerHTML = ZP.head(A) + ZP.checkCard(A) + ZP.impulseCard(A) + ZP.tipsCard(A) + ZP.triCard(A);
    if (dial) dial.replaceWith(top); else { const ph = box.querySelector(".pageh"); ph ? ph.after(top) : box.prepend(top); }
    const cal = box.querySelector(".cal")?.closest("section");
    const entry = cal?.nextElementSibling && /Eintrag/.test(cal.nextElementSibling.querySelector(".eyebrow")?.textContent || "") ? cal.nextElementSibling : null;
    if (entry) { const b = document.createElement("div"); b.innerHTML = `<button class="btn small" data-act="zpEdit" data-d="${A.sel() > today() ? today() : A.sel()}" style="align-self:flex-start">✳️ Ausführlich erfassen: Wohlbefinden, Haut, Bewegung, Selfcare …</button>`; entry.insertBefore(b.firstChild, entry.children[1] || null); }
    const after = document.createElement("div"); after.className = "stack"; after.style.gap = "14px";
    after.innerHTML = ZP.hormoneCard(A) + ZP.patternCard(A) + ZP.accuracyCard(A) + ZP.quoteCard(A);
    const anchor = entry || cal; if (anchor) anchor.after(after); else box.appendChild(after);
    return box.innerHTML;
  } catch (e) { try { console.warn("Zyklus Plus", e); } catch (x) { } return h; }
};

// ---------- Aktionen ----------
function v6Set(d, g, v, single) {
  const c = cyc(); const e = c.days[d] ||= {};
  if (!single) { const arr = e[g] ||= []; const i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); return arr.includes(v); }
  if (g === "flow") { const n = num(v); e.flow = num(e.flow) === n && e.flow != null ? 0 : n; syncFlow(d, e.flow); return e.flow === n; }
  if (g === "energy" || g === "pain") { const n = num(v); if (e[g] != null && num(e[g]) === n) { delete e[g]; return false; } e[g] = n; return true; }
  if (e[g] === v) { e[g] = null; return false; } e[g] = v; return true;
}
window.addEventListener("click", ev => {
  const b = ev.target.closest?.("[data-act]"); if (!b) return; const a = b.dataset.act; if (!/^zp/.test(a)) return;
  ev.stopImmediatePropagation(); const A = zpClub;
  if (a === "zpSel") { S.calSel = b.dataset.d; const m = b.dataset.d.slice(0, 7); if (m !== (S.calMonth || monthKey())) S.calMonth = m; render(); }
  else if (a === "zpEdit") { const d = b.dataset.d > today() ? today() : b.dataset.d; S.zpDate = d; sheet(() => ZP.editor(A)); }
  else if (a === "zpClose") { closeLayer(); render(); }
  else if (a === "zpT") {
    const d = S.zpDate || today(); const g = b.dataset.g, v = b.dataset.v, single = !!b.dataset.single; const on = v6Set(d, g, v, single); saveCycle();
    const root = b.closest(".zp-ed") || document;
    if (single) root.querySelectorAll(`.zp-it[data-g="${g}"]`).forEach(x => x.classList.remove("on"));
    root.querySelectorAll(`.zp-it[data-g="${g}"]`).forEach(x => { if (x.dataset.v === v) x.classList.toggle("on", on); });
    try { navigator.vibrate?.(8); } catch (x) { }
  }
  else if (a === "zpJump") { const s = document.getElementById("zps-" + b.dataset.s); if (s) s.scrollIntoView({ behavior: "smooth", block: "start" }); }
  else if (a === "zpTip") { const id = b.dataset.id; sheet(() => ZP.tipSheet(id)); }
  else if (a === "zpAllTips") { const ph = A.phaseOn(today())?.phase || "foll"; const c = b.dataset.c || ""; sheet(() => ZP.allTips(ph, c)); }
  else if (a === "zpWeight") { closeLayer(); go("measures"); }
}, true);
document.addEventListener("input", ev => {
  const t = ev.target; if (!t || (t.id !== "zpNote" && t.id !== "zpBbt")) return; const d = S.zpDate || today(); const e = cyc().days[d] ||= {};
  if (t.id === "zpNote") e.note = t.value; else { const v = parseFloat(String(t.value).replace(",", ".")); if (v >= 34 && v <= 39) e.bbt = Math.round(v * 100) / 100; else delete e.bbt; }
  saveCycle();
}, true);

// ---------- Coach: nur Zusammenfassung der Muster ----------
const _sharedCycleV6 = sharedCycle;
sharedCycle = function () { const o = _sharedCycleV6(); try { const { list } = ZP.patterns(zpClub); o.pattern = list.slice(0, 4).map(p => ZP.patternText(p)); } catch (e) { } return o; };
const _coachClientV6 = coachClient;
coachClient = function () {
  let h = _coachClientV6(); if (S.c.tab !== "zyklus") return h; const uid = uidFor(S.c.sel); const sh = uid ? S.c.shared[uid] : null; if (!sh) return h;
  const card = `<section class="card"><h3>Wiederkehrende Muster</h3>${(sh.pattern || []).length ? `<div class="stack" style="gap:6px">${sh.pattern.map(t => `<p class="small" style="margin:0">• ${esc(t)}</p>`).join("")}</div>` : `<p class="small muted">Noch keine wiederkehrenden Muster erkannt.</p>`}<p class="tiny muted">Zusammenfassung aus ihren eigenen Einträgen. Details wie Ausfluss, Haut, Selfcare und Tagebuch bleiben privat.</p></section>`;
  const i = h.indexOf(`<section class="card"><h3>Letzte 14 Tage</h3>`); return i >= 0 ? h.slice(0, i) + card + h.slice(i) : h + card;
};
