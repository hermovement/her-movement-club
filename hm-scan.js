/* Her Movement Club – Barcode-Scanner (Open Food Facts) */
(function () {
  "use strict";
  CONF.scan = ["Barcode", "good"];

  var stream = null, timer = null, overlay = null;

  function stopScan() {
    clearInterval(timer); timer = null;
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    if (overlay) { overlay.remove(); overlay = null; }
  }

  async function getDetector() {
    var formats = ["ean_13", "ean_8", "upc_a", "upc_e"];
    if ("BarcodeDetector" in window) {
      try {
        var sup = await window.BarcodeDetector.getSupportedFormats();
        if (sup.indexOf("ean_13") >= 0) return new window.BarcodeDetector({ formats: formats });
      } catch (x) {}
    }
    var mod = await import("https://cdn.jsdelivr.net/npm/barcode-detector@2/dist/es/pure.min.js");
    return new mod.BarcodeDetector({ formats: formats });
  }

  async function startScan() {
    if (!S.meal) return;
    overlay = document.createElement("div");
    overlay.className = "hm-scan";
    overlay.innerHTML = '<video playsinline muted></video><div class="hm-scan-frame"></div>' +
      '<p class="hm-scan-tip">Strichcode in den Rahmen halten</p>' +
      '<button class="btn" data-hm="close">Abbrechen</button>';
    document.body.appendChild(overlay);
    overlay.querySelector('[data-hm="close"]').onclick = stopScan;
    var video = overlay.querySelector("video");
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      video.srcObject = stream; await video.play();
      var det = await getDetector();
      var busy = false;
      timer = setInterval(async function () {
        if (busy || !stream) return; busy = true;
        try {
          var r = await det.detect(video);
          if (r && r.length && r[0].rawValue) {
            var code = r[0].rawValue;
            if (navigator.vibrate) navigator.vibrate(60);
            stopScan(); lookup(code);
          }
        } catch (x) {}
        busy = false;
      }, 250);
    } catch (e) {
      stopScan();
      S.meal.scanMsg = "Kamera nicht verfügbar. Erlaube den Kamerazugriff oder tippe die Nummer unter dem Strichcode ein.";
      drawSheet();
    }
  }

  function num1(v) { v = Number(v); return isFinite(v) ? Math.round(v * 10) / 10 : 0; }

  async function lookup(code) {
    code = String(code || "").replace(/\D/g, "");
    if (code.length < 8) { S.meal.scanMsg = "Bitte die ganze Nummer unter dem Strichcode eintippen (8 oder 13 Ziffern)."; drawSheet(); return; }
    // Schon einmal gescannt? → direkt aus „Meine Lebensmittel“, ohne Internet
    var known = null; Object.keys(S.foods || {}).forEach(function (id) { var f = S.foods[id]; if (f && f.code === code) known = f; });
    if (known) {
      S.meal.items.push(itemFromF([known.name, num(known.kcal), num(known.p), num(known.c), num(known.f), num(known.pg) || 100, known.plabel || "Portion", "mine", known.brand || ""], num(known.pg) || 100));
      if (!S.meal.name) S.meal.name = known.name; S.meal.scanMsg = ""; drawSheet(); toast(known.name + " hinzugefügt"); return;
    }
    S.meal.scanMsg = "Suche Produkt " + code + " …"; drawSheet();
    try {
      var res = await fetch("https://world.openfoodfacts.org/api/v2/product/" + code + ".json?fields=product_name,product_name_de,brands,nutriments,serving_quantity,serving_size");
      var j = await res.json();
      var p = j && j.status === 1 ? j.product : null;
      var n = p && p.nutriments;
      var kcal = n && (n["energy-kcal_100g"] != null ? n["energy-kcal_100g"] : n["energy_100g"] != null ? n["energy_100g"] / 4.184 : null);
      if (!p || kcal == null) {
        S.meal.scanMsg = "Produkt " + code + " ist in Open Food Facts nicht (vollständig) eingetragen. Trag es über „+ Eigenes Lebensmittel“ ein.";
        drawSheet(); return;
      }
      var name = (p.product_name_de || p.product_name || "Produkt " + code).trim();
      var brand = (p.brands || "").split(",")[0].trim();
      if (brand && name.toLowerCase().indexOf(brand.toLowerCase()) < 0) name += " (" + brand + ")";
      var sq = Number(p.serving_quantity) > 0 ? Math.round(Number(p.serving_quantity)) : 0;
      var it = {
        food: name, grams: sq || 100,
        per100: { kcal: Math.round(kcal), p: num1(n.proteins_100g), c: num1(n.carbohydrates_100g), f: num1(n.fat_100g) },
        conf: "scan", pg: sq || 100, plabel: sq ? (p.serving_size || "Portion") : "100 g"
      };
      rescale(it);
      S.meal.items.push(it);
      if (!S.meal.name) S.meal.name = name;
      S.meal.scanMsg = "";
      // Merken: landet in „Meine Lebensmittel“ und ist danach auch über die Suche findbar
      var saved = false;
      try {
        if (!S.mealCtx && S.uid) {
          var lname = name.toLowerCase(), dup = Object.keys(S.foods || {}).some(function (id) { return (S.foods[id].name || "").toLowerCase() === lname; });
          if (!dup) {
            var rec = { name: name, brand: brand, kcal: it.per100.kcal, p: it.per100.p, c: it.per100.c, f: it.per100.f, pg: sq || 100, plabel: it.plabel, code: code };
            var fid = uidGen(); S.foods = S.foods || {}; S.foods[fid] = rec; writeNow("members/" + S.uid + "/foods/" + fid, rec); saved = true;
          }
        }
      } catch (x) {}
      drawSheet(); toast(name + " hinzugefügt" + (saved ? " · für die Suche gemerkt" : ""));
    } catch (e) {
      S.meal.scanMsg = "Keine Verbindung zu Open Food Facts. Bitte später nochmal versuchen.";
      drawSheet();
    }
  }

  window.hmScanTop = function (m) {
    return '<div class="stack" style="gap:8px">' +
      '<button class="btn" data-act="hmScan">' + I.cam + ' Barcode scannen</button>' +
      '<div class="row" style="flex-wrap:nowrap"><input class="inp" id="hmEan" inputmode="numeric" placeholder="oder Nummer eintippen" autocomplete="off"><button class="btn small quiet" data-act="hmEanGo">Suchen</button></div>' +
      (m.scanMsg ? '<p class="small muted">' + esc(m.scanMsg) + '</p>' : "") +
      '<p class="tiny muted">Name und Nährwerte je 100 g kommen aus Open Food Facts. Die Menge kannst du danach anpassen.</p></div>';
  };

  window.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-act]"); if (!b) return;
    var a = b.dataset.act;
    if (a === "hmScan") { e.stopImmediatePropagation(); startScan(); }
    else if (a === "hmEanGo") { e.stopImmediatePropagation(); var v = (document.getElementById("hmEan") || {}).value; lookup(v); }
  }, true);
})();
