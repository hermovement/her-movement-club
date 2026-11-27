/* Her Movement Club – Erweiterungen v8 (Nov 2026)
   1) Vorbereiteter Ernährungsplan (nutritionNext): wird ab Datum „from“ automatisch der aktuelle Plan,
      der bisherige landet als Ordner (z. B. „Plan November“) unter „Frühere Ernährungspläne“.
   2) Ziele je Zyklusphase (nutrition.phaseTargets): exakte kcal/Eiweiß/KH/Fett pro Phase statt nur kcal-Zuschlag. */

function v8Swap(m) {
  const nx = m && m.nutritionNext; if (!nx || !nx.from || today() < nx.from) return false;
  const cur = m.nutrition || {}; m.nutriArchive = Array.isArray(m.nutriArchive) ? m.nutriArchive : [];
  const has = n => (n?.meals || []).some(ml => (ml.options || []).some(o => o.name));
  const title = nx.archiveTitle || "Früherer Plan";
  if (has(cur) && !m.nutriArchive.some(a => a.title === title)) m.nutriArchive.push(Object.assign(JSON.parse(JSON.stringify(cur)), { title, archivedAt: nx.from }));
  const { from, archiveTitle, ...rest } = nx; m.nutrition = rest; delete m.nutritionNext; return true;
}
function v8SwapAll() {
  try { v8Swap(S.inbox); } catch (e) { }
  try { if (S.c?.masters) Object.values(S.c.masters).forEach(v8Swap); } catch (e) { }
}
const _doRenderV8 = doRender;
doRender = function () { v8SwapAll(); return _doRenderV8(); };

// Ziele je Zyklusphase
const _targetsForV8 = targetsFor;
targetsFor = function (ib, prof, withCycle, date) {
  const t = _targetsForV8(ib, prof, withCycle, date); const pt = ib?.nutrition?.phaseTargets;
  if (!withCycle || !pt || t.program) return t;
  let ph = null;
  try { if (S.cycle && cyc().settings.contra !== "hormonal") ph = (date ? phaseOn(date) : phaseOn(today()))?.phase || null; } catch (e) { }
  const x = ph && pt[ph]; if (!x) return t;
  const base = num(ib.nutrition.kcal) || t.kcal;
  return Object.assign(t, { kcal: num(x.kcal) || t.kcal, protein: num(x.protein) || t.protein, carbs: num(x.carbs) || t.carbs, fat: num(x.fat) || t.fat, phase: ph, cycleAdd: (num(x.kcal) || base) - base });
};

// Coach: Hinweis, dass ein neuer Plan bereitliegt
const _coachNutriPlanV8 = coachNutriPlan;
coachNutriPlan = function (key) {
  const h = _coachNutriPlanV8(key); const m = S.c.masters?.[key]; const nx = m?.nutritionNext; if (!nx) return h;
  const n = (nx.meals || []).reduce((a, ml) => a + (ml.options || []).filter(o => o.name).length, 0);
  return `<section class="card" style="border-color:var(--gold)"><div class="eyebrow">Liegt bereit</div><h3>${esc(nx.title || "Neuer Ernährungsplan")}</h3><p class="small">${n} Gerichte. Wird am ${fmt(nx.from)} automatisch aktiv. Der jetzige Plan wandert dann als „${esc(nx.archiveTitle || "Früherer Plan")}“ in den Ordner „Frühere Ernährungspläne“.</p></section>` + h;
};
