/* HER Cycle – Plattform-Adapter
   Ersetzt window.claude (Datenbank, Nutzer, Downloads) durch Supabase.
   Anmeldung: echtes Konto mit E-Mail und eigenem Passwort. */
(function () {
  "use strict";
  var SB_URL = "https://rlkpaldizdqfuveheaok.supabase.co";
  var SB_KEY = "sb_publishable_CPAyESmMi3odo4qzOBYU_w_HQYzwwLa";
  var TABLE = "hc_docs";
  var sb = window.supabase.createClient(SB_URL, SB_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: "hc-auth" }
  });

  var session = null, coach = false;

  function err(code, msg) { var e = new Error(msg || code); e.code = code; return e; }
  function mapErr(e) {
    if (!e) return e;
    var m = e.message || String(e);
    if (/row-level security|permission denied|violates/i.test(m)) return err("invalid_argument", m);
    return err(e.code || "error", m);
  }

  var ready = (async function () {
    session = (await sb.auth.getSession()).data.session;
    if (session && session.user && session.user.is_anonymous) { await sb.auth.signOut(); session = null; }
    if (session) {
      var r = await sb.rpc("hc_is_coach");
      coach = !!r.data;
      startRealtime();
    }
  })();

  /* ---------- Live-Aktualisierung ---------- */
  var listeners = new Set();
  function parentOf(p) { var i = p.lastIndexOf("/"); return i < 0 ? "" : p.slice(0, i); }
  function idOf(p) { return p.slice(p.lastIndexOf("/") + 1); }
  function notify(path) { listeners.forEach(function (l) { if (!path || l.match(path)) l.refresh(); }); }
  function refreshAll() { notify(null); }
  function startRealtime() {
    try {
      sb.channel("hc-docs").on("postgres_changes", { event: "*", schema: "public", table: TABLE }, function (pl) {
        var p = (pl.new && pl.new.path) || (pl.old && pl.old.path);
        if (p) notify(p); else refreshAll();
      }).subscribe();
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
      try { var r = await run(); if (alive) fn(r); } catch (e) { if (alive && onErr) onErr(e); }
      running = false;
      if (again) { again = false; go(); }
    }
    var l = { match: match, refresh: function () { clearTimeout(timer); timer = setTimeout(go, 150); } };
    listeners.add(l); go();
    return function () { alive = false; listeners.delete(l); };
  }

  /* ---------- Dokumente ---------- */
  function clone(d) { return d == null ? undefined : JSON.parse(JSON.stringify(d)); }
  function DocSnap(id, data) { this.id = id; this._d = data; this.exists = data != null; }
  DocSnap.prototype.data = function () { return clone(this._d); };
  function QuerySnap(docs) { this.docs = docs; this.size = docs.length; this.empty = !docs.length; }

  function DocRef(path) { this.path = path; this.id = idOf(path); }
  DocRef.prototype.get = async function () {
    await ready;
    var r = await sb.from(TABLE).select("data").eq("path", this.path).maybeSingle();
    if (r.error) throw mapErr(r.error);
    return new DocSnap(this.id, r.data ? r.data.data : null);
  };
  DocRef.prototype.set = async function (d) {
    await ready;
    var r = await sb.from(TABLE).upsert({ path: this.path, data: JSON.parse(JSON.stringify(d)) });
    if (r.error) throw mapErr(r.error);
    notify(this.path);
  };
  DocRef.prototype.delete = async function () {
    await ready;
    var r = await sb.from(TABLE).delete().eq("path", this.path);
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
    var q = sb.from(TABLE).select("id,data").eq("parent", this.path);
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
  var db = Object.freeze({ doc: function (p) { return new DocRef(p); }, collection: function (p) { return new Query(p); } });

  /* ---------- Nutzer ---------- */
  var user = Object.freeze({
    id: async function () { await ready; return session ? session.user.id : null; },
    isOwner: async function () { await ready; return coach; }
  });

  function authMsg(e) {
    var m = (e && e.message) || "";
    if (/invalid login credentials/i.test(m)) return "E-Mail oder Passwort stimmt nicht.";
    if (/already registered|already exists/i.test(m)) return "Mit dieser E-Mail gibt es schon ein Konto. Bitte melde dich an.";
    if (/password should be at least|weak password/i.test(m)) return "Das Passwort ist zu kurz (mindestens 8 Zeichen).";
    if (/email.*invalid|invalid.*email/i.test(m)) return "Bitte prüfe die E-Mail-Adresse.";
    if (/confirm/i.test(m)) return "Die E-Mail-Adresse muss erst bestätigt werden. Bitte gib Lisa-Marie Bescheid.";
    if (/rate limit|too many/i.test(m)) return "Zu viele Versuche. Bitte warte kurz.";
    if (/fetch|network/i.test(m)) return "Keine Verbindung. Bitte prüfe dein Internet.";
    return "Das hat nicht geklappt. Bitte versuch es noch einmal.";
  }
  window.HC = {
    signIn: async function (email, pw) {
      var r = await sb.auth.signInWithPassword({ email: email, password: pw });
      if (r.error) return { ok: false, msg: authMsg(r.error) };
      return { ok: true };
    },
    signUp: async function (email, pw) {
      var r = await sb.auth.signUp({ email: email, password: pw });
      if (r.error) return { ok: false, msg: authMsg(r.error) };
      if (!r.data.session) return { ok: false, msg: authMsg({ message: "confirm" }) };
      return { ok: true };
    },
    signOut: async function () { try { await sb.auth.signOut(); } catch (x) {} },
    email: function () { return session && session.user ? session.user.email : ""; },
    supabase: sb
  };

  /* ---------- Dateien speichern ---------- */
  var downloads = Object.freeze({
    save: async function (o) {
      var data = o.data, fn = o.filename || "download";
      var type = /\.csv$/i.test(fn) ? "text/csv;charset=utf-8" : /\.pdf$/i.test(fn) ? "application/pdf" : "application/octet-stream";
      var blob = data instanceof Blob ? data : new Blob([data], { type: type });
      try {
        var file = new File([blob], fn, { type: blob.type || type });
        if (navigator.canShare && navigator.canShare({ files: [file] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) { await navigator.share({ files: [file], title: fn }); return; }
      } catch (x) { if (x && x.name === "AbortError") throw err("cancelled"); }
      var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = fn;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    }
  });

  var caps = { db: db, user: user, downloads: downloads };
  window.claude = Object.freeze({
    use: async function (name) {
      if (!caps[name]) return null;
      try { await ready; } catch (e) { console.warn(e); if (name === "db") return null; }
      return caps[name];
    }
  });
})();
