/* Her Movement Club – Plattform-Adapter
   Ersetzt window.claude (Datenbank, Nutzer, Uploads, Downloads, KI) durch Supabase
   bzw. eigene Funktionen. Die App selbst bleibt unverändert und ruft weiter
   claude.use("db") usw. auf. */
(function () {
  "use strict";
  var SB_URL = "https://rlkpaldizdqfuveheaok.supabase.co";
  var SB_KEY = "sb_publishable_CPAyESmMi3odo4qzOBYU_w_HQYzwwLa";
  var sb = window.supabase.createClient(SB_URL, SB_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: "hm-auth" }
  });

  var sessInfo = null; // { uid, role, key } nach Club-Anmeldung

  function err(code, msg) { var e = new Error(msg || code); e.code = code; return e; }
  function mapErr(e) {
    if (!e) return e;
    var m = e.message || String(e);
    if (/row-level security|permission denied|violates/i.test(m)) return err("invalid_argument", m);
    if (/Failed to fetch|NetworkError|network/i.test(m)) return err("network", m);
    return err(e.code || "error", m);
  }

  var ready = (async function () {
    try {
      if (localStorage.getItem("hm_ephemeral") === "1" && !sessionStorage.getItem("hm_alive")) {
        localStorage.removeItem("hm_ephemeral");
        try { await sb.rpc("club_logout"); } catch (x) {}
      }
    } catch (x) {}
    var s = (await sb.auth.getSession()).data.session;
    if (!s) {
      var r = await sb.auth.signInAnonymously();
      if (r.error) throw r.error;
    }
    var res = await sb.rpc("club_session");
    sessInfo = res.data || null;
    startRealtime();
  })();

  /* ---------- Live-Aktualisierung ---------- */
  var listeners = new Set();
  function parentOf(p) { var i = p.lastIndexOf("/"); return i < 0 ? "" : p.slice(0, i); }
  function idOf(p) { return p.slice(p.lastIndexOf("/") + 1); }
  function notify(path) { listeners.forEach(function (l) { if (!path || l.match(path)) l.refresh(); }); }
  function refreshAll() { notify(null); }

  function startRealtime() {
    try {
      sb.channel("hm-docs")
        .on("postgres_changes", { event: "*", schema: "public", table: "docs" }, function (pl) {
          var p = (pl.new && pl.new.path) || (pl.old && pl.old.path);
          if (p) notify(p); else refreshAll();
        })
        .subscribe();
    } catch (x) { console.warn(x); }
    document.addEventListener("visibilitychange", function () { if (!document.hidden) refreshAll(); });
    setInterval(function () { if (!document.hidden) refreshAll(); }, 60000);
  }

  function subscribe(match, run, fn, onErr) {
    var alive = true, timer = null, running = false, again = false;
    async function go() {
      if (!alive) return;
      if (running) { again = true; return; }
      running = true;
      try { var r = await run(); if (alive) fn(r); }
      catch (e) { if (alive && onErr) onErr(e); }
      running = false;
      if (again) { again = false; go(); }
    }
    var l = { match: match, refresh: function () { clearTimeout(timer); timer = setTimeout(go, 150); } };
    listeners.add(l); go();
    return function () { alive = false; listeners.delete(l); };
  }

  /* ---------- Dokumente (Firestore-ähnlich) ---------- */
  function clone(d) { return d == null ? undefined : JSON.parse(JSON.stringify(d)); }
  function DocSnap(id, data) { this.id = id; this._d = data; this.exists = data != null; }
  DocSnap.prototype.data = function () { return clone(this._d); };
  function QuerySnap(docs) { this.docs = docs; this.size = docs.length; this.empty = !docs.length; }

  function DocRef(path) { this.path = path; this.id = idOf(path); }
  DocRef.prototype.get = async function () {
    await ready;
    if (this.path === "club/config" && !(sessInfo && sessInfo.role === "coach")) {
      var pc = await sb.rpc("club_public_config");
      if (pc.error) throw mapErr(pc.error);
      return new DocSnap(this.id, pc.data);
    }
    var r = await sb.from("docs").select("data").eq("path", this.path).maybeSingle();
    if (r.error) throw mapErr(r.error);
    return new DocSnap(this.id, r.data ? r.data.data : null);
  };
  DocRef.prototype.set = async function (d) {
    await ready;
    var r = await sb.from("docs").upsert({ path: this.path, data: JSON.parse(JSON.stringify(d)) });
    if (r.error) throw mapErr(r.error);
    notify(this.path);
  };
  DocRef.prototype.delete = async function () {
    await ready;
    var r = await sb.from("docs").delete().eq("path", this.path);
    if (r.error) throw mapErr(r.error);
    notify(this.path);
  };
  DocRef.prototype.onSnapshot = function (fn, onErr) {
    var self = this;
    return subscribe(function (p) { return p === self.path; }, function () { return self.get(); }, fn, onErr);
  };

  var OPS = { "==": "eq", "!=": "neq", ">=": "gte", "<=": "lte", ">": "gt", "<": "lt" };
  function Query(path, f, o, l) { this.path = path; this.f = f || []; this.o = o || null; this.l = l || null; }
  Query.prototype.where = function (fl, op, v) { return new Query(this.path, this.f.concat([[fl, op, v]]), this.o, this.l); };
  Query.prototype.orderBy = function (fl, dir) { return new Query(this.path, this.f, [fl, dir || "asc"], this.l); };
  Query.prototype.limit = function (n) { return new Query(this.path, this.f, this.o, n); };
  Query.prototype.get = async function () {
    await ready;
    var q = sb.from("docs").select("id,data").eq("parent", this.path);
    this.f.forEach(function (w) {
      var m = OPS[w[1]]; if (!m) throw err("invalid_argument", "Operator " + w[1]);
      q = q[m]("data->>" + w[0], w[2]);
    });
    if (this.o) q = q.order("data->>" + this.o[0], { ascending: this.o[1] !== "desc" });
    q = q.limit(this.l || 5000);
    var r = await q;
    if (r.error) throw mapErr(r.error);
    return new QuerySnap(r.data.map(function (x) { return new DocSnap(x.id, x.data); }));
  };
  Query.prototype.onSnapshot = function (fn, onErr) {
    var self = this;
    return subscribe(function (p) { return parentOf(p) === self.path; }, function () { return self.get(); }, fn, onErr);
  };

  var db = Object.freeze({
    doc: function (p) { return new DocRef(p); },
    collection: function (p) { return new Query(p); }
  });

  /* ---------- Nutzer / Club-Anmeldung ---------- */
  var user = Object.freeze({
    id: async function () { await ready; return sessInfo ? sessInfo.uid : "pending"; },
    isOwner: async function () { await ready; return !!(sessInfo && sessInfo.role === "coach"); }
  });

  window.HM = {
    ready: ready,
    session: function () { return sessInfo; },
    login: async function (key, hash, remember) {
      await ready;
      var r = await sb.rpc("club_login", { p_key: key, p_hash: hash });
      if (r.error) return { ok: false, err: "network" };
      var d = r.data || {};
      if (d.ok) {
        sessInfo = { uid: d.uid, role: d.role, key: d.key };
        try {
          if (remember) localStorage.removeItem("hm_ephemeral");
          else { localStorage.setItem("hm_ephemeral", "1"); sessionStorage.setItem("hm_alive", "1"); }
        } catch (x) {}
        refreshAll();
      }
      return d;
    },
    logout: async function () {
      sessInfo = null;
      try { await sb.rpc("club_logout"); } catch (x) {}
      try { localStorage.removeItem("hm_ephemeral"); } catch (x) {}
      refreshAll();
    },
    supabase: sb
  };

  /* ---------- Bilder hochladen (nur Coach) ---------- */
  var assets = Object.freeze({
    upload: async function (blob) {
      await ready;
      var ext = (blob.type || "image/jpeg").split("/")[1] || "jpg";
      var name = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2)) + "." + ext.replace("jpeg", "jpg");
      var r = await sb.storage.from("assets").upload(name, blob, { contentType: blob.type || "image/jpeg", upsert: false });
      if (r.error) throw mapErr(r.error);
      return { id: sb.storage.from("assets").getPublicUrl(name).data.publicUrl };
    }
  });

  /* ---------- Dateien speichern ---------- */
  var downloads = Object.freeze({
    save: async function (o) {
      var data = o.data, fn = o.filename || "download";
      var type = /\.csv$/i.test(fn) ? "text/csv;charset=utf-8" : /\.pdf$/i.test(fn) ? "application/pdf" : /\.json$/i.test(fn) ? "application/json" : "application/octet-stream";
      var blob = data instanceof Blob ? data : new Blob([data], { type: type });
      try {
        var file = new File([blob], fn, { type: blob.type || type });
        if (navigator.canShare && navigator.canShare({ files: [file] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
          await navigator.share({ files: [file], title: fn });
          return;
        }
      } catch (x) { if (x && x.name === "AbortError") throw err("cancelled"); }
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = fn;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    }
  });

  /* ---------- KI-Schätzung über die eigene Claude-App (Weg 2) ---------- */
  function extractJson(t) {
    t = String(t || "").replace(/```(?:json)?/gi, "").trim();
    var s = -1, open = "", close = "";
    for (var i = 0; i < t.length; i++) { if (t[i] === "{" || t[i] === "[") { s = i; open = t[i]; close = open === "{" ? "}" : "]"; break; } }
    if (s < 0) throw err("invalid_json");
    var e = t.lastIndexOf(close);
    if (e <= s) throw err("invalid_json");
    try { return JSON.parse(t.slice(s, e + 1)); } catch (x) { throw err("invalid_json"); }
  }
  function escH(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function askClaude(prompt, opts) {
    var images = (opts && opts.images) || [];
    var full = prompt + "\n\nWichtig: Antworte ausschließlich mit dem JSON, ohne Erklärung davor oder danach.";
    return new Promise(function (resolve, reject) {
      var el = document.createElement("div");
      el.className = "hm-ai";
      el.innerHTML =
        '<div class="hm-ai-box" role="dialog" aria-modal="true">' +
        '<h3>Mit Claude schätzen</h3>' +
        '<ol class="small">' +
        (images.length
          ? '<li>Tippe auf <b>An Claude senden</b> und wähle die Claude-App. ' + (images.length > 1 ? "Die Fotos" : "Das Foto") + ' und der Auftrag werden mitgeschickt.</li>'
          : '<li>Tippe auf <b>An Claude senden</b>. Der Auftrag wird kopiert und Claude öffnet sich.</li>') +
        '<li>Falls der Text in Claude fehlt: ins Eingabefeld tippen, <b>Einfügen</b> und senden.</li>' +
        '<li>Kopiere die Antwort von Claude und füge sie unten ein.</li>' +
        '</ol>' +
        '<div class="row"><button class="btn" data-hm="send">An Claude senden</button><button class="btn small quiet" data-hm="copy">Nur Auftrag kopieren</button>' +
        (images.length ? '<button class="btn small quiet" data-hm="save">Foto speichern</button>' : "") + '</div>' +
        '<p class="tiny muted" data-hm="msg"></p>' +
        '<textarea class="inp" data-hm="ans" placeholder="Antwort von Claude hier einfügen" style="min-height:110px"></textarea>' +
        '<div class="row"><button class="btn small quiet" data-hm="paste">Aus Zwischenablage einfügen</button></div>' +
        '<p class="small" data-hm="err" style="color:var(--warn)"></p>' +
        '<div class="row"><button class="btn ghost" data-hm="cancel">Abbrechen</button><button class="btn" style="flex:1" data-hm="ok">Übernehmen</button></div>' +
        '</div>';
      document.body.appendChild(el);
      var $ = function (k) { return el.querySelector('[data-hm="' + k + '"]'); };
      var msg = function (t) { $("msg").textContent = t; };
      async function copy() {
        try { await navigator.clipboard.writeText(full); msg("Auftrag kopiert."); return true; }
        catch (x) { msg("Kopieren ging nicht automatisch."); return false; }
      }
      function files() {
        return images.map(function (b, i) { return new File([b], "mahlzeit-" + (i + 1) + ".jpg", { type: b.type || "image/jpeg" }); });
      }
      el.addEventListener("click", async function (e) {
        var b = e.target.closest("[data-hm]"); if (!b) return;
        var k = b.getAttribute("data-hm");
        if (k === "copy") copy();
        else if (k === "send") {
          await copy();
          var fs = files();
          if (fs.length && navigator.canShare && navigator.canShare({ files: fs })) {
            try { await navigator.share({ files: fs, text: full }); } catch (x) {}
          } else if (!fs.length && navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
            try { await navigator.share({ text: full }); } catch (x) {}
          } else {
            window.open("https://claude.ai/new", "_blank");
            if (fs.length) msg("Auftrag kopiert. Hänge das Foto in Claude an (vorher mit „Foto speichern“ sichern).");
          }
        } else if (k === "save") {
          files().forEach(function (f) { var a = document.createElement("a"); a.href = URL.createObjectURL(f); a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); });
        } else if (k === "paste") {
          try { $("ans").value = await navigator.clipboard.readText(); } catch (x) { msg("Bitte lange ins Feld tippen und „Einfügen“ wählen."); }
        } else if (k === "cancel") { el.remove(); reject(err("cancelled")); }
        else if (k === "ok") {
          try { var j = extractJson($("ans").value); el.remove(); resolve(j); }
          catch (x) { $("err").textContent = "Das sieht nicht nach der Antwort von Claude aus. Bitte die ganze Antwort einfügen."; }
        }
      });
    });
  }
  var sample = Object.freeze({
    json: function (prompt, opts) { return askClaude(prompt, opts); },
    limits: async function () { return { images: { maxCount: 4 } }; }
  });

  var caps = { db: db, user: user, assets: assets, downloads: downloads, sample: sample };
  window.claude = Object.freeze({
    use: async function (name) {
      if (!caps[name]) return null;
      try { await ready; } catch (e) { console.warn(e); if (name === "db" || name === "user") return null; }
      return caps[name];
    }
  });
})();
