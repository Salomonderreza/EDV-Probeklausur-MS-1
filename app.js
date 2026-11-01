/* =====================================================================
   PROBEKLAUSUR-ABLAUF: gleiche Oberfläche wie die echte Klausur, aber
   ohne Namen, ohne PDF-Bericht und ohne Fensterprotokoll. Nach der
   Abgabe gibt es sofort eine ausführliche Auswertung.
   ===================================================================== */
(() => {
  "use strict";
  const C = KL.CONFIG;
  const U = KL.util;
  const { esc } = U;
  const app = document.getElementById("app");
  const KEY = C.SPEICHER_SCHLUESSEL;
  const DAUER_MS = C.DAUER_MINUTEN * 60 * 1000;
  const SUMME = KL.AUFGABEN.reduce((s, t) => s + t.punkte, 0);

  let S = null;
  let destroySim = null;
  let timer = null;

  // ---------------- Speicherung ----------------
  function laden() {
    try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; }
  }
  let saveTimer = null;
  function speichern(sofort) {
    clearTimeout(saveTimer);
    const run = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
    if (sofort) run(); else saveTimer = setTimeout(run, 150);
  }

  function initAufgabe(task) {
    const rand = U.rng((S.seed + task.id.charCodeAt(0) * 131 + Number(task.id.slice(1)) * 7919) >>> 0);
    const st = task.sim.typ === "explorer" ? KL.fs.build(task.sim.def) : KL.sims[task.sim.typ].init(task.sim.def, rand);
    return { sim: st, antworten: {}, beruehrt: false };
  }

  function neuStarten() {
    S = { v: 1, seed: (Math.random() * 4294967296) >>> 0, start: Date.now(), ende: null, abgabeArt: null, aktuell: KL.AUFGABEN[0].id, aufgaben: {} };
    KL.AUFGABEN.forEach((t) => (S.aufgaben[t.id] = initAufgabe(t)));
    speichern(true);
    klausur();
  }

  // ---------------- Startseite ----------------
  function startseite() {
    app.innerHTML = `
      <div class="kl-start">
        <div class="kl-start-card">
          <div class="kl-kicker">Probeklausur</div>
          <h1>${esc(C.TITEL)}</h1>
          <p class="kl-sub">${esc(C.UNTERTITEL)}</p>
          <div class="kl-facts">
            <div><b>${C.DAUER_MINUTEN} Minuten</b><span>Bearbeitungszeit</span></div>
            <div><b>${SUMME} Punkte</b><span>${KL.AUFGABEN.length} Aufgaben in 2 Teilen</span></div>
            <div><b>Auswertung</b><span>sofort nach der Abgabe</span></div>
          </div>
          <p>Die Probeklausur sieht genauso aus und funktioniert genauso wie die echte Klausur. Die Aufgaben sind andere, prüfen aber dieselben Fähigkeiten. So lernst du den Ablauf kennen.</p>
          <ul class="kl-rules">
            <li>Wie in der echten Klausur gibt es <b>keine Erklärungen und keine Rückmeldung</b> während der Bearbeitung.</li>
            <li>Du kannst die Aufgaben in beliebiger Reihenfolge bearbeiten und bis zur Abgabe ändern.</li>
            <li>Nach der Abgabe siehst du genau, welche Teile richtig waren und welche nicht.</li>
            <li>Du kannst die Probeklausur so oft wiederholen, wie du möchtest.</li>
          </ul>
          <button type="button" class="kl-btn primary big" data-start>Probeklausur starten</button>
        </div>
      </div>`;
    app.querySelector("[data-start]").addEventListener("click", neuStarten);
  }

  // ---------------- Bearbeitung ----------------
  function klausur() {
    app.innerHTML = `
      <div class="kl-shell">
        <header class="kl-head">
          <div class="kl-head-title">${esc(C.TITEL)}</div>
          <div class="kl-head-who">Übungsmodus</div>
          <div class="kl-timer" title="Verbleibende Zeit">⏱ <span>--:--</span></div>
          <button type="button" class="kl-btn primary" data-abgeben>Abgeben</button>
        </header>
        <div class="kl-body">
          <aside class="kl-side"></aside>
          <main class="kl-main"></main>
        </div>
      </div>`;
    app.querySelector("[data-abgeben]").addEventListener("click", abgabeDialog);
    seitenleiste();
    zeigeAufgabe(S.aktuell);
    starteTimer();
  }

  const bearbeitet = (id) => S.aufgaben[id] && S.aufgaben[id].beruehrt;

  function seitenleiste() {
    const side = app.querySelector(".kl-side");
    side.innerHTML = KL.TEILE.map((teil) => {
      const tasks = KL.AUFGABEN.filter((t) => t.teil === teil.id);
      return `<div class="kl-part"><div class="kl-part-title">${esc(teil.titel)} <span>${tasks.reduce((s, t) => s + t.punkte, 0)} P.</span></div>
        ${tasks.map((t) => `<button type="button" class="kl-nav" data-id="${t.id}"><span class="kl-nav-id">${t.id}</span><span class="kl-nav-t">${esc(t.titel)}</span><span class="kl-nav-p">${t.punkte} P.</span></button>`).join("")}
      </div>`;
    }).join("") + `<div class="kl-legend"><span class="kl-dot done"></span> bearbeitet <span class="kl-dot"></span> noch nicht bearbeitet</div>`;
    side.querySelectorAll(".kl-nav").forEach((b) => b.addEventListener("click", () => zeigeAufgabe(b.dataset.id)));
  }
  function markiereNav() {
    app.querySelectorAll(".kl-nav").forEach((b) => {
      b.classList.toggle("active", b.dataset.id === S.aktuell);
      b.classList.toggle("done", !!bearbeitet(b.dataset.id));
    });
  }

  function zeigeAufgabe(id) {
    if (destroySim) { try { destroySim(); } catch (e) {} destroySim = null; }
    S.aktuell = id;
    speichern();
    const idx = KL.AUFGABEN.findIndex((t) => t.id === id);
    const task = KL.AUFGABEN[idx];
    const zustand = S.aufgaben[id];
    const main = app.querySelector(".kl-main");
    main.innerHTML = `
      <div class="kl-task-head"><div class="kl-task-kicker">Aufgabe ${task.id} · ${task.punkte} Punkte</div><h2>${esc(task.titel)}</h2></div>
      <ol class="kl-auftrag">${task.auftrag.map((a) => `<li>${a}</li>`).join("")}</ol>
      ${task.hinweis ? `<p class="kl-hinweis">${esc(task.hinweis)}</p>` : ""}
      <div class="kl-sim kl-sim-${task.sim.typ}"></div>
      ${(task.felder || []).length ? `<div class="kl-felder">${task.felder.map((f) => `
        <label class="kl-feld"><span>${esc(f.label)}</span><input data-feld="${f.id}" placeholder="${esc(f.platzhalter || "")}" value="${esc(zustand.antworten[f.id] || "")}" spellcheck="false" autocomplete="off" /></label>`).join("")}</div>` : ""}
      <div class="kl-task-foot">
        <button type="button" class="kl-btn ghost" data-reset>Aufgabe zurücksetzen</button>
        <span class="kl-spacer"></span>
        <button type="button" class="kl-btn" data-prev ${idx === 0 ? "disabled" : ""}>← Vorherige</button>
        <button type="button" class="kl-btn" data-next ${idx === KL.AUFGABEN.length - 1 ? "disabled" : ""}>Nächste →</button>
      </div>`;
    const ctx = {
      task,
      save() {
        if (!zustand.beruehrt) { zustand.beruehrt = true; markiereNav(); }
        speichern();
      },
    };
    destroySim = KL.sims[task.sim.typ].mount(main.querySelector(".kl-sim"), zustand.sim, ctx);
    main.querySelectorAll("[data-feld]").forEach((inp) => inp.addEventListener("input", () => {
      zustand.antworten[inp.dataset.feld] = inp.value;
      ctx.save();
    }));
    main.querySelector("[data-reset]").addEventListener("click", () => {
      modal(`Aufgabe ${task.id} auf den Anfangszustand zurücksetzen?`, [
        ["Zurücksetzen", () => {
          if (destroySim) { try { destroySim(); } catch (e) {} destroySim = null; }
          S.aufgaben[id] = initAufgabe(task);
          speichern(true);
          zeigeAufgabe(id);
        }, "danger"],
        ["Abbrechen"],
      ]);
    });
    main.querySelector("[data-prev]").addEventListener("click", () => zeigeAufgabe(KL.AUFGABEN[idx - 1].id));
    main.querySelector("[data-next]").addEventListener("click", () => zeigeAufgabe(KL.AUFGABEN[idx + 1].id));
    markiereNav();
    main.scrollTop = 0;
  }

  // ---------------- Timer ----------------
  function starteTimer() {
    clearInterval(timer);
    const el = app.querySelector(".kl-timer");
    const span = el.querySelector("span");
    const tick = () => {
      const rest = S.start + DAUER_MS - Date.now();
      if (rest <= 0) { clearInterval(timer); abgeben("zeit"); return; }
      span.textContent = `${U.pad(Math.floor(rest / 60000))}:${U.pad(Math.floor((rest % 60000) / 1000))}`;
      el.classList.toggle("warn", rest < 10 * 60000);
      el.classList.toggle("crit", rest < 5 * 60000);
    };
    tick();
    timer = setInterval(tick, 1000);
  }

  // ---------------- Abgabe & Auswertung ----------------
  function abgabeDialog() {
    const offen = KL.AUFGABEN.filter((t) => !bearbeitet(t.id)).map((t) => t.id);
    modal(`<b>Probeklausur jetzt abgeben?</b><br><br>Bearbeitet: ${KL.AUFGABEN.length - offen.length} von ${KL.AUFGABEN.length} Aufgaben.${offen.length ? `<br>Noch nicht bearbeitet: ${offen.join(", ")}` : ""}`, [
      ["Abgeben und auswerten", () => abgeben("manuell"), "primary"],
      ["Weiter bearbeiten"],
    ]);
  }

  function abgeben(art) {
    if (!S || S.ende) return;
    if (destroySim) { try { destroySim(); } catch (e) {} destroySim = null; }
    clearInterval(timer);
    S.ende = Math.min(Date.now(), S.start + DAUER_MS + 5000);
    S.abgabeArt = art;
    speichern(true);
    auswertung();
  }

  function ergebnis() {
    const tasks = KL.AUFGABEN.map((t) => ({ task: t, ...KL.bewerte(t, S.aufgaben[t.id]), beruehrt: bearbeitet(t.id) }));
    const punkte = tasks.reduce((s, t) => s + t.punkte, 0);
    const max = tasks.reduce((s, t) => s + t.max, 0);
    const prozent = Math.round((punkte / max) * 1000) / 10;
    return { tasks, punkte, max, prozent, note: U.note(prozent) };
  }

  function auswertung() {
    clearInterval(timer);
    const e = ergebnis();
    const minuten = Math.round((S.ende - S.start) / 60000);
    const teile = KL.TEILE.map((teil) => {
      const ts = e.tasks.filter((t) => t.task.teil === teil.id);
      return { titel: teil.titel, p: ts.reduce((s, t) => s + t.punkte, 0), m: ts.reduce((s, t) => s + t.max, 0), ts };
    });
    app.innerHTML = `
      <div class="pk-result">
        <div class="pk-hero">
          <div>
            <div class="kl-kicker">${S.abgabeArt === "zeit" ? "Zeit abgelaufen – automatisch abgegeben" : "Auswertung deiner Probeklausur"}</div>
            <h1>${U.fmtPunkte(e.punkte)} von ${e.max} Punkten <span>(${U.fmtPunkte(e.prozent)} %)</span></h1>
            <p class="kl-sub">Bearbeitungszeit: ${minuten} Minuten · ${teile.map((t) => `${esc(t.titel)}: ${U.fmtPunkte(t.p)}/${t.m}`).join(" · ")}</p>
          </div>
          <div class="pk-note"><span>Note</span><b>${e.note}</b></div>
        </div>
        <p class="pk-tipp">${e.prozent >= 80 ? "Sehr gut vorbereitet! Schau dir trotzdem die rot markierten Punkte an." : e.prozent >= 50 ? "Bestanden – mit den rot markierten Punkten kannst du dich noch verbessern. Übe sie gezielt in den Lern-Apps." : "Noch nicht bestanden. Übe die rot markierten Punkte gezielt in den Lern-Apps und versuche es dann noch einmal."}</p>
        ${teile.map((t) => `
          <h2 class="pk-part">${esc(t.titel)} <span>${U.fmtPunkte(t.p)} / ${t.m} P.</span></h2>
          <div class="pk-grid">${t.ts.map((x) => `
            <div class="pk-card ${x.punkte === x.max ? "voll" : x.punkte === 0 ? "null" : ""}">
              <div class="pk-card-head"><b>${x.task.id} ${esc(x.task.titel)}</b><span>${U.fmtPunkte(x.punkte)} / ${x.max}</span></div>
              ${x.beruehrt ? "" : '<p class="pk-leer">Nicht bearbeitet.</p>'}
              <ul>${x.kriterien.map((k) => `<li class="${k.ok ? "ok" : "no"}"><span>${k.ok ? "✓" : "✗"}</span>${esc(k.text.replace(/<[^>]+>/g, ""))}<em>${k.punkte}/${k.max}</em></li>`).join("")}</ul>
            </div>`).join("")}</div>`).join("")}
        <div class="pk-actions">
          <button type="button" class="kl-btn primary big" data-neu>Probeklausur neu starten</button>
          <button type="button" class="kl-btn big" data-print>Auswertung drucken</button>
        </div>
      </div>`;
    app.querySelector("[data-neu]").addEventListener("click", () => {
      modal("Neue Probeklausur starten? Diese Auswertung wird dabei gelöscht.", [["Neu starten", neuStarten, "primary"], ["Abbrechen"]]);
    });
    app.querySelector("[data-print]").addEventListener("click", () => window.print());
    window.scrollTo(0, 0);
  }

  // ---------------- Modaldialog ----------------
  function modal(html, buttons) {
    const ov = document.createElement("div");
    ov.className = "kl-modal";
    ov.innerHTML = `<div class="kl-modal-box"><div class="kl-modal-text">${html}</div><div class="kl-modal-btns">${buttons.map((b, i) => `<button type="button" class="kl-btn ${b[2] || ""}" data-i="${i}">${esc(b[0])}</button>`).join("")}</div></div>`;
    document.body.appendChild(ov);
    ov.querySelectorAll("[data-i]").forEach((b) => b.addEventListener("click", () => {
      ov.remove();
      const fn = buttons[+b.dataset.i][1];
      if (fn) fn();
    }));
    ov.querySelector("[data-i]").focus();
  }

  // ---------------- Start ----------------
  S = laden();
  if (S && S.v === 1 && S.aufgaben && KL.AUFGABEN.every((t) => S.aufgaben[t.id])) {
    if (!KL.AUFGABEN.some((t) => t.id === S.aktuell)) S.aktuell = KL.AUFGABEN[0].id;
    if (S.ende) auswertung();
    else if (Date.now() > S.start + DAUER_MS) abgeben("zeit");
    else klausur();
  } else {
    S = null;
    startseite();
  }
  KL.app = { ergebnis: () => ergebnis(), zustand: () => S };
})();
