/* Her Movement Club – Erweiterungen v5 (Nov 2026)
   Pause-Button: „Ich brauche eine Pause“ (krank, verletzt, Zyklus-Beschwerden, Kopf & Stress).
   - Punkte, Ernährung, Befinden und Tagesziele laufen ganz normal weiter
   - Beim Öffnen des Trainings erscheint einmal am Tag ein Gesundheitshinweis
   - „Am Stück“-Challenges reißen an Pausentagen nicht ab
   - Coach sieht die Pause in Übersicht, bei der Kundin, in den Tagespunkten und im Monatsbericht
   Der Grund ist nur für Coach und Kundin sichtbar, nie für andere. */

const V5_T = {
  krank: ["🤒", "krank", "Krank"],
  verletzt: ["🩹", "verletzt", "Verletzt"],
  zyklus: ["🌙", "Zyklus-Beschwerden", "Zyklus-Beschwerden"],
  kopf: ["🫶", "Kopf & Stress", "Kopf & Stress"],
};
const V5_WA = COACH.wa || "491638550620";
const v5Now = prof => { const p = prof?.pause; return p && p.from && p.from <= today() ? p : null; };
// War an Tag d Pause? (laufende Pause oder abgeschlossene im Verlauf)
function v5Paused(prof, d) {
  if (!prof) return null; const p = prof.pause; if (p && p.from && p.from <= d && d <= today()) return p;
  return (prof.pauses || []).find(x => x.from <= d && d <= (x.to || x.from)) || null;
}
window.v5Paused = v5Paused;
window.v5Mark = (prof, d) => { const p = v5Paused(prof, d); return p ? ` <span title="Pause: ${esc((V5_T[p.t] || V5_T.krank)[1])}">${(V5_T[p.t] || V5_T.krank)[0]}</span>` : ""; };
const v5Days = p => diffD(p.from, today()) + 1;

// ---------- Kundin: Startseite ----------
const _homeV5 = VIEWS.home;
VIEWS.home = () => {
  let h = _homeV5(); if (!S.profile || S.sess?.role === "coach") return h;
  const p = v5Now(S.profile); const anchor = `<div class="h3sec"><h3>Dein Tag</h3>`;
  if (p) {
    const T = V5_T[p.t] || V5_T.krank, n = v5Days(p);
    const card = `<section class="card" style="border-color:var(--lilac)"><div class="row" style="gap:12px;align-items:flex-start"><span style="font-size:1.8rem;line-height:1" aria-hidden="true">${T[0]}</span><div class="grow"><b>Du bist in der Pause</b><p class="small muted" style="margin:4px 0 0">${esc(T[2])} · seit ${n === 1 ? "heute" : n + " Tagen"}. ${n >= 5 ? "Wie geht es dir inzwischen? Wenn es dir besser geht, tipp unten auf „Ich bin wieder fit“." : "Gute Besserung! Deine Punkte sammelst du ganz normal weiter. Beim Training hörst du bitte auf deinen Körper."}</p></div></div><div class="row" style="margin-top:10px"><button class="btn small" data-act="v5End">Ich bin wieder fit 💪</button></div></section>`;
    h = h.replace(/(Training heute:<\/b>)[^<]*/, "$1 Pause. Nur sanfte Bewegung, wenn es sich gut anfühlt.");
    const hs = h.indexOf(`<section class="h3hero"`), he = hs >= 0 ? h.indexOf(`</section>`, hs) : -1;
    if (he >= 0) return h.slice(0, he + 10) + card + h.slice(he + 10);
    const i = h.indexOf(anchor); return i >= 0 ? h.slice(0, i) + card + h.slice(i) : card + h;
  }
  const row = `<button class="h3row" data-act="v5Open">${h3Row("#8C8496", "face", "Ich brauche eine Pause", "krank, verletzt oder einfach nicht fit? Hier melden", true)}</button>`;
  const i = h.indexOf(anchor); if (i < 0) return h; const s = h.indexOf(`<section class="h3card">`, i); if (s < 0) return h; const e = h.indexOf(`</section>`, s); if (e < 0) return h;
  return h.slice(0, e) + row + h.slice(e);
};
function v5Sheet() {
  const wa = S.v5wa !== false;
  return `<div class="row between"><h2>Gönn dir eine Pause</h2><button class="iconbtn" data-act="closeLayer" aria-label="Schließen">✕</button></div>
  <p class="small">Krank, verletzt oder einfach nicht fit? Sag kurz, was los ist. Deine Punkte für Essen, Befinden und Tagesziele sammelst du ganz normal weiter. Beim Training erinnert dich die App daran, auf deinen Körper zu hören.</p>
  <div class="stack" style="gap:8px">${Object.entries(V5_T).map(([k, T]) => `<button class="btn quiet" style="justify-content:flex-start" data-act="v5Set" data-t="${k}"><span aria-hidden="true">${T[0]}</span>&nbsp; ${esc(T[2])}</button>`).join("")}</div>
  <label class="row small" style="gap:8px;margin-top:12px;align-items:center"><input type="checkbox" id="v5wa" ${wa ? "checked" : ""}> ${esc(COACH.name)} per WhatsApp Bescheid geben</label>
  <p class="tiny muted">Den Grund sieht nur ${esc(COACH.name)}, niemand sonst im Club.</p>`;
}

// ---------- Training: Gesundheitshinweis einmal am Tag ----------
const V5_TIPS = {
  krank: ["Mach heute nur so viel, wie deiner Genesung guttut. Ein Spaziergang oder sanfte Mobility kann sich angenehm anfühlen.", "Bei Fieber, Gliederschmerzen oder wenn der Infekt in Brust oder Lunge sitzt: heute bitte kein Training.", "Gewichte und Tempo runter, du darfst jederzeit abbrechen."],
  verletzt: ["Die betroffene Stelle schonen und nur Übungen machen, die komplett schmerzfrei sind.", "Andere Körperbereiche darfst du sanft trainieren, wenn es sich gut anfühlt.", "Wird es nicht besser, lass es ärztlich oder physiotherapeutisch abklären."],
  zyklus: ["Sanfte Bewegung wie Spazierengehen, Yoga oder Mobility kann sich an solchen Tagen gut anfühlen.", "Intensität darf heute deutlich runter, ganz nach Gefühl.", "Bei ungewöhnlich starken Schmerzen bitte ärztlich abklären."],
  kopf: ["Bewegung darf heute ein Ventil sein, ganz ohne Leistungsdruck.", "Lieber kurz und angenehm als lang und verbissen.", "Wenn dir alles zu viel ist, ist Ausruhen genauso richtig."],
};
function v5TrainSheet() {
  const p = v5Now(S.profile) || { t: "krank" }; const T = V5_T[p.t] || V5_T.krank;
  return `<div class="row between"><h2>${T[0]} Hör auf deinen Körper</h2><button class="iconbtn" data-act="closeLayer" aria-label="Schließen">✕</button></div>
  <p class="small">Du bist gerade in der Pause (${esc(T[1])}). Training ist heute kein Muss.</p>
  <ul class="small" style="padding-left:18px;margin:6px 0 10px;display:flex;flex-direction:column;gap:6px">${(V5_TIPS[p.t] || V5_TIPS.krank).map(x => `<li>${esc(x)}</li>`).join("")}</ul>
  <p class="tiny muted">Im Zweifel lieber einen Tag mehr Pause. Das ist kein Rückschritt, sondern Teil des Fortschritts.</p>
  <div class="stack" style="gap:8px"><button class="btn" data-act="v5Soft">Ich bewege mich sanft</button><button class="btn quiet" data-act="v5Rest">Heute ruhe ich mich aus</button></div>`;
}
const v5SeenKey = () => "hmV5Train_" + (S.uid || "") + "_" + today();
function v5MaybeTrainHint() {
  if (S.route !== "training" || S.sess?.role === "coach" || !v5Now(S.profile)) return;
  try { if (localStorage.getItem(v5SeenKey())) return; } catch (e) { if (window.__v5seen === today()) return; }
  if (document.getElementById("layer")?.innerHTML) return;
  try { localStorage.setItem(v5SeenKey(), "1"); } catch (e) { window.__v5seen = today(); }
  setTimeout(() => { try { sheet(v5TrainSheet); } catch (e) { } }, 150);
}
const _doRenderV5 = doRender;
doRender = function () { _doRenderV5(); try { v5MaybeTrainHint(); } catch (e) { } };

// ---------- Aktionen ----------
window.addEventListener("click", e => {
  const b = e.target.closest?.("[data-act]"); if (!b) return; const a = b.dataset.act;
  if (a === "v5Open") { e.stopImmediatePropagation(); sheet(v5Sheet); }
  else if (a === "v5Set") {
    e.stopImmediatePropagation(); if (!S.profile) return; const t = b.dataset.t; const T = V5_T[t] || V5_T.krank;
    const wa = document.getElementById("v5wa")?.checked !== false; S.v5wa = wa;
    S.profile.pause = { t, from: today() }; saveProfile(); try { queueScore(); } catch (x) { }
    if (wa) { const msg = `Hallo ${COACH.name}, kurze Info: Ich bin gerade ${T[1]} ${T[0]} und mache etwas langsamer. Ich melde mich, sobald es mir besser geht.`; try { window.open("https://wa.me/" + V5_WA + "?text=" + encodeURIComponent(msg), "_blank", "noopener"); } catch (x) { } }
    closeLayer(); toast("Gute Besserung 💛 Deine Pause ist eingetragen"); render();
  }
  else if (a === "v5End") {
    e.stopImmediatePropagation(); const p = S.profile?.pause; if (!p) return;
    const to = p.from >= today() ? today() : addD(today(), -1);
    (S.profile.pauses ||= []).push({ t: p.t, from: p.from, to }); S.profile.pause = null; saveProfile();
    toast("Schön, dass du wieder fit bist 💪"); render();
  }
  else if (a === "v5Soft") { e.stopImmediatePropagation(); closeLayer(); toast("Sanft und mit Gefühl. Du darfst jederzeit abbrechen 💛"); }
  else if (a === "v5Rest") { e.stopImmediatePropagation(); closeLayer(); toast("Erholung ist auch Training 💛"); go("home"); }
}, true);

// ---------- Coach ----------
const v5ProfOf = key => { const uid = uidFor(key); return uid ? S.c.members[uid] : null; };
const _coachDashV5 = coachDash;
coachDash = function () {
  let h = _coachDashV5();
  (S.config?.clients || []).forEach(c => {
    const p = v5Now(v5ProfOf(c.key)); if (!p) return; const T = V5_T[p.t] || V5_T.krank; const n = v5Days(p);
    const tag = `${T[0]} Pause (${T[1]}) ${n === 1 ? "seit heute" : "seit " + n + " Tagen"}`;
    h = h.replace(new RegExp(`(data-act="openClient" data-k="${c.key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>[\\s\\S]*?<b>[^<]*</b><span>)`), `$1<b style="color:var(--lilac)">${esc(tag)}</b> · `);
  });
  return h;
};
const _coachClientV5 = coachClient;
coachClient = function () {
  let h = _coachClientV5(); const p = v5Now(v5ProfOf(S.c.sel)); if (!p) return h;
  const T = V5_T[p.t] || V5_T.krank, n = v5Days(p);
  const banner = `<div class="banner" style="border-color:var(--lilac)"><span aria-hidden="true">${T[0]}</span><div class="grow small"><b>${esc(clientName(S.c.sel))} ist in der Pause</b> · ${esc(T[2])}, seit ${fmt(p.from)}${n > 1 ? " (" + n + " Tage)" : ""}. Punkte sammelt sie normal weiter, beim Training bekommt sie einen Gesundheitshinweis.</div></div>`;
  const i = h.indexOf(`<section`); return i >= 0 ? h.slice(0, i) + banner + h.slice(i) : banner + h;
};
// Monatsbericht: Pausentage als Gesprächsansatz
const _r3IdeasV5 = r3Ideas;
r3Ideas = function (R, nm) {
  const L = _r3IdeasV5(R, nm); try {
    const prof = R.uid ? S.c.members[R.uid] : null; if (!prof) return L;
    const m = R.m || (S.c.r3m || today().slice(0, 7)); const cnt = {}; let tot = 0;
    for (let d = m + "-01"; d.startsWith(m) && d <= today(); d = addD(d, 1)) { const p = v5Paused(prof, d); if (p) { cnt[p.t] = (cnt[p.t] || 0) + 1; tot++; } }
    if (tot) L.unshift(["🫶", `${tot} Pausentag${tot > 1 ? "e" : ""} diesen Monat (${Object.entries(cnt).map(([t, n]) => (V5_T[t] || V5_T.krank)[1] + " " + n).join(", ")}). Weniger Training ist hier normal. Wie geht es ihr jetzt?`]);
  } catch (e) { }
  return L;
};
