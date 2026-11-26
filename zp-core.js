/* Zyklus Plus – gemeinsame Bausteine für Her Movement Club und HER Cycle (Nov 2026)
   Eigene Texte, eigene Symbole. Alles frei sichtbar, kein Premium.
   Die App liefert einen Adapter A (siehe zpClub in hm-v6.js), ZP baut daraus die Karten. */
(function () {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = n => String(n).padStart(2, "0");
  const parseD = s => new Date(s + "T12:00:00");
  const iso = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const addD = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return iso(d); };
  const diffD = (a, b) => Math.round((parseD(b) - parseD(a)) / 864e5);
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const WD = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const fmtS = s => { const d = parseD(s); return pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "."; };

  // ---------- Phasen ----------
  const PH = {
    mens: { n: "Periode", long: "Menstruation", c: "#C9779B", grp: "mens" },
    foll: { n: "Follikelphase", long: "Follikelphase", c: "#A88AD8", grp: "foll" },
    ovu: { n: "Eisprung", long: "Eisprung", c: "#E6C35C", grp: "ovu" },
    lut1: { n: "Lutealphase", long: "Lutealphase", c: "#8FA8C9", grp: "lut" },
    lut2: { n: "PMS-Zeit", long: "Späte Lutealphase", c: "#7F6E9E", grp: "lut" },
  };
  const phaseOfCd = (cd, len, plen) => { const ov = len - 14; if (cd <= plen) return "mens"; if (cd < ov - 1) return "foll"; if (cd <= ov + 1) return "ovu"; if (cd <= len - 5) return "lut1"; return "lut2"; };

  // ---------- Erfassen: Kategorien ----------
  const WB = [["Krämpfe", "🌀"], ["Unterleibsschmerzen", "⚡"], ["Kopfschmerzen", "🤕"], ["Migräne", "🌩️"], ["Blähbauch", "🎈"], ["Brustspannen", "💗"], ["Rückenschmerzen", "🦴"], ["Heißhunger", "🍫"], ["Unreine Haut", "🔴"], ["Schlafprobleme", "🌙"], ["Übelkeit", "🤢"], ["Wassereinlagerungen", "💧"], ["Verstopfung", "🔒"], ["Durchfall", "🌪️"], ["Müdigkeit", "😴"], ["Schwindel", "💫"], ["Gelenkschmerzen", "🦵"], ["Muskelkater", "💪"], ["Ziehen beim Eisprung", "〰️"], ["Brain Fog", "🌫️"], ["Hitzewallungen", "🔥"], ["Nachtschweiß", "🌡️"], ["Erkältet", "🤧"]];
  const MOOD = [["Glücklich", "😊"], ["Ausgeglichen", "😌"], ["Energiegeladen", "⚡"], ["Motiviert", "🔥"], ["Selbstbewusst", "💪"], ["Gesellig", "🥳"], ["Kreativ", "🎨"], ["Konzentriert", "🎯"], ["Dankbar", "🙏"], ["Sensibel", "🥺"], ["Gereizt", "😤"], ["Traurig", "😢"], ["Ängstlich", "😟"], ["Gestresst", "😣"], ["Unruhig", "😬"], ["Überfordert", "😵"], ["Stimmungsschwankungen", "🎢"], ["Müde", "🥱"], ["Antriebslos", "😶"]];
  const SKIN = [["Strahlende Haut", "✨"], ["Trockene Haut", "🏜️"], ["Fettige Haut", "💦"], ["Rötungen", "🌹"], ["Guter Haartag", "💁‍♀️"], ["Schlechter Haartag", "🙈"], ["Fettige Haare", "🧴"], ["Haarausfall", "🪮"], ["Brüchige Nägel", "💅"]];
  const MOVE = [["Krafttraining", "🏋️‍♀️"], ["HIIT", "⚡"], ["Zirkeltraining", "🔁"], ["Laufen", "🏃‍♀️"], ["Spaziergang", "🚶‍♀️"], ["Wandern", "🥾"], ["Radfahren", "🚴‍♀️"], ["Schwimmen", "🏊‍♀️"], ["Tanzen", "💃"], ["Yoga", "🧘‍♀️"], ["Sanftes Yoga", "🌿"], ["Pilates", "🤸‍♀️"], ["Mobility", "🔄"], ["Dehnen", "🙆‍♀️"], ["Faszienrolle", "🪵"], ["Beckenboden", "🌸"], ["Atemübung", "🌬️"], ["Boxen", "🥊"], ["Klettern", "🧗‍♀️"], ["Spinning", "🚲"], ["Rudern", "🚣‍♀️"], ["Treppensteigen", "🪜"], ["Beine an die Wand", "🦵"], ["Katze-Kuh", "🐈"], ["Hüften öffnen", "🦋"], ["Nacken & Schultern", "💆‍♀️"], ["Ruhetag", "🛋️"]];
  const FOOD = [["Heißhunger süß", "🍬"], ["Heißhunger salzig", "🥨"], ["Wenig Appetit", "🥄"], ["Großer Appetit", "🍽️"], ["Viel getrunken", "💧"], ["Wenig getrunken", "🚱"], ["Kaffee", "☕"], ["Alkohol", "🍷"], ["Viel Gemüse", "🥦"], ["Eiweißreich gegessen", "🥚"], ["Schokolade", "🍫"], ["Fast Food", "🍔"]];
  const CARE = [["Zeit im Grünen", "🌳"], ["Warmes Bad", "🛁"], ["Wärmflasche", "♨️"], ["Nein gesagt", "🙅‍♀️"], ["Meditation", "🧘"], ["Lesen", "📖"], ["Ruhige Musik", "🎧"], ["Früh geschlafen", "😴"], ["Handy-Feierabend", "📵"], ["Freundin getroffen", "👯‍♀️"], ["Gelacht", "😄"], ["Massage", "💆‍♀️"], ["Tagebuch geschrieben", "📓"], ["Zeit nur für mich", "💛"]];
  const LH = [["neg", "Negativ", "➖"], ["pos", "Positiv (LH-Peak)", "➕"], ["unk", "Unklar", "❔"]];
  const ENERGY = [[1, "sehr niedrig", "🪫"], [2, "niedrig", "🔋"], [3, "okay", "🔋"], [4, "gut", "🔋"], [5, "top", "⚡"]];
  const PAIN = [[0, "keine", "🙂"], [1, "leicht", "😕"], [2, "mittel", "😣"], [3, "stark", "😖"]];
  const FLOWI = ["🚫", "🔸", "💧", "💧💧", "💧💧💧"];
  const MULTI = { symptoms: WB, moods: MOOD, skin: SKIN, move: MOVE, food: FOOD, care: CARE };
  const ICON = {}; Object.values(MULTI).forEach(L => L.forEach(([l, i]) => { ICON[l] = ICON[l] || i; }));
  const SUGG = {
    mens: ["Krämpfe", "Unterleibsschmerzen", "Müdigkeit", "Rückenschmerzen", "Wärmflasche", "Sanftes Yoga", "Kopfschmerzen", "Sensibel"],
    foll: ["Energiegeladen", "Motiviert", "Krafttraining", "Strahlende Haut", "Gesellig", "Kreativ", "Guter Haartag", "Konzentriert"],
    ovu: ["Selbstbewusst", "Energiegeladen", "Ziehen beim Eisprung", "Gesellig", "Krafttraining", "Strahlende Haut", "Glücklich", "Großer Appetit"],
    lut1: ["Konzentriert", "Großer Appetit", "Heißhunger süß", "Blähbauch", "Müdigkeit", "Ausgeglichen", "Krafttraining", "Spaziergang"],
    lut2: ["Brustspannen", "Blähbauch", "Heißhunger süß", "Gereizt", "Stimmungsschwankungen", "Unreine Haut", "Schlafprobleme", "Kopfschmerzen"],
  };

  // ---------- Tipps ----------
  // [id, Kategorie, Phasen, Symbol, Titel, Warum, Wie]
  const TIPS = [
    ["m1", "auf", "mens", "🗓️", "Kalender entlasten", "In den ersten Periodentagen fühlen sich viele Frauen müder als sonst.", "Schieb alles, was warten kann, auf nächste Woche. Plane heute nur ein bis zwei wichtige Dinge."],
    ["m2", "auf", "mens", "📓", "Zyklus-Rückblick", "Ein neuer Zyklus ist ein guter Moment, kurz zurückzuschauen.", "Schreib drei Dinge auf: Was lief gut? Was war schwer? Was nimmst du dir für diesen Zyklus vor?"],
    ["m3", "auf", "mens", "🧺", "Vorräte auffüllen", "Wenn die Energie knapp ist, hilft ein Vorrat an einfachen Basics.", "Tee, Wärmflasche, Periodenprodukte und ein paar eiweißreiche Snacks griffbereit haben."],
    ["m4", "ess", "mens", "🥩", "Eisen plus Vitamin C", "Mit der Blutung verlierst du Eisen. Vitamin C erhöht die Eisenaufnahme.", "Kombiniere Fleisch, Linsen oder Haferflocken mit Paprika, Beeren oder einem Spritzer Zitrone."],
    ["m5", "ess", "mens", "🍲", "Warm essen", "Viele Frauen empfinden warme Mahlzeiten an diesen Tagen als besonders angenehm.", "Suppe, Porridge, Ofengemüse oder ein Eintopf vom Vortag."],
    ["m6", "ess", "mens", "☕", "Kaffee bewusst", "Bei manchen verstärkt viel Koffein Unruhe oder schlechten Schlaf.", "Ein bis zwei Tassen am Vormittag, danach lieber Kräutertee."],
    ["m7", "bew", "mens", "🚶‍♀️", "Sanfter Spaziergang", "Leichte Bewegung kann sich bei Krämpfen angenehm anfühlen.", "20 bis 30 Minuten an der frischen Luft, ganz in deinem Tempo."],
    ["m8", "bew", "mens", "🦵", "Beine an die Wand", "Eine ruhige Position zum Durchatmen und Runterkommen.", "Leg dich auf den Rücken, Beine an die Wand, 5 Minuten ruhig atmen."],
    ["m9", "bew", "mens", "🏋️‍♀️", "Training nach Gefühl", "Krafttraining ist auch während der Periode möglich.", "Fühlst du dich gut, trainier normal. Wenn nicht: etwas weniger Gewicht, ein Satz weniger."],
    ["m10", "bew", "mens", "🐈", "Katze-Kuh", "Sanfte Mobilisation für Rücken und Becken.", "Im Vierfüßlerstand 10 langsame Wiederholungen, mit der Atmung im Takt."],
    ["m11", "care", "mens", "♨️", "Wärme", "Wärme empfinden viele bei Krämpfen und Rückenschmerzen als wohltuend.", "Wärmflasche oder Körnerkissen 15 bis 20 Minuten auf Bauch oder unteren Rücken."],
    ["m12", "care", "mens", "🌙", "Früher ins Bett", "Genug Schlaf hilft dir, gut durch diese Tage zu kommen.", "Heute 30 Minuten früher Licht aus, Handy außer Reichweite."],
    ["m13", "care", "mens", "🙅‍♀️", "Nein sagen ist erlaubt", "Deine Energie ist gerade begrenzt.", "Sag heute eine Sache ab, die dir mehr nimmt als gibt."],
    ["m14", "care", "mens", "🛁", "Warmes Bad", "Ein ruhiger Moment nur für dich.", "Bad oder lange warme Dusche, dazu Lieblingsmusik."],
    ["f1", "auf", "foll", "🚀", "Neues starten", "Mit steigendem Östrogen haben viele Frauen mehr Antrieb.", "Fang jetzt das Projekt an, das du schon länger aufschiebst. Der erste kleine Schritt reicht."],
    ["f2", "auf", "foll", "📝", "Wochenplan schreiben", "Planen fällt in dieser Phase oft leichter.", "Trag Trainings, Meal-Prep und Termine für die nächsten 7 Tage ein."],
    ["f3", "auf", "foll", "🥗", "Meal-Prep", "Vorgekochtes spart dir in der Lutealphase Zeit und Nerven.", "Koch zwei bis drei Basics vor: Reis oder Kartoffeln, Hähnchen, Ofengemüse."],
    ["f4", "ess", "foll", "🥚", "Eiweiß zu jeder Mahlzeit", "Eiweiß trägt zum Erhalt und zur Zunahme von Muskelmasse bei.", "Ei, Skyr, Quark, Hähnchen oder Hülsenfrüchte in jede Hauptmahlzeit einbauen."],
    ["f5", "ess", "foll", "🥦", "Bunter Teller", "Viel Gemüse bringt Ballaststoffe und Abwechslung.", "Zwei Handvoll Gemüse pro Hauptmahlzeit, gern in verschiedenen Farben."],
    ["f6", "ess", "foll", "🍠", "Kohlenhydrate ums Training", "Für intensive Einheiten brauchst du Energie.", "Haferflocken, Kartoffeln oder Reis in der Mahlzeit vor oder nach dem Training."],
    ["f7", "bew", "foll", "🏋️‍♀️", "Schwer heben", "Viele Frauen fühlen sich jetzt besonders belastbar.", "Probier bei deinen Hauptübungen 2,5 kg mehr oder eine Wiederholung mehr."],
    ["f8", "bew", "foll", "🎯", "Neue Übung lernen", "Neue Bewegungen lernen sich oft leichter, wenn du frisch bist.", "Nimm eine neue Übung in dein Training auf und üb die Technik mit leichtem Gewicht."],
    ["f9", "bew", "foll", "⚡", "Intervalle", "Kurz und knackig passt gut zu viel Energie.", "10 bis 20 Minuten: 30 Sekunden Gas, 60 Sekunden locker, 8 bis 10 Runden."],
    ["f10", "bew", "foll", "💃", "Tanzen", "Bewegung mit Musik macht einfach gute Laune.", "Drei Lieblingssongs, Wohnzimmer, los."],
    ["f11", "care", "foll", "🌳", "Zeit im Grünen", "Draußen sein tut Kopf und Körper gut.", "Mittagspause oder Feierabend nach draußen verlegen, mindestens 20 Minuten."],
    ["f12", "care", "foll", "👯‍♀️", "Freundin treffen", "Viele sind jetzt besonders gesellig.", "Schreib einer Freundin und mach direkt einen Termin aus."],
    ["f13", "care", "foll", "☀️", "Morgenlicht", "Tageslicht am Morgen hilft deinem Tagesrhythmus.", "10 Minuten draußen innerhalb der ersten Stunde nach dem Aufstehen."],
    ["f14", "care", "foll", "😄", "Etwas Lustiges", "Lachen ist gute Laune zum Selbermachen.", "Lieblings-Comedy, lustiges Video oder Sprachnachricht von der besten Freundin."],
    ["o1", "auf", "ovu", "💬", "Wichtiges Gespräch", "Rund um den Eisprung fühlen sich viele Frauen selbstbewusst und kommunikativ.", "Führ das Gespräch, das du vor dir herschiebst, oder frag nach dem, was du willst."],
    ["o2", "auf", "ovu", "📸", "Fortschrittsfoto", "Gute Phase, um dich sichtbar zu machen und Fortschritte festzuhalten.", "Gleiches Licht, gleiche Kleidung, gleiche Pose wie beim letzten Foto."],
    ["o3", "auf", "ovu", "🔍", "Ausfluss beobachten", "Klarer, dehnbarer Ausfluss ist ein typisches Zeichen für den Eisprung.", "Trag deinen Ausfluss ein, so lernt die App deinen echten Eisprung kennen."],
    ["o4", "ess", "ovu", "🌾", "Ballaststoffe", "Ballaststoffe halten lange satt.", "Vollkorn, Gemüse, Beeren und ein Löffel Leinsamen."],
    ["o5", "ess", "ovu", "💧", "Genug trinken", "Bei intensivem Training verlierst du mehr Flüssigkeit.", "Wasserflasche immer in Sichtweite, 2,5 Liter als Ziel."],
    ["o6", "ess", "ovu", "🫐", "Beeren-Boost", "Beeren bringen Farbe und Geschmack in den Tag.", "Eine Handvoll ins Porridge, in den Skyr oder als Snack."],
    ["o7", "bew", "ovu", "💥", "Power-Training", "Für viele Frauen ist das die stärkste Zeit im Zyklus.", "Schwere Sätze oder ein neuer Rekordversuch, nach gründlichem Aufwärmen."],
    ["o8", "bew", "ovu", "🦘", "Sauber landen", "Bei Sprüngen lohnt sich jetzt besonders saubere Technik.", "Weich landen, Knie zeigen in Richtung Fußspitzen, lieber kontrolliert als hoch."],
    ["o9", "bew", "ovu", "🚴‍♀️", "Lockeres Cardio", "Ausgleich zu den harten Einheiten.", "30 Minuten Radfahren oder zügiges Gehen."],
    ["o10", "care", "ovu", "💅", "Gönn dir was", "Du darfst dich feiern.", "Neue Nagelfarbe, Lieblingsoutfit, schönes Essen. Was macht dir Freude?"],
    ["o11", "care", "ovu", "🎨", "Kreativ sein", "Viele Frauen sprühen jetzt vor Ideen.", "Schreib, mal, gestalte oder sammle Ideen in einer Notiz."],
    ["l1", "auf", "lut", "✅", "Abschließen statt anfangen", "Viele sind jetzt ruhiger und genauer bei der Sache.", "Erledige offene To-dos, bevor du Neues anfängst."],
    ["l2", "auf", "lut", "🧹", "Ausmisten", "Ordnung im Außen bringt oft Ruhe im Kopf.", "Eine Schublade, ein Regal oder der Kühlschrank. Klein anfangen."],
    ["l3", "auf", "pms", "⏳", "Puffer einplanen", "Vor der Periode ist die Belastbarkeit bei vielen geringer.", "Plane zwischen Terminen 15 Minuten Luft ein und streich, was nicht sein muss."],
    ["l4", "ess", "lut", "🍽️", "Mehr Hunger ist normal", "In der Lutealphase verbraucht dein Körper in Ruhe etwas mehr Energie.", "Eiweiß- und ballaststoffreich essen. Ein Luteal-Extra ist eingeplant."],
    ["l5", "ess", "lut", "🥜", "Magnesium-Snacks", "Magnesium trägt zur Verringerung von Müdigkeit bei.", "Eine Handvoll Nüsse, Haferflocken oder ungesüßter Kakao im Skyr."],
    ["l6", "ess", "pms", "🍫", "Gelüste mit Plan", "Verbote machen Heißhunger oft größer.", "Plane ein bis zwei Stück Zartbitterschokolade bewusst ein und genieß sie."],
    ["l7", "ess", "pms", "🧂", "Salz im Blick", "Vor der Periode lagern viele Frauen mehr Wasser ein.", "Weniger Fertigprodukte und Chips, dafür viel trinken."],
    ["l8", "bew", "lut", "🏋️‍♀️", "Moderates Krafttraining", "Routine zählt jetzt mehr als Rekorde.", "Dein normaler Plan, Anstrengung etwa 7 von 10."],
    ["l9", "bew", "lut", "🧘‍♀️", "Mobility & Dehnen", "Bewegung, die runterfährt statt aufdreht.", "10 Minuten Mobility nach dem Training oder vor dem Schlafen."],
    ["l10", "bew", "lut", "🚶‍♀️", "Spaziergang nach dem Essen", "Ein kurzer Gang nach dem Essen tut vielen gut.", "10 Minuten nach dem Mittag- oder Abendessen."],
    ["l11", "bew", "pms", "🌿", "Sanftes Yoga", "Wenn die Energie sinkt, darf das Training sanfter werden.", "20 Minuten Yoga oder Pilates, ohne Leistungsdruck."],
    ["l12", "bew", "lut", "🌬️", "Kühl trainieren", "Deine Körpertemperatur ist in dieser Phase leicht erhöht.", "Gut lüften, leichte Kleidung, Wasserflasche griffbereit."],
    ["l13", "care", "pms", "📵", "Handy-Feierabend", "Vor der Periode schlafen viele Frauen schlechter.", "Eine Stunde vor dem Schlafen Handy weg, lieber lesen oder Musik."],
    ["l14", "care", "lut", "📓", "Gefühle aufschreiben", "Was auf dem Papier steht, kreist weniger im Kopf.", "Fünf Minuten: Was beschäftigt mich gerade? Was brauche ich?"],
    ["l15", "care", "lut", "🌬️", "Atempause", "Ruhiges Atmen hilft beim Runterkommen.", "4 Sekunden einatmen, 6 Sekunden ausatmen, 10 Runden."],
    ["l16", "care", "lut", "🛏️", "Frische Bettwäsche", "Ein kleiner Luxus für besseren Schlaf.", "Heute Abend frisch beziehen und früh reinkuscheln."],
    ["l17", "care", "pms", "💛", "Sei sanft zu dir", "Dünnhäutiger zu sein ist kein Charakterfehler.", "Sprich mit dir, wie du mit deiner besten Freundin sprechen würdest."],
  ];
  const CAT = { auf: "Aufgaben", ess: "Ernährung", bew: "Bewegung", care: "Selfcare" };
  const tipFits = (t, ph) => t[2] === ph || (t[2] === "lut" && (ph === "lut1" || ph === "lut2")) || (t[2] === "pms" && ph === "lut2");
  function tipsFor(ph, date) {
    const out = []; Object.keys(CAT).forEach(cat => { const L = TIPS.filter(t => t[1] === cat && tipFits(t, ph)); const s = hash(date + cat); for (let i = 0; i < Math.min(2, L.length); i++) out.push(L[(s + i * 7) % L.length]); });
    return out.filter((t, i, a) => a.indexOf(t) === i);
  }

  // ---------- Tagesimpuls & Spruch ----------
  const IMP = {
    mens: [["Ein frischer Start", "Ein neuer Zyklus beginnt. Gerade die ersten Tage können anstrengend sein, also plan dir heute bewusst Luft ein."], ["Gut versorgen", "Wärme, warmes Essen, genug Schlaf: Heute geht es darum, dir zu geben, was du brauchst."], ["Spür rein", "Bei vielen wird die Blutung jetzt schwächer. Fühlt sich Bewegung schon wieder gut an?"], ["Langsam kommt der Schwung", "Das Östrogen steigt wieder an. Vielleicht merkst du schon etwas mehr Energie."], ["Fast geschafft", "Die Periode klingt ab. Ein guter Tag, um die nächste Woche zu planen."]],
    foll: [["Aufwind", "Östrogen steigt, und mit ihm bei vielen Frauen Laune und Antrieb. Nutz den Rückenwind."], ["Lernlust", "Neues fällt jetzt oft leichter. Probier eine neue Übung oder ein neues Rezept."], ["Stark sein", "Gute Tage für schwere Sätze. Trau dir ruhig etwas mehr zu."], ["Lust auf Menschen", "Verabrede dich, plane etwas Schönes. Das passt gerade gut."], ["Klarer Kopf", "Planen, entscheiden, anpacken: Viele Frauen sind jetzt besonders fokussiert."], ["Kurz vor dem Hoch", "Dein Körper bereitet den Eisprung vor. Vielleicht bemerkst du schon klareren Ausfluss."]],
    ovu: [["Dein Hoch", "Rund um den Eisprung fühlen sich viele Frauen besonders kraftvoll und selbstbewusst."], ["Sichtbar sein", "Ein guter Moment für ein wichtiges Gespräch oder ein neues Fortschrittsfoto."], ["Power mit Technik", "Volle Kraft, aber sauber: gut aufwärmen und kontrolliert landen."]],
    lut1: [["Umschalten", "Nach dem Eisprung übernimmt Progesteron. Viele werden ruhiger und konzentrierter."], ["Dranbleiben", "Jetzt zählt Routine. Bleib bei deinem Plan, auch wenn die Euphorie nachlässt."], ["Mehr Hunger? Normal.", "Dein Körper verbraucht jetzt etwas mehr Energie. Eiweiß und Ballaststoffe halten satt."], ["Schwitzen erlaubt", "Deine Körpertemperatur ist leicht erhöht. Trink mehr und lüfte beim Training gut."], ["Fokus-Zeit", "Ein guter Zeitpunkt, um Dinge abzuschließen und Ordnung zu schaffen."]],
    lut2: [["Sanfter werden", "Die Hormone fallen ab. Wenn du dünnhäutiger bist: Das ist kein Charakterfehler."], ["Plan B ist auch ein Plan", "Wenn das Training schwerer fällt, nimm die sanfte Variante. Bewegung zählt."], ["Gelüste mit Plan", "Lust auf Süßes? Plan es ein, statt es zu verbieten."], ["Ruhe-Inseln", "Bau dir heute kleine Pausen ein: Spaziergang, Tee, fünf Minuten nur für dich."], ["Bald geht es von vorn los", "Deine Periode steht vor der Tür. Leg Wärmflasche und Lieblingstee schon mal bereit."]],
  };
  const LATE = ["Spät dran", "Deine Periode lässt auf sich warten. Stress, wenig Schlaf, Krankheit oder zu wenig Energie können den Zyklus verschieben. Bleibt sie länger aus, sprich mit deiner Frauenärztin."];
  const QUOTE = {
    mens: ["Ruhe ist kein Rückschritt, sondern Teil des Weges.", "Langsam ist auch ein Tempo.", "Heute darfst du einfach nur sein.", "Du musst heute nichts beweisen.", "Weniger tun, besser fühlen."],
    foll: ["Neue Energie, neue Möglichkeiten.", "Fang an, wo du bist.", "Mut wächst beim Machen.", "Jeder starke Satz beginnt mit dem ersten.", "Heute ist ein guter Tag für einen Anfang."],
    ovu: ["Du bist stärker, als du denkst.", "Zeig dich, so wie du bist.", "Dein Hoch gehört dir. Genieß es.", "Strahl ruhig ein bisschen."],
    lut1: ["Dranbleiben ist das neue Durchstarten.", "Kleine Schritte, großer Weg.", "Routine ist Selbstfürsorge.", "Fokus schlägt Motivation."],
    lut2: ["Sei so geduldig mit dir wie mit deiner besten Freundin.", "Auch an schweren Tagen zählst du.", "Sanft ist auch stark.", "Gefühle dürfen laut sein. Du darfst trotzdem freundlich zu dir sein."],
  };
  function impulse(st) {
    if (!st) return null; if (st.late) return LATE;
    const { cd, len, plen } = st, ov = len - 14, ph = st.phase; const L = IMP[ph];
    const seg = { mens: [1, plen], foll: [plen + 1, ov - 2], ovu: [ov - 1, ov + 1], lut1: [ov + 2, len - 5], lut2: [len - 4, len] }[ph];
    const span = Math.max(1, seg[1] - seg[0] + 1); const pos = Math.min(span - 1, Math.max(0, cd - seg[0]));
    return L[Math.min(L.length - 1, Math.floor(pos / span * L.length))];
  }

  // ---------- Hormonkurve (Schema) ----------
  const g = (x, m, s) => Math.exp(-((x - m) ** 2) / (2 * s * s));
  const sig = (x, m, k) => 1 / (1 + Math.exp(-(x - m) * k));
  const HORM = [
    ["Östrogen", "#E6C35C", (x, o, l) => 0.12 + 0.78 * g(x, o - 0.035, 0.075) + 0.33 * g(x, l, 0.11)],
    ["Progesteron", "#A88AD8", (x, o, l) => 0.05 + 0.82 * g(x, l, 0.1) * sig(x, o + 0.02, 60)],
    ["LH", "#E07A9B", (x, o) => 0.06 + 0.9 * g(x, o - 0.008, 0.02)],
    ["Testosteron", "#6FB7A8", (x, o) => 0.22 + 0.25 * g(x, o - 0.02, 0.08)],
  ];
  const HTXT = {
    mens: "Östrogen und Progesteron sind auf dem niedrigsten Stand. Deshalb setzt die Blutung ein.",
    foll: "Östrogen steigt Tag für Tag. Bei vielen Frauen steigen damit Energie und Laune.",
    ovu: "Östrogen ist am höchsten, LH schießt kurz nach oben und löst den Eisprung aus. Auch Testosteron ist leicht erhöht.",
    lut1: "Progesteron steigt und dominiert jetzt. Die Körpertemperatur liegt etwas höher.",
    lut2: "Progesteron und Östrogen fallen ab. Diese Veränderung spüren manche Frauen als PMS.",
  };

  // ---------- Muster (wiederkehrende Einträge) ----------
  const PAT_KEYS = ["symptoms", "moods", "skin", "food"];
  const NEG_MOOD = new Set(["Sensibel", "Gereizt", "Traurig", "Ängstlich", "Gestresst", "Unruhig", "Überfordert", "Stimmungsschwankungen", "Müde", "Antriebslos"]);
  function patterns(A) {
    const starts = A.starts(); if (starts.length < 2) return { list: [], cycles: Math.max(0, starts.length - 1) };
    const from = starts[Math.max(0, starts.length - 7)]; const map = {}; const cycSeen = new Set();
    const days = A.days();
    Object.keys(days).filter(d => d >= from && d <= A.today()).forEach(d => {
      const st = A.phaseOn(d); if (!st || st.late) return; let ci = -1; starts.forEach((s, i) => { if (s <= d) ci = i; }); if (ci < 0) return; cycSeen.add(ci);
      const e = days[d] || {}; PAT_KEYS.forEach(k => (e[k] || []).forEach(item => { if (k === "moods" && !NEG_MOOD.has(item)) return; const key = item + "|" + st.phase; const m = map[key] ||= { item, ph: st.phase, cyc: new Set(), cds: [] }; m.cyc.add(ci); m.cds.push(st.cd); }));
    });
    const cycles = cycSeen.size;
    const list = Object.values(map).filter(m => m.cyc.size >= 2).map(m => { const c = m.cds.slice().sort((a, b) => a - b); return { item: m.item, ph: m.ph, n: m.cyc.size, of: cycles, lo: c[Math.floor(c.length * 0.15)], hi: c[Math.ceil(c.length * 0.85) - 1] }; })
      .sort((a, b) => b.n - a.n || a.lo - b.lo);
    return { list, cycles };
  }
  function patternText(p) { return `${p.item} · in ${p.n} von ${p.of} Zyklen · meist ${p.lo === p.hi ? "Tag " + p.lo : "Tag " + p.lo + "–" + p.hi} (${PH[p.ph].n})`; }

  // ---------- Vorhersage ----------
  function accuracy(A) {
    const s = A.starts(); const lens = []; for (let i = 1; i < s.length; i++) { const l = diffD(s[i - 1], s[i]); if (l >= 18 && l <= 45) lens.push(l); }
    const L = lens.slice(-6); const avg = L.length ? Math.round(L.reduce((a, b) => a + b, 0) / L.length) : null;
    const spread = L.length >= 2 ? Math.ceil((Math.max(...L) - Math.min(...L)) / 2) : null;
    const next = s.length ? addD(s[s.length - 1], avg || A.defaultLen()) : null;
    return { n: lens.length, avg, spread, next };
  }

  // ---------- CSS ----------
  const CSS = `
  .zp-card{background:var(--zp-card,var(--stage,#1b1722));border:1px solid var(--zp-line,var(--line,rgba(255,255,255,.1)));border-radius:22px;padding:16px;display:flex;flex-direction:column;gap:10px}
  .zp-eyebrow{font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--zp-gold,var(--gold,#d9b64e));font-weight:700}
  .zp-muted{color:var(--zp-muted,var(--muted,#9a93a6))}
  .zp-week{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center}
  .zp-week button{background:none;border:0;color:inherit;font:inherit;display:flex;flex-direction:column;align-items:center;gap:6px;padding:4px 0;cursor:pointer}
  .zp-week .wd{font-size:.68rem;letter-spacing:.1em;color:var(--zp-muted,var(--muted,#9a93a6));font-weight:700}
  .zp-week .dn{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:1.02rem;border:2px solid transparent;position:relative}
  .zp-week .per .dn{background:#C9779B;color:#fff}
  .zp-week .pred .dn{border:2px dashed #C9779B}
  .zp-week .ovu .dn{border:2px dashed #E6C35C}
  .zp-week .tod .wd{color:var(--zp-gold,var(--gold,#d9b64e))}
  .zp-week .sel .dn{box-shadow:0 0 0 3px var(--zp-ring,rgba(201,119,155,.45))}
  .zp-week .dot{position:absolute;bottom:-7px;width:5px;height:5px;border-radius:50%;background:var(--zp-gold,var(--gold,#d9b64e))}
  .zp-ringwrap{position:relative;width:100%;max-width:330px;margin:0 auto;aspect-ratio:1}
  .zp-ringwrap svg{width:100%;height:100%;overflow:visible}
  .zp-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;pointer-events:none}
  .zp-center .cd{font-family:var(--zp-serif,inherit);font-size:4rem;line-height:1;font-weight:700;margin:4px 0}
  .zp-center .ph{font-style:italic;font-size:1.15rem}
  .zp-pill{align-self:center;border-radius:999px;padding:14px 26px;font-weight:700;font-size:1.02rem;border:1.5px solid #C9779B;background:rgba(201,119,155,.14);color:inherit;cursor:pointer}
  .zp-check{flex-direction:row;align-items:center;gap:14px;cursor:pointer;text-align:left;color:inherit;font:inherit;width:100%;background:linear-gradient(135deg,rgba(201,119,155,.18),rgba(168,138,216,.12))}
  .zp-check .big{font-family:var(--zp-serif,inherit);font-size:1.35rem;font-style:italic;font-weight:600}
  .zp-tips{display:grid;grid-template-columns:repeat(4,1fr);gap:12px 6px}
  .zp-tip{background:none;border:0;color:inherit;font:inherit;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;cursor:pointer;padding:2px}
  .zp-tip i{font-style:normal;width:52px;height:52px;border-radius:50%;display:grid;place-items:center;font-size:1.5rem;background:var(--zp-soft,rgba(255,255,255,.06))}
  .zp-tip span{font-size:.74rem;line-height:1.2;hyphens:auto;-webkit-hyphens:auto;overflow-wrap:break-word;max-width:100%}
  .zp-tri{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
  .zp-tri>div{border-radius:16px;padding:10px;font-size:.8rem;line-height:1.35;display:flex;flex-direction:column;gap:4px}
  .zp-tri b{font-size:.9rem}
  .zp-legend{display:flex;flex-wrap:wrap;gap:6px 12px;font-size:.75rem}
  .zp-legend i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px;vertical-align:-1px}
  .zp-seg{display:flex;gap:6px}.zp-seg i{flex:1;height:8px;border-radius:9px;background:var(--zp-soft,rgba(255,255,255,.08))}.zp-seg i.on{background:var(--zp-gold,var(--gold,#d9b64e))}
  .zp-quote{font-family:var(--zp-serif,inherit);font-style:italic;font-size:1.3rem;line-height:1.35;text-align:center;color:var(--zp-gold,var(--gold,#d9b64e));padding:8px 4px}
  .zp-ed{display:flex;flex-direction:column;gap:14px}
  .zp-ed .top{position:sticky;top:-18px;z-index:2;background:var(--zp-sheet,var(--stage,#1b1722));padding:6px 0 8px;display:flex;flex-direction:column;gap:10px}
  .zp-cats{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}.zp-cats::-webkit-scrollbar{display:none}
  .zp-cats button{flex:none;border-radius:999px;border:1px solid var(--zp-line,var(--line,rgba(255,255,255,.15)));background:none;color:inherit;font:inherit;font-size:.85rem;padding:7px 13px;cursor:pointer}
  .zp-sec h4{margin:0 0 8px;font-size:.74rem;letter-spacing:.14em;text-transform:uppercase;color:var(--zp-gold,var(--gold,#d9b64e))}
  .zp-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px 6px}
  .zp-it{background:none;border:0;color:inherit;font:inherit;display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;padding:0;text-align:center}
  .zp-it i{font-style:normal;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;font-size:1.45rem;background:var(--zp-soft,rgba(255,255,255,.06));border:2px solid transparent;position:relative;transition:transform .12s}
  .zp-it span{font-size:.74rem;line-height:1.2;hyphens:auto;-webkit-hyphens:auto;overflow-wrap:break-word;max-width:100%}
  .zp-it i.sm{font-size:.9rem;letter-spacing:-3px}
  .zp-it.on i{border-color:var(--zp-acc,#C9779B);background:rgba(201,119,155,.22)}
  .zp-it.on i::after{content:"✓";position:absolute;top:-4px;right:-4px;width:20px;height:20px;border-radius:50%;background:var(--zp-acc,#C9779B);color:#fff;font-size:.7rem;display:grid;place-items:center;font-weight:700}
  .zp-it:active i{transform:scale(.92)}
  .zp-search{width:100%;border-radius:999px;padding:11px 16px;border:1px solid var(--zp-line,var(--line,rgba(255,255,255,.15)));background:var(--zp-soft,rgba(255,255,255,.05));color:inherit;font:inherit}
  .zp-date{display:flex;align-items:center;justify-content:center;gap:10px}
  .zp-date button{background:none;border:1px solid var(--zp-line,var(--line,rgba(255,255,255,.15)));border-radius:999px;color:inherit;font:inherit;padding:6px 12px;cursor:pointer}
  .zp-date button:disabled{opacity:.3}
  .zp-pat{display:flex;gap:10px;align-items:flex-start;font-size:.88rem}
  `;
  function css() { if (document.getElementById("zpCss")) return; const s = document.createElement("style"); s.id = "zpCss"; s.textContent = CSS; document.head.appendChild(s); }

  // ---------- Bausteine ----------
  function weekStrip(A, sel) {
    const t = A.today(); let h = "";
    for (let i = -3; i <= 3; i++) {
      const d = addD(t, i), st = A.phaseOn(d), cls = [];
      if (A.inPeriod(d)) cls.push("per"); else if (d > t && st && st.phase === "mens" && !st.late && !A.hormonal()) cls.push("pred"); else if (st && st.ovu && !st.late && !A.hormonal()) cls.push("ovu");
      if (d === t) cls.push("tod"); if (d === sel) cls.push("sel");
      h += `<button class="${cls.join(" ")}" data-act="zpSel" data-d="${d}" aria-label="${d === t ? "Heute" : WD[parseD(d).getDay()] + " " + fmtS(d)}"><span class="wd">${d === t ? "HEUTE" : WD[parseD(d).getDay()].toUpperCase()}</span><span class="dn">${parseD(d).getDate()}${A.hasEntry(d) ? '<span class="dot"></span>' : ""}</span></button>`;
    }
    return `<div class="zp-week">${h}</div>`;
  }
  function ring(A, sel) {
    const st = A.phaseOn(sel); if (!st) return "";
    const len = st.len, plen = st.plen || 5, ov = len - 14, R = 118, CX = 160, CY = 160;
    const ang = cd => ((cd - 1) / len) * 2 * Math.PI - Math.PI / 2; const pt = (a, r) => [CX + r * Math.cos(a), CY + r * Math.sin(a)];
    let ticks = "";
    for (let cd = 1; cd <= len; cd++) { const p = phaseOfCd(cd, len, plen); const a = ang(cd); const [x1, y1] = pt(a, R - 9), [x2, y2] = pt(a, R + 9); const cur = cd === st.cd; ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${PH[p].c}" stroke-width="${cur ? 7 : 5}" stroke-linecap="round" opacity="${cur ? 1 : cd < st.cd ? 0.35 : 0.7}"/>`; }
    // Beschriftung entlang des Rings
    const groups = [["mens", 1, plen, "PERIODE"], ["foll", plen + 1, ov - 2, "FOLLIKELPHASE"], ["ovu", ov - 1, ov + 1, "EISPRUNG"], ["lut1", ov + 2, len, "LUTEALPHASE"]];
    let defs = "", labels = "";
    groups.forEach(([k, a, b, t], i) => {
      if (b < a) return; const a0 = ang(a) - 0.06, a1 = ang(b) + 0.06, mid = (a0 + a1) / 2; const bottom = Math.sin(mid) > 0.25; const r = bottom ? R + 30 : R + 24;
      const [sx, sy] = pt(bottom ? a1 : a0, r), [ex, ey] = pt(bottom ? a0 : a1, r); const large = (a1 - a0) > Math.PI ? 1 : 0;
      defs += `<path id="zpArc${i}" d="M${sx.toFixed(1)} ${sy.toFixed(1)} A${r} ${r} 0 ${large} ${bottom ? 0 : 1} ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none"/>`;
      labels += `<text font-size="12.5" letter-spacing="3" fill="${PH[k].c}" font-weight="700"><textPath href="#zpArc${i}" startOffset="50%" text-anchor="middle">${t}</textPath></text>`;
    });
    const [mx, my] = pt(ang(st.cd), R);
    const ph = PH[st.phase];
    return `<div class="zp-ringwrap"><svg viewBox="0 0 320 320" role="img" aria-label="Zyklustag ${st.cd} von ${len}, ${ph.long}"><defs>${defs}<radialGradient id="zpGlow"><stop offset="0" stop-color="${ph.c}" stop-opacity=".22"/><stop offset="1" stop-color="${ph.c}" stop-opacity="0"/></radialGradient></defs>
      <circle cx="160" cy="160" r="96" fill="url(#zpGlow)"/><circle cx="160" cy="160" r="96" fill="none" stroke="${ph.c}" stroke-opacity=".35" stroke-width="1"/>${ticks}${labels}
      <circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="11" fill="#E6C35C" stroke="var(--zp-card,#1b1722)" stroke-width="4"/></svg>
      <div class="zp-center"><span class="zp-eyebrow">${st.late ? "Periode erwartet" : "Zyklustag"}</span><span class="cd">${st.cd}</span><span class="ph" style="color:${ph.c}">${st.late ? "überfällig?" : ph.long}</span>${A.hormonal() ? '<span class="zp-muted" style="font-size:.72rem;margin-top:4px">mit hormoneller Verhütung</span>' : ""}</div></div>`;
  }
  function head(A) {
    css(); const sel = A.sel(); const t = A.today(); const st = A.phaseOn(t); const acc = accuracy(A);
    const inP = A.inPeriod(sel); const fut = sel > t;
    const btn = fut ? "" : `<button class="zp-pill" data-act="${inP ? A.actEnd : A.actStart}">${inP ? "Periode beendet" : "Periode hat begonnen"}${sel !== t ? " · " + fmtS(sel) : ""}</button>`;
    const nextTxt = st && acc.next ? (() => { const n = diffD(t, acc.next); return st.late ? "Deine Periode ist seit " + (st.cd - st.len) + " Tag" + (st.cd - st.len === 1 ? "" : "en") + " fällig." : A.inPeriod(t) ? "Tag " + st.cd + " deiner Periode · gönn dir Ruhe" : n > 0 ? "Nächste Periode in ca. " + n + " Tag" + (n === 1 ? "" : "en") + " (" + fmtS(acc.next) + ")" : ""; })() : "";
    return `<div class="zp-card" style="background:none;border:0;padding:0;gap:14px">${weekStrip(A, sel)}${ring(A, sel)}${btn}${nextTxt ? `<p class="zp-muted" style="text-align:center;font-size:.85rem;margin:0">${esc(nextTxt)}</p>` : ""}</div>`;
  }
  function checkCard(A) {
    const d = A.sel() > A.today() ? A.today() : A.sel(); const e = A.day(d) || {};
    const n = ["symptoms", "moods", "skin", "move", "food", "care"].reduce((a, k) => a + (e[k] || []).length, 0) + (e.flow ? 1 : 0) + (e.energy ? 1 : 0) + (e.lh ? 1 : 0) + (e.bbt ? 1 : 0) + (e.discharge ? 1 : 0);
    const chips = ["moods", "symptoms", "move", "care"].flatMap(k => (e[k] || []).slice(0, 3)).slice(0, 5);
    return `<button class="zp-card zp-check" data-act="zpEdit" data-d="${d}"><span style="font-size:1.8rem" aria-hidden="true">✳️</span><span class="grow" style="flex:1;min-width:0"><span class="big">Wie geht es dir ${d === A.today() ? "heute" : "am " + fmtS(d)}?</span><br><span class="zp-muted" style="font-size:.85rem">${n ? n + " Einträge" + (chips.length ? ": " + esc(chips.join(", ")) : "") : "Stimmung, Körper, Bewegung & mehr in einer Minute festhalten"}</span></span><span aria-hidden="true" style="font-size:1.4rem;opacity:.6">›</span></button>`;
  }
  function impulseCard(A) { const st = A.phaseOn(A.today()); const t = impulse(st); if (!t) return ""; return `<div class="zp-card"><div class="zp-eyebrow">✦ Dein Impuls heute</div><h3 style="margin:0">${esc(t[0])}</h3><p style="margin:0;line-height:1.5">${esc(t[1])}</p></div>`; }
  function tipsCard(A) {
    const st = A.phaseOn(A.today()); if (!st) return ""; const L = tipsFor(st.phase, A.today());
    return `<div class="zp-card"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><div class="zp-eyebrow">Tipps des Tages</div><span class="zp-muted" style="font-size:.82rem">Tag ${st.cd} · ${PH[st.phase].n}</span></div>
      <div class="zp-tips" lang="de">${L.map(t => `<button class="zp-tip" data-act="zpTip" data-id="${t[0]}"><i aria-hidden="true">${t[3]}</i><span>${esc(t[4])}</span></button>`).join("")}</div>
      <button class="zp-pill" style="padding:9px 18px;font-size:.85rem;border-color:var(--zp-gold,var(--gold,#d9b64e));background:none" data-act="zpAllTips">Alle Tipps für diese Phase ›</button></div>`;
  }
  function triCard(A) {
    const st = A.phaseOn(A.today()); if (!st) return ""; const L = TIPS.filter(t => tipFits(t, st.phase)); const s = hash(A.today() + "tri");
    const pick = cat => { const x = L.filter(t => t[1] === cat); return x[s % x.length]; };
    const box = (cat, bg) => { const t = pick(cat); return t ? `<div style="background:${bg}"><b>${CAT[cat]}</b><span>${esc(t[6])}</span></div>` : ""; };
    return `<div class="zp-tri">${box("auf", "rgba(168,138,216,.16)")}${box("bew", "rgba(111,183,168,.16)")}${box("ess", "rgba(201,119,155,.18)")}</div>`;
  }
  function hormoneCard(A) {
    const st = A.phaseOn(A.sel() > A.today() ? A.today() : A.sel()); if (!st) return "";
    const len = st.len, o = (len - 14) / len, l = o + (1 - o) * 0.5, W = 320, H = 150, P = 10;
    const X = x => P + x * (W - 2 * P), Y = v => H - P - v * (H - 2 * P - 6);
    const path = f => { let d = ""; for (let i = 0; i <= 120; i++) { const x = i / 120; d += (i ? "L" : "M") + X(x).toFixed(1) + " " + Y(Math.min(1, f(x, o, l))).toFixed(1); } return d; };
    const plen = st.plen || 5; const bands = [["mens", 0, plen / len], ["foll", plen / len, (len - 16) / len], ["ovu", (len - 16) / len, (len - 13) / len], ["lut1", (len - 13) / len, (len - 5) / len], ["lut2", (len - 5) / len, 1]];
    const xt = (Math.min(st.cd, len) - 0.5) / len;
    return `<div class="zp-card"><div class="zp-eyebrow">Hormone im Zyklus</div>
      <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img" aria-label="Vereinfachter Hormonverlauf, heute markiert">
      ${bands.map(([k, a, b]) => `<rect x="${X(a).toFixed(1)}" y="0" width="${Math.max(0, X(b) - X(a)).toFixed(1)}" height="${H}" fill="${PH[k].c}" opacity="${k === st.phase ? 0.16 : 0.05}"/>`).join("")}
      ${HORM.map(([n, c, f]) => `<path d="${path(f)}" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="${A.hormonal() ? 0.35 : 1}"/>`).join("")}
      <line x1="${X(xt)}" x2="${X(xt)}" y1="0" y2="${H}" stroke="currentColor" stroke-opacity=".6" stroke-dasharray="3 4"/>
      ${HORM.map(([n, c, f]) => `<circle cx="${X(xt).toFixed(1)}" cy="${Y(Math.min(1, f(xt, o, l))).toFixed(1)}" r="4" fill="${c}"/>`).join("")}</svg>
      <div class="zp-legend">${HORM.map(([n, c]) => `<span><i style="background:${c}"></i>${n}</span>`).join("")}</div>
      <p style="margin:0;line-height:1.5"><b>${st.late ? "Vor der Periode" : PH[st.phase].long}:</b> ${esc(st.late ? HTXT.lut2 : HTXT[st.phase])}</p>
      <p class="zp-muted" style="margin:0;font-size:.75rem">Vereinfachtes Schema eines natürlichen Zyklus, kein Messwert. ${A.hormonal() ? "Mit hormoneller Verhütung verlaufen deine Hormone anders und meist ohne Eisprung." : "Bei dir kann es anders aussehen."}</p></div>`;
  }
  function patternCard(A) {
    const { list, cycles } = patterns(A); const t = A.today();
    if (!list.length) return `<div class="zp-card"><div class="zp-eyebrow">Wiederkehrende Muster</div><h3 style="margin:0">Noch zu früh für ein Fazit</h3><p class="zp-muted" style="margin:0;line-height:1.5">${cycles < 2 ? "Erfasse ein paar Zyklen lang, wie es dir geht." : "Bisher wiederholt sich nichts deutlich."} Sobald sich Beschwerden oder Stimmungen in mehreren Zyklen in derselben Phase zeigen, siehst du sie hier, samt Ausblick für die nächsten Tage.</p><button class="zp-pill" style="padding:9px 18px;font-size:.85rem" data-act="zpEdit" data-d="${t}">✳️ Jetzt erfassen</button></div>`;
    const next = new Set(); for (let i = 1; i <= 4; i++) { const s = A.phaseOn(addD(t, i)); if (s) next.add(s.phase); }
    const soon = list.filter(p => next.has(p.ph) && p.ph !== A.phaseOn(t)?.phase).slice(0, 4);
    return `<div class="zp-card"><div class="zp-eyebrow">Wiederkehrende Muster</div>
      ${soon.length ? `<div class="zp-pat" style="background:rgba(230,195,92,.12);border-radius:14px;padding:10px"><span>🔮</span><span><b>In den nächsten Tagen erfahrungsgemäß:</b> ${esc(soon.map(p => p.item).join(", "))}. Plan dir etwas Gutes ein.</span></div>` : ""}
      ${list.slice(0, 6).map(p => `<div class="zp-pat"><span aria-hidden="true">${ICON[p.item] || "•"}</span><span>${esc(patternText(p))}</span></div>`).join("")}
      <p class="zp-muted" style="margin:0;font-size:.75rem">Aus deinen eigenen Einträgen der letzten Zyklen.</p></div>`;
  }
  function accuracyCard(A) {
    const a = accuracy(A); const seg = Math.min(3, a.n);
    const txt = a.n === 0 ? "Noch kein ganzer Zyklus erfasst. Die Vorhersage nutzt vorerst deine Startwerte." : a.n < 3 ? `${a.n} von 3 Zyklen erfasst. Mit jedem weiteren Zyklus wird die Vorhersage genauer.` : `Deine Zyklen dauern im Schnitt ${a.avg} Tage${a.spread != null ? " und schwanken um ±" + a.spread + " Tag" + (a.spread === 1 ? "" : "e") : ""}.`;
    const win = a.n >= 3 && a.next ? `Nächste Periode wahrscheinlich zwischen ${fmtS(addD(a.next, -Math.max(1, a.spread || 1)))} und ${fmtS(addD(a.next, Math.max(1, a.spread || 1)))}` : "";
    return `<div class="zp-card"><div style="display:flex;justify-content:space-between;gap:8px"><h3 style="margin:0">Vorhersage-Genauigkeit</h3><span class="zp-muted" style="font-size:.85rem">${Math.min(a.n, 3)} von 3 Zyklen</span></div><div class="zp-seg"><i class="${seg >= 1 ? "on" : ""}"></i><i class="${seg >= 2 ? "on" : ""}"></i><i class="${seg >= 3 ? "on" : ""}"></i></div><p style="margin:0;line-height:1.5">${esc(txt)} ${esc(win)}</p></div>`;
  }
  function quoteCard(A) { const st = A.phaseOn(A.today()); const L = QUOTE[st ? st.phase : "foll"]; return `<div class="zp-card"><p class="zp-quote">„${esc(L[hash(A.today() + "q") % L.length])}“</p></div>`; }

  // ---------- Erfassen (Sheet) ----------
  function editor(A) {
    const d = A.edDate(); const e = A.day(d) || {}; const st = A.phaseOn(d); const t = A.today();
    const item = (grp, val, label, ic, on, single) => `<button class="zp-it ${on ? "on" : ""}" data-act="zpT" data-g="${grp}" data-v="${esc(val)}"${single ? ' data-single="1"' : ""} data-l="${esc(String(label).toLowerCase())}"><i aria-hidden="true"${/💧💧/.test(ic) ? ' class="sm"' : ""}>${ic}</i><span>${esc(label)}</span></button>`;
    const has = (k, v) => (e[k] || []).includes(v);
    const multi = (k, L) => L.map(([l, ic]) => item(k, l, l, ic, has(k, l))).join("");
    // Vorschläge: Phase + eigene Häufigkeiten in dieser Phase
    const freq = {}; if (st) Object.entries(A.days()).forEach(([dd, x]) => { const s2 = A.phaseOn(dd); if (!s2 || s2.phase !== st.phase || dd === d) return; Object.keys(MULTI).forEach(k => (x[k] || []).forEach(v => { freq[k + "|" + v] = (freq[k + "|" + v] || 0) + 1; })); });
    const mine = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([kv]) => kv);
    const base = (SUGG[st?.phase || "foll"] || []).map(l => { const k = Object.keys(MULTI).find(k => MULTI[k].some(x => x[0] === l)); return k + "|" + l; });
    const sugg = [...new Set([...mine, ...base])].slice(0, 8);
    const secs = [
      ["vor", "Für dich vorgeschlagen", sugg.map(kv => { const [k, l] = kv.split("|"); return item(k, l, l, ICON[l] || "•", has(k, l)); }).join("")],
      ["blut", "Blutung", A.flowLabels.map((l, i) => item("flow", i, l, FLOWI[i] || "💧", num(e.flow) === i && e.flow != null, 1)).join("")],
      ["energie", "Energie", ENERGY.map(([v, l, ic]) => item("energy", v, l, ic, num(e.energy) === v, 1)).join("")],
      ["schmerz", "Schmerzen", PAIN.map(([v, l, ic]) => item("pain", v, l, ic, e.pain != null && num(e.pain) === v, 1)).join("")],
      ["wohl", "Wohlbefinden", multi("symptoms", WB)],
      ["stimmung", "Stimmung", multi("moods", MOOD)],
      ["ausfluss", "Ausfluss", A.discharge.map(x => item("discharge", x.k, x.n, x.i || "💧", e.discharge === x.k, 1)).join("")],
      ["lh", "Ovulationstest", LH.map(([v, l, ic]) => item("lh", v, l, ic, e.lh === v, 1)).join("")],
      ["haut", "Haut & Haare", multi("skin", SKIN)],
      ["bewegung", "Bewegung", multi("move", MOVE)],
      ["essen", "Essen & Gelüste", multi("food", FOOD)],
      ["care", "Selfcare", multi("care", CARE)],
    ];
    const prev = addD(d, -1), next = addD(d, 1);
    return `<div class="zp-ed" lang="de">
      <div class="top"><div style="display:flex;justify-content:space-between;align-items:center"><button class="iconbtn" data-act="zpClose" aria-label="Schließen" style="font-size:1.1rem">✕</button>
        <div class="zp-date"><button data-act="zpEdit" data-d="${prev}" aria-label="Vortag">‹</button><b>${d === t ? "HEUTE" : WD[parseD(d).getDay()] + ", " + fmtS(d)}</b><button data-act="zpEdit" data-d="${next}" aria-label="Nächster Tag" ${next > t ? "disabled" : ""}>›</button></div><span style="width:36px"></span></div>
        <div><h2 style="margin:0;font-style:italic">Wie geht es dir?</h2><span class="zp-muted" style="font-size:.9rem">${st ? "Zyklustag " + st.cd + " · " + PH[st.phase].long : ""}</span></div>
        <div class="zp-cats">${secs.map(([id, n]) => `<button data-act="zpJump" data-s="${id}">${n.replace("Für dich vorgeschlagen", "Vorschläge")}</button>`).join("")}<button data-act="zpJump" data-s="mess">Messungen</button><button data-act="zpJump" data-s="buch">Tagebuch</button></div>
        <input class="zp-search" id="zpQ" type="search" placeholder="Suchen … z. B. Kopfschmerzen" aria-label="Einträge durchsuchen"></div>
      ${secs.map(([id, n, body]) => `<section class="zp-sec" id="zps-${id}"><h4>${n}</h4><div class="zp-grid">${body}</div></section>`).join("")}
      <section class="zp-sec" id="zps-mess"><h4>Messungen</h4><div style="display:flex;flex-direction:column;gap:10px">
        <label style="display:flex;align-items:center;gap:10px;justify-content:space-between"><span>🌡️ Basaltemperatur</span><input class="inp num" id="zpBbt" type="text" inputmode="decimal" placeholder="z. B. 36,45" value="${e.bbt ?? ""}" style="max-width:130px"></label>
        <p class="zp-muted" style="margin:0;font-size:.75rem">Morgens direkt nach dem Aufwachen messen, vor dem Aufstehen. Nach dem Eisprung steigt sie meist um etwa 0,2 bis 0,5 °C.</p>
        ${A.weightAct ? `<button class="zp-pill" style="align-self:flex-start;padding:9px 16px;font-size:.85rem" data-act="${A.weightAct}">⚖️ Gewicht eintragen</button>` : ""}</div></section>
      <section class="zp-sec" id="zps-buch"><h4>Tagebuch</h4><textarea class="inp" id="zpNote" placeholder="Nur für dich: Was war heute los?" style="min-height:90px;width:100%">${esc(e.note || "")}</textarea></section>
      <button class="zp-pill" data-act="zpClose" style="margin-top:4px">Fertig</button></div>`;
  }
  const num = v => +v || 0;

  window.ZP = { css, head, checkCard, impulseCard, tipsCard, triCard, hormoneCard, patternCard, accuracyCard, quoteCard, editor, patterns, patternText, TIPS, CAT, PH, tipFits, MULTI, addD, diffD, esc };

  // Tipp-Details & Alle Tipps
  ZP.tipSheet = (id) => { const t = TIPS.find(x => x[0] === id); if (!t) return ""; return `<div style="display:flex;flex-direction:column;gap:12px"><div style="display:flex;justify-content:space-between;align-items:center"><span class="zp-eyebrow">${CAT[t[1]]}</span><button class="iconbtn" data-act="zpClose" aria-label="Schließen">✕</button></div><div style="font-size:3rem;text-align:center">${t[3]}</div><h2 style="margin:0;text-align:center">${esc(t[4])}</h2><div class="zp-card"><b>Warum?</b><p style="margin:0;line-height:1.5">${esc(t[5])}</p></div><div class="zp-card"><b>So geht's</b><p style="margin:0;line-height:1.5">${esc(t[6])}</p></div><p class="zp-muted" style="margin:0;font-size:.75rem">Allgemeine Tipps, kein Ersatz für ärztlichen Rat.</p></div>`; };
  ZP.allTips = (ph, cat) => { const L = TIPS.filter(t => tipFits(t, ph) && (!cat || t[1] === cat)); return `<div style="display:flex;flex-direction:column;gap:12px"><div style="display:flex;justify-content:space-between;align-items:center"><h2 style="margin:0">Tipps · ${PH[ph].n}</h2><button class="iconbtn" data-act="zpClose" aria-label="Schließen">✕</button></div><div class="zp-cats"><button data-act="zpAllTips" data-c="" style="${!cat ? "border-color:var(--zp-gold,#d9b64e)" : ""}">Alle</button>${Object.entries(CAT).map(([k, n]) => `<button data-act="zpAllTips" data-c="${k}" style="${cat === k ? "border-color:var(--zp-gold,#d9b64e)" : ""}">${n}</button>`).join("")}</div><div class="zp-tips" lang="de">${L.map(t => `<button class="zp-tip" data-act="zpTip" data-id="${t[0]}"><i aria-hidden="true">${t[3]}</i><span>${esc(t[4])}</span></button>`).join("")}</div></div>`; };

  // Suche im Erfassen-Sheet (ohne Neuzeichnen)
  document.addEventListener("input", e => {
    if (e.target?.id !== "zpQ") return; const q = e.target.value.trim().toLowerCase(); const root = e.target.closest(".zp-ed"); if (!root) return;
    root.querySelectorAll(".zp-it").forEach(b => { b.style.display = !q || b.dataset.l.includes(q) ? "" : "none"; });
    root.querySelectorAll(".zp-sec").forEach(s => { const any = [...s.querySelectorAll(".zp-it")].some(b => b.style.display !== "none"); s.style.display = !q || any || (s.id === "zps-mess" && "basaltemperatur gewicht".includes(q)) || (s.id === "zps-buch" && "tagebuch notiz".includes(q)) ? "" : "none"; });
  }, true);
})();
