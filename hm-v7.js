/* Her Movement Club – Erweiterungen v7 (Nov 2026)
   Mahlzeiten-Optionen passen sich an die Tagesmakros an.
   Sobald heute etwas eingetragen ist: Restbudget (Tagesziel je Phase minus Gegessenes) auf die offenen Mahlzeiten verteilen,
   Portionen jeder Option umrechnen (Beilagen & Fette ×0,7–1,3, Eiweißquelle bleibt), kennzeichnen und sortieren.
   Bestehendes („passt jetzt“ = passt zur Zyklusphase) bleibt erhalten. */

const V7_FLOOR = 1600;           // Tag nie darunter planen
const V7_SMALL = 300;            // darunter keine Mini-Portionen
const V7_SNACK = 0.15;           // Anteil Snack am Restbudget
const V7_KMIN = 0.7, V7_KMAX = 1.3;
const V7_PRO = /hähnchen|pute|puten|rind|hack|steak|schinken|salami|aufschnitt|garnelen|lachs|fisch|thunfisch|magerquark|\bquark|skyr|hüttenkäse|körniger frischkäse|eiklar|\bei\b|eier|tofu|whey|proteinpulver|proteinpudding|tempeh|seitan/i;
const V7_CARB = /reis|basmati|nudeln|pasta|spaghetti|brot|brötchen|toast|flocken|hafer|granola|müsli|kartoffel|gnocchi|wrap|pita|tortilla|quinoa|couscous|bulgur|waffel|polenta|linsen\b/i;
const V7_FAT = /öl\b|olivenöl|rapsöl|butter|mus\b|nussmus|mandelmus|erdnussmus|mandeln|nüsse|walnüsse|cashew|avocado|pesto|feta|gouda|parmesan|mozzarella|käse|chiasamen|leinsamen|kerne|zartbitter|schokolade/i;
const v7Cls = t => V7_PRO.test(t) ? "pro" : V7_CARB.test(t) ? "carb" : V7_FAT.test(t) ? "fat" : "fix";
const v7R = g => g >= 15 ? Math.max(5, Math.round(g / 5) * 5) : Math.max(1, Math.round(g));
const v7Name = t => t.replace(/^(\d+[.,]?\d*)\s*(g|ml|gr)\s*/i, "").replace(/\s*\(.*?\)\s*/g, " ").trim();

// ---------- Budget ----------
function v7Budget() {
  const ib = inbox(); const meals = (ib.nutrition?.meals || []).map((m, mi) => Object.assign({}, m, { mi })).filter(m => (m.options || []).some(o => o.name));
  if (!meals.length) return null; const D = day(today()); const eaten = D.meals || []; if (!eaten.length) return null;
  const T = targets(); if (!num(T.kcal)) return null;
  const tot = totals(D); const goalK = Math.max(num(T.kcal), V7_FLOOR);
  const R = { kcal: Math.max(0, goalK - tot.kcal), p: Math.max(0, num(T.protein) - tot.p), c: Math.max(0, num(T.carbs) - tot.c), f: Math.max(0, num(T.fat) - tot.f) };
  const ate = new Set(eaten.map(m => catOf(m.slot)).filter(i => i >= 0));
  const lastMain = Math.max(-1, ...[0, 1, 3].filter(i => ate.has(i)).map(i => [0, 1, 3].indexOf(i)));
  // Luteal-Extra: in der Lutealphase vorab reservieren, falls noch nicht gegessen
  const g = typeof cycGroup === "function" ? cycGroup(today()) : null; const P = typeof prog === "function" ? prog() : null;
  const lutMeal = meals.find(m => /luteal/i.test(m.slot)); let lut = 0;
  if (g === "lut" && lutMeal) { const names = new Set((lutMeal.options || []).map(o => o.name)); const done = eaten.some(m => names.has(m.name) || /luteal/i.test(m.slot || "")); if (!done) lut = num(P?.lutExtra) || num(lutMeal.kcal) || 100; }
  const R2 = Object.assign({}, R, { kcal: Math.max(0, R.kcal - lut) });
  const open = meals.filter(m => { const c = catOf(m.slot); if (c < 0 || ate.has(c)) return false; if (c === 2) return true; return [0, 1, 3].indexOf(c) > lastMain; });
  const mains = open.filter(m => catOf(m.slot) !== 2), snack = open.find(m => catOf(m.slot) === 2);
  const share = {}; if (!open.length) return { R, tot, T, lut, open, share, done: true };
  const sw = snack ? (mains.length ? V7_SNACK : 1) : 0; const mw = mains.length ? (1 - sw) / mains.length : 0;
  open.forEach(m => { const w = catOf(m.slot) === 2 ? sw : mw; share[m.mi] = { kcal: R2.kcal * w, p: R2.p * w, c: R2.c * w, f: R2.f * w }; });
  return { R, tot, T, lut, open, share, done: false };
}

// ---------- Option umrechnen ----------
function v7Scale(o, B, small) {
  const base = optionMacros(o); if (!num(base.kcal) || !B) return null;
  const lines = o.ingredients || []; const its = lines.map(l => ({ l, x: parseIng(l) })).map(({ l, x }) => ({ l, x, num: /^\s*\d+[.,]?\d*\s*(g|ml|gr)\b/i.test(l) && x && x.F && x.grams != null, cls: v7Cls(l) }));
  const adj = its.filter(i => i.num && (i.cls === "carb" || i.cls === "fat"));
  const adjK = adj.reduce((a, i) => a + i.x.F[1] * i.x.grams / 100, 0);
  const diff = (base.kcal - B.kcal) / Math.max(1, B.kcal);
  const res = { base, m: base, k: 1, status: "perfect", changes: [], ingredients: lines };
  if (Math.abs(diff) <= 0.10) return res;
  if (small || adjK < 15) { res.status = base.kcal > B.kcal * 1.10 ? "big" : "adj0"; return res; }
  let k = 1 + (B.kcal - base.kcal) / adjK; k = Math.min(V7_KMAX, Math.max(V7_KMIN, k));
  const d = { kcal: 0, p: 0, c: 0, f: 0 }; const newLines = lines.slice();
  adj.forEach(i => {
    const g0 = i.x.grams, g1 = v7R(g0 * k); if (g1 === g0) return; const F = i.x.F, dg = (g1 - g0) / 100;
    d.kcal += F[1] * dg; d.p += F[2] * dg; d.c += F[3] * dg; d.f += F[4] * dg;
    const idx = lines.indexOf(i.l); newLines[idx] = i.l.replace(/^(\s*)(\d+[.,]?\d*)(\s*)(g|ml|gr)\b/i, `$1${g1}$3$4`);
    res.changes.push({ name: v7Name(i.l), from: Math.round(g0), to: g1, unit: /ml/i.test(i.l.match(/^\s*\d+[.,]?\d*\s*(g|ml|gr)/i)?.[1] || "") ? "ml" : "g" });
  });
  res.k = k; res.ingredients = newLines;
  res.m = { kcal: Math.round(base.kcal + d.kcal), p: Math.round((base.p + d.p) * 10) / 10, c: Math.round((base.c + d.c) * 10) / 10, f: Math.round((base.f + d.f) * 10) / 10, src: base.src };
  res.status = res.m.kcal > B.kcal * 1.10 ? "big" : res.changes.length ? "adj" : (Math.abs(diff) <= 0.15 ? "perfect" : "adj0");
  return res;
}
const v7Adj = (o, r) => r && r.changes.length ? Object.assign({}, o, { ingredients: r.ingredients, kcal: r.m.kcal, p: r.m.p, c: r.m.c, f: r.m.f, v7: r }) : o;
const V7_PILL = { perfect: `<span class="pill good" style="font-size:.58rem">passt perfekt</span>`, adj: `<span class="pill gold" style="font-size:.58rem">passt mit Anpassung</span>`, adj0: `<span class="pill" style="font-size:.58rem">passt ungefähr</span>`, big: `<span class="pill warn" style="font-size:.58rem">heute zu groß</span>` };
const V7_ORDER = { perfect: 0, adj: 1, adj0: 2, big: 3 };

// ---------- Ernährungsplan ----------
const _planMealsV7 = planMealsSection;
planMealsSection = function () {
  let b; try { b = v7Budget(); } catch (e) { b = null; } if (!b) return _planMealsV7();
  try {
    S.v7 = {}; const meals = (inbox().nutrition?.meals || []).map((m, mi) => Object.assign({}, m, { mi, opts: (m.options || []).map((o, oi) => ({ o, oi })).filter(x => x.o.name) })).filter(m => m.opts.length);
    const ph = myPhase(); const cur = guessSlot(); const g = cycGroup(today());
    const ateCat = new Set((day(today()).meals || []).map(m => catOf(m.slot)));
    const protPrio = b.R.p >= 30 || (b.R.kcal > 0 && b.R.p * 4 / b.R.kcal > 0.3);
    const head = b.done
      ? `<section class="card"><b>Alle Mahlzeiten für heute eingetragen 🎉</b><p class="small muted" style="margin:4px 0 0">${Math.round(b.tot.kcal)} von ${Math.round(num(b.T.kcal))} kcal · ${Math.round(b.tot.p)} von ${Math.round(num(b.T.protein))} g Eiweiß.</p></section>`
      : `<section class="card" style="border-color:var(--gold)"><div class="eyebrow">Für heute angepasst</div><p style="margin:0">Damit du entspannt auf dein Ziel kommst, sind die Portionen unten passend zu dem umgerechnet, was du heute schon gegessen hast.</p>
         <div class="row" style="gap:6px"><span class="pill gold num">noch ${Math.round(b.R.kcal)} kcal</span><span class="pill num">${Math.round(b.R.p)} g Eiweiß offen</span><span class="pill num">K ${Math.round(b.R.c)} · F ${Math.round(b.R.f)}</span></div>
         <p class="tiny muted" style="margin:0">Offen: ${b.open.map(m => esc(m.slot)).join(", ")}${b.lut ? ` · Luteal-Extra (~${b.lut} kcal) ist schon mit eingeplant` : ""}. Eiweißquellen bleiben, angepasst werden Beilagen und Fette.</p></section>`;
    return (prog() ? "" : cycleFoodCard()) + `<section class="stack"><div class="sec-h"><div><div class="eyebrow">Dein Ernährungsplan</div><h2>Such dir eine Option aus</h2></div><button class="linkbtn" data-act="foldAll" data-g="meal">alle zu</button></div>${head}
     ${meals.map(m => {
      const key = "meal:" + m.slot; const luteal = /luteal/i.test(m.slot); const B = b.share[m.mi]; const c = catOf(m.slot);
      const eaten = c >= 0 && ateCat.has(c); const def = B ? b.open[0]?.mi === m.mi : (!eaten && (m.slot === cur || (luteal && g === "lut")));
      const fit = ph ? m.opts.filter(x => (x.o.phases || []).includes(ph)).length : 0;
      const small = B && (c !== 2 ? B.kcal < V7_SMALL : B.kcal < 120);
      let rows = m.opts.map(({ o, oi }) => { const r = B ? v7Scale(o, B, small) : null; if (r) S.v7[m.mi + ":" + oi] = r; return { o, oi, r }; });
      if (B) rows.sort((x, y) => (V7_ORDER[x.r?.status] ?? 2) - (V7_ORDER[y.r?.status] ?? 2) || (protPrio ? (y.r?.m.p || 0) - (x.r?.m.p || 0) : Math.abs((x.r?.m.kcal || 0) - B.kcal) - Math.abs((y.r?.m.kcal || 0) - B.kcal)));
      const sumLine = B ? ` · <span class="gold">heute ~${Math.round(B.kcal)} kcal · ~${Math.round(B.p)} g Eiweiß</span>` : eaten ? ` · <span class="good">heute schon gegessen ✓</span>` : "";
      return `<details class="card fold" data-fold="${esc(key)}" ${(S.open[key] ?? def) ? "open" : ""}><summary><div class="sum"><h3>${esc(m.slot)}</h3><span class="tiny muted num">${m.opts.length} Optionen${num(m.kcal) ? " · ~" + m.kcal + " kcal" : ""}${num(m.protein) ? " · ~" + m.protein + " g Eiweiß" : ""}${fit ? ` · <span class="lil">${fit} passen jetzt</span>` : ""}${luteal && g && g !== "lut" ? " · erst ab der Lutealphase" : ""}${sumLine}</span></div>${CHEV}</summary>
       <div style="margin-top:8px">${m.note ? `<p class="tiny muted" style="margin-bottom:6px">${esc(m.note)}</p>` : ""}
       ${small ? `<div class="banner" style="margin-bottom:8px"><span aria-hidden="true">💛</span><div class="small">Für ${esc(m.slot)} bleiben heute nur noch ca. ${Math.round(B.kcal)} kcal. ${c === 2 ? "Wenn du noch Hunger hast: etwas Kleines mit viel Eiweiß, z. B. Skyr pur." : "Heute lieber etwas Kleines mit viel Eiweiß, z. B. Skyr oder Rührei."}</div></div>` : ""}
       <div class="list">${rows.map(({ o, oi, r }) => { const mm = r ? r.m : optionMacros(o); const hit = ph && (o.phases || []).includes(ph);
         const pr = r && protPrio && r.status !== "big" && mm.p >= B.p * 0.8 ? `<div class="tiny" style="color:var(--gold)">+${Math.round(mm.p)} g Eiweiß${mm.p >= B.p * 0.95 ? ", damit erreichst du dein Ziel" : ""}</div>` : "";
         const ch = r && r.changes.length ? `<div class="tiny muted">angepasst: ${r.changes.slice(0, 2).map(x => `${x.to} ${x.unit} statt ${x.from} ${x.unit} ${esc(x.name)}`).join(", ")}${r.changes.length > 2 ? " …" : ""}</div>` : "";
         return `<div class="li"${r?.status === "big" ? ' style="opacity:.7"' : ""}><span class="thumb" style="display:grid;place-items:center;font-family:var(--f-display);font-size:1.2rem;color:var(--lilac)">${esc(o.label || "•")}</span><div class="grow"><div class="t">${esc(o.name)}${hit ? ` <span class="pill lil" style="font-size:.58rem">passt jetzt</span>` : ""}${r ? " " + V7_PILL[r.status] : ""}</div><div class="s num">${mm.kcal ? mm.kcal + " kcal · E " + Math.round(mm.p) + " · K " + Math.round(mm.c) + " · F " + Math.round(mm.f) : "Makros folgen"}</div>${pr}${ch}</div><button class="btn small quiet" data-act="openOpt" data-mi="${m.mi}" data-oi="${oi}">Ansehen</button></div>`; }).join("")}</div></div></details>`; }).join("")}</section>`;
  } catch (e) { try { console.warn("v7", e); } catch (x) { } S.v7 = {}; return _planMealsV7(); }
};

// ---------- Ansehen & Eintragen mit angepasster Portion ----------
window.addEventListener("click", ev => {
  const el = ev.target.closest?.('[data-act="openOpt"],[data-act="eatOpt"]'); if (!el) return; const r = S.v7?.[el.dataset.mi + ":" + el.dataset.oi]; if (!r || !r.changes.length) return;
  ev.stopImmediatePropagation(); const ml = inbox().nutrition.meals[+el.dataset.mi]; const o = ml.options[+el.dataset.oi]; const oa = v7Adj(o, r);
  if (el.dataset.act === "openOpt") {
    const note = `<div class="banner" style="border-color:var(--gold)"><span aria-hidden="true">✨</span><div class="small"><b>Für heute angepasst</b>, damit du entspannt auf dein Ziel kommst.<br>${r.changes.map(x => `${x.to} ${x.unit} statt ${x.from} ${x.unit} ${esc(x.name)}`).join(" · ")}<br><span class="muted">Original: ${r.base.kcal} kcal · E ${Math.round(r.base.p)} g</span></div></div>`;
    S.optSlot = ml.slot; sheet(() => optionCard(oa, ["eatOpt", `data-mi="${el.dataset.mi}" data-oi="${el.dataset.oi}"`], note));
  } else { const sl = CATS[catOf(ml.slot)] || (/training/i.test(ml.slot) ? "Vor dem Training" : "Zwischendurch"); S.mealCtx = null; S.meal = optionToMeal(oa, sl); sheet(mealSheet); }
}, true);
