/* =====================================================================
   PROBEKLAUSUR — Teil A (Windows, 25 P.) und Teil B (Word, 25 P.)
   Andere Inhalte als in der echten Klausur, gleiche Aufgabentypen.
   Jede Aufgabe: id, teil, titel, auftrag[], sim {typ, def}, felder[]
   (optionale Antwortfelder), kriterien[] mit Punkten.
   Ein Kriterium hat entweder pruefe(simZustand, antworten) → true/false
   oder live(kontext) → true/false (wird während der Bearbeitung geprüft
   und gespeichert, sobald es einmal erfüllt war — z. B. Markierungen).
   ===================================================================== */
window.KL = window.KL || {};

(() => {
  "use strict";
  const { norm, simple } = KL.util;
  const fs = KL.fs;
  const D = fs.datei, Z = fs.zip;

  // Vergleich, der Leerzeichen-Kleinigkeiten verzeiht (doppelt, vor
  // Satzzeichen, am Rand)
  const glatt = (t) => norm(t).replace(/\s+/g, " ").replace(/ +([.,!?:;])/g, "$1").trim();
  const gleich = (a, b) => glatt(a) === glatt(b);
  const ohneLeer = (t) => norm(t).replace(/\s+/g, "");
  const text = (st) => glatt(st.absaetze.join("\n"));
  const zeilen = (st) => st.absaetze.map(glatt).filter(Boolean);
  const hatZeile = (st, z) => zeilen(st).some((x) => x === glatt(z));
  const offen = (st, app) => st.fenster[app] && st.fenster[app].offen;

  // Sucht im Teilbaum unter "pfad" nach einem Element mit diesem Namen
  function unter(state, pfad, name) {
    const start = fs.findPath(state, pfad);
    if (!start) return false;
    const walk = (id) => {
      const n = state.nodes[id];
      if (!n) return false;
      if (n.name === name && n.id !== start.id) return true;
      return (n.kinder || []).some(walk);
    };
    return walk(start.id);
  }
  const istOrdner = (state, pfad) => { const n = fs.findPath(state, pfad); return !!n && n.typ === "ordner"; };

  const A = [];
  const B = [];

  /* ================================================================
     TEIL A — WINDOWS
     ================================================================ */

  A.push({
    id: "A1", teil: "A", titel: "Fenster und Taskleiste",
    auftrag: [
      "Öffne <b>Paint</b> über das Startmenü.",
      "Minimiere den <b>Editor</b>. Er soll geöffnet bleiben.",
      "Hole <b>Microsoft Edge</b> über die Taskleiste zurück auf den Bildschirm.",
      "Schließe den <b>Rechner</b>.",
      "Lies die Uhrzeit in der Taskleiste ab und trage sie unten ein.",
    ],
    sim: { typ: "fenster", def: { uhr: "14:25", fenster: [
      { app: "edge", zustand: "min", x: 40, y: 20 },
      { app: "editor", zustand: "normal", x: 30, y: 30 },
      { app: "rechner", zustand: "normal", x: 300, y: 60 },
    ] } },
    felder: [{ id: "uhr", label: "Uhrzeit laut Taskleiste:", platzhalter: "z. B. 08:15" }],
    kriterien: [
      { text: "Paint über das Startmenü geöffnet", punkte: 1, pruefe: (s) => offen(s, "paint") && s.startGeoeffnet.includes("paint") },
      { text: "Editor minimiert (noch geöffnet)", punkte: 1, pruefe: (s) => offen(s, "editor") && s.fenster.editor.min },
      { text: "Microsoft Edge wieder sichtbar", punkte: 1, pruefe: (s) => offen(s, "edge") && !s.fenster.edge.min },
      { text: "Rechner geschlossen", punkte: 1, pruefe: (s) => !offen(s, "rechner") },
      { text: "Uhrzeit richtig abgelesen (14:25)", punkte: 1, pruefe: (s, a) => /^14\s*[:.]\s*25(\s*uhr)?$/i.test((a.uhr || "").trim()) },
    ],
  });

  A.push({
    id: "A2", teil: "A", titel: "Ordner und Dateien verwalten",
    auftrag: [
      "Erstelle im Ordner „Schule“ einen neuen Ordner mit dem Namen <b>Deutsch</b>.",
      "Verschiebe <b>Bild1.png</b> und <b>Bild2.png</b> in den Ordner <b>Fotos</b>.",
      "Benenne „Notiz.txt“ in <b>Hausaufgaben.txt</b> um.",
      "Lösche die Datei <b>Alt.docx</b>.",
      "Stelle die Datei <b>Lesetagebuch.docx</b> aus dem Papierkorb wieder her.",
    ],
    sim: { typ: "explorer", def: {
      start: "Dokumente/Schule",
      dokumente: { Schule: { Fotos: {}, "Referat.docx": null, "Bild1.png": null, "Bild2.png": null, "Notiz.txt": null, "Alt.docx": null } },
      papierkorb: { "Lesetagebuch.docx": { von: "Dokumente/Schule", inhalt: null }, "Werbung.pdf": { von: "Downloads", inhalt: null } },
    } },
    kriterien: [
      { text: "Ordner Deutsch erstellt", punkte: 1, pruefe: (s) => istOrdner(s, "Dokumente/Schule/Deutsch") },
      { text: "Bild1.png im Ordner Fotos", punkte: 1, pruefe: (s) => fs.existiert(s, "Dokumente/Schule/Fotos/Bild1.png") && !fs.existiert(s, "Dokumente/Schule/Bild1.png") },
      { text: "Bild2.png im Ordner Fotos", punkte: 1, pruefe: (s) => fs.existiert(s, "Dokumente/Schule/Fotos/Bild2.png") && !fs.existiert(s, "Dokumente/Schule/Bild2.png") },
      { text: "Notiz.txt in Hausaufgaben.txt umbenannt", punkte: 2, pruefe: (s) => fs.existiert(s, "Dokumente/Schule/Hausaufgaben.txt") && !fs.existiert(s, "Dokumente/Schule/Notiz.txt") },
      { text: "Alt.docx gelöscht", punkte: 1, pruefe: (s) => !unter(s, "Dokumente", "Alt.docx") },
      { text: "Lesetagebuch.docx wiederhergestellt", punkte: 1, pruefe: (s) => unter(s, "Dokumente", "Lesetagebuch.docx") },
    ],
  });

  A.push({
    id: "A3", teil: "A", titel: "Navigieren, sortieren, suchen",
    auftrag: [
      "Öffne die Datei <b>Rechnung_Mai.pdf</b>. Sie liegt hier: Dokumente › Privat › Rechnungen.",
      "Sortiere die Dateien im Ordner „Downloads“ nach <b>Änderungsdatum</b>, sodass die <b>neueste Datei ganz oben</b> steht.",
      "Welche Datei im Ordner „Downloads“ ist die neueste? Trage ihren Namen unten ein.",
      "In welchem Ordner liegt die Datei <b>Rezept_Kuchen.docx</b>? Trage den Namen dieses Ordners unten ein.",
    ],
    sim: { typ: "explorer", def: {
      start: "",
      dokumente: {
        Privat: { Rechnungen: { "Rechnung_April.pdf": null, "Rechnung_Mai.pdf": null }, Hobbys: { Backen: { "Rezept_Kuchen.docx": null, "Rezept_Brot.docx": null } } },
        Schule: { "Stundenplan.pdf": null },
      },
      downloads: {
        "Flyer_Schulfest.pdf": D(320, "12.10.2026 09:15"),
        "Musik_Probe.mp3": D(5100, "03.09.2026 17:40"),
        "Anmeldung_Sportverein.pdf": D(140, "27.10.2026 19:05"),
        "Foto_Klasse.jpg": D(2800, "18.09.2026 12:30"),
        "Vokabeln.xlsx": D(22, "21.10.2026 08:10"),
      },
    } },
    felder: [
      { id: "neueste", label: "Neueste Datei in „Downloads“:", platzhalter: "Dateiname" },
      { id: "ordner", label: "Ordner von „Rezept_Kuchen.docx“:", platzhalter: "Ordnername" },
    ],
    kriterien: [
      { text: "Rechnung_Mai.pdf geöffnet", punkte: 2, pruefe: (s) => s.geoeffnet.includes("Dokumente/Privat/Rechnungen/Rechnung_Mai.pdf") },
      { text: "Nach Änderungsdatum sortiert, neueste oben", punkte: 1, pruefe: (s) => s.sort.key === "datum" && s.sort.dir === -1 },
      { text: "Neueste Datei richtig benannt (Anmeldung_Sportverein.pdf)", punkte: 1, pruefe: (s, a) => /^anmeldung_sportverein(\.pdf)?$/i.test((a.neueste || "").trim()) },
      { text: "Ordner richtig angegeben (Backen)", punkte: 1, pruefe: (s, a) => /^(.*[\\/›>]\s*)?backen$/i.test((a.ordner || "").trim()) },
    ],
  });

  A.push({
    id: "A4", teil: "A", titel: "Speichern unter",
    auftrag: [
      "Öffne in Word über das Menü <b>Datei</b> den Dialog <b>Speichern unter</b>.",
      "Speichere das Dokument im Ordner <b>Dokumente › Schule</b>.",
      "Dateiname: <b>Referat_Klima</b> — Dateityp: <b>PDF</b>.",
    ],
    sim: { typ: "speichern", def: {
      dokName: "Dokument1",
      text: ["Referat: Klimawandel", "1. Was ist der Treibhauseffekt?", "2. Folgen für Deutschland", "3. Was kann ich tun?"],
      fs: { dokumente: { Schule: { "Stundenplan.pdf": null }, Privat: {}, Bewerbungen: {} }, desktop: {}, downloads: {} },
    } },
    kriterien: [
      { text: "Dateiname Referat_Klima", punkte: 2, pruefe: (s) => !!s.gespeichert && s.gespeichert.name.replace(/\.(pdf|docx?)$/i, "").trim() === "Referat_Klima" },
      { text: "Gespeichert im Ordner Dokumente › Schule", punkte: 1, pruefe: (s) => !!s.gespeichert && s.gespeichert.ordner === "Dokumente/Schule" },
      { text: "Dateityp PDF gewählt", punkte: 1, pruefe: (s) => !!s.gespeichert && /pdf/i.test(s.gespeichert.typ) },
    ],
  });

  const QUIZ = [
    { id: "q1", text: "Welche Art von Datei ist „Vortrag.pptx“?", richtig: "a", optionen: [
      { id: "a", text: "Eine Präsentation (PowerPoint)" }, { id: "b", text: "Eine Tabelle (Excel)" }, { id: "c", text: "Ein Bild" }, { id: "d", text: "Eine Musikdatei" }] },
    { id: "q2", text: "Warum solltest du einen USB-Stick vor dem Abziehen „sicher entfernen“?", richtig: "a", optionen: [
      { id: "a", text: "Damit keine Daten verloren gehen oder beschädigt werden" }, { id: "b", text: "Damit der Stick schneller wird" },
      { id: "c", text: "Damit die Dateien gelöscht werden" }, { id: "d", text: "Das ist nie nötig" }] },
    { id: "q3", text: "Du bekommst eine SMS: „Ihr Paket wartet. Zahlen Sie 1,99 € Zollgebühr über diesen Link.“ Was machst du?", richtig: "a", optionen: [
      { id: "a", text: "Nicht auf den Link klicken und die SMS löschen" }, { id: "b", text: "Schnell bezahlen, damit das Paket kommt" },
      { id: "c", text: "Den Link an Freunde weiterleiten" }, { id: "d", text: "Mit den Bankdaten antworten" }] },
    { id: "q4", text: "Wo landen Dateien, die du aus dem Internet herunterlädst, normalerweise?", richtig: "a", optionen: [
      { id: "a", text: "Im Ordner „Downloads“" }, { id: "b", text: "Im Papierkorb" }, { id: "c", text: "Auf dem USB-Stick" }, { id: "d", text: "Im Ordner „Musik“" }] },
  ];
  A.push({
    id: "A5", teil: "A", titel: "Wissensfragen",
    auftrag: ["Wähle bei jeder Frage die <b>eine</b> richtige Antwort aus."],
    sim: { typ: "quiz", def: { fragen: QUIZ } },
    kriterien: QUIZ.map((q, i) => ({ text: `Frage ${i + 1}: ${q.text}`, punkte: 1, pruefe: (s) => s.antworten[q.id] === q.richtig })),
  });

  /* ================================================================
     TEIL B — WORD-TEXTBEARBEITUNG
     ================================================================ */

  const B1_TEXT = ["Das Sportfest findet in der Turnhalle statt.", "Die Anmeldung endet am nächsten Dienstag um 12 Uhr.", "Bitte meldet euch rechtzeitig an."];
  B.push({
    id: "B1", teil: "B", titel: "Markieren mit Maus und Tastatur",
    auftrag: [
      "Markiere das Wort <b>Turnhalle</b> mit einem <b>Doppelklick</b>.",
      "Markiere den gesamten <b>zweiten Absatz</b> mit einem <b>Dreifachklick</b>.",
      "Setze den Cursor vor „nächsten“. Markiere mit <b>Strg + Umschalt + Pfeil rechts</b> genau die Wörter <b>nächsten Dienstag</b>.",
      "Setze den Cursor vor „rechtzeitig“. Markiere mit <b>Umschalt + Ende</b> den Rest der Zeile.",
      "Markiere mit <b>Strg + A</b> den gesamten Text.",
    ],
    sim: { typ: "word", def: { dokName: "Sportfest", absaetze: B1_TEXT } },
    kriterien: [
      { text: "„Turnhalle“ mit der Maus markiert", punkte: 1, live: (c) => c.methode === "maus" && glatt(c.markiert) === "Turnhalle" },
      { text: "Zweiten Absatz mit der Maus markiert", punkte: 1, live: (c) => c.methode === "maus" && glatt(c.markiert) === glatt(B1_TEXT[1]) },
      { text: "„nächsten Dienstag“ mit der Tastatur markiert", punkte: 1, live: (c) => c.methode === "tastatur" && glatt(c.markiert) === "nächsten Dienstag" },
      { text: "„rechtzeitig an.“ mit der Tastatur markiert", punkte: 1, live: (c) => c.methode === "tastatur" && glatt(c.markiert) === "rechtzeitig an." },
      { text: "Gesamten Text mit der Tastatur markiert", punkte: 1, live: (c) => c.methode === "tastatur" && glatt(c.markiert) === glatt(c.text) && c.text.length > 20 },
    ],
  });

  const B2_ZIEL = ["Hallo zusammen,", "das Fußballtraining fällt am Freitag leider aus.", "Wir trainieren stattdessen am Samstag um 11 Uhr. Bitte bringt Wasser mit.", "Euer Trainerteam"].join("\n");
  B.push({
    id: "B2", teil: "B", titel: "Praxisaufgabe: Nachricht korrigieren",
    auftrag: [
      "Korrigiere „Fussballtraining“ zu <b>Fußballtraining</b>.",
      "Korrigiere „trainiern“ zu <b>trainieren</b>.",
      "Lösche das doppelte <b>am</b>.",
      "Ersetze „10 Uhr“ durch <b>11 Uhr</b>.",
      "Ergänze am Ende des dritten Absatzes den Satz: <b>Bitte bringt Wasser mit.</b> (mit einem Leerzeichen davor)",
      "Füge am Ende eine <b>neue Zeile</b> (Enter) mit dem Text <b>Euer Trainerteam</b> hinzu.",
    ],
    sim: { typ: "word", def: { dokName: "Nachricht Training", absaetze: ["Hallo zusammen,", "das Fussballtraining fällt am Freitag leider aus.", "Wir trainiern stattdessen am am Samstag um 10 Uhr."] } },
    kriterien: [
      { text: "„Fußballtraining“ korrigiert", punkte: 1, pruefe: (s) => /das Fußballtraining/.test(text(s)) },
      { text: "„trainieren“ korrigiert", punkte: 1, pruefe: (s) => /Wir trainieren/.test(text(s)) },
      { text: "Doppeltes „am“ gelöscht", punkte: 1, pruefe: (s) => /stattdessen am Samstag/.test(text(s)) },
      { text: "„11 Uhr“ eingetragen", punkte: 1, pruefe: (s) => /um 11 Uhr/.test(text(s)) && !/10 Uhr/.test(text(s)) },
      { text: "Satz „Bitte bringt Wasser mit.“ ergänzt", punkte: 1, pruefe: (s) => /Uhr\. Bitte bringt Wasser mit\./.test(text(s)) },
      { text: "Neue Zeile „Euer Trainerteam“ am Ende", punkte: 1, pruefe: (s) => { const z = zeilen(s); return z[z.length - 1] === "Euer Trainerteam"; } },
      { text: "Endfassung vollständig korrekt", punkte: 2, pruefe: (s) => gleich(s.absaetze.join("\n"), B2_ZIEL) },
    ],
  });

  const B3_START = "Das Buch ist sehr spannend.";
  B.push({
    id: "B3", teil: "B", titel: "Rückgängig und Wiederholen",
    auftrag: [
      "Lösche das Wort <b>sehr</b>.",
      "Mache das Löschen mit <b>Rückgängig (Strg + Z)</b> rückgängig, sodass „sehr“ wieder dasteht.",
      "Stelle das Löschen mit <b>Wiederholen (Strg + Y)</b> wieder her, sodass „sehr“ wieder fehlt.",
      "Ergänze am Ende den Satz: <b>Ich empfehle es weiter.</b> (mit einem Leerzeichen davor)",
    ],
    sim: { typ: "word", def: { dokName: "Buchtipp", absaetze: [B3_START] } },
    kriterien: [
      { text: "„sehr“ gelöscht", punkte: 1, pruefe: (s) => s.verlauf.some((t) => glatt(t) === "Das Buch ist spannend.") },
      { text: "Mit Rückgängig wiederhergestellt", punkte: 1, pruefe: (s) => {
        const v = s.verlauf.map(glatt); const i = v.indexOf("Das Buch ist spannend.");
        return s.zaehler.rueckgaengig > 0 && i >= 0 && v.slice(i + 1).includes(glatt(B3_START));
      } },
      { text: "Mit Wiederholen erneut gelöscht", punkte: 1, pruefe: (s) => {
        const v = s.verlauf.map(glatt); const i = v.indexOf("Das Buch ist spannend."); const j = v.indexOf(glatt(B3_START), i + 1);
        return s.zaehler.wiederholen > 0 && i >= 0 && j > i && v.slice(j + 1).some((t) => /^Das Buch ist spannend\./.test(t));
      } },
      { text: "Endtext korrekt", punkte: 2, pruefe: (s) => gleich(s.absaetze.join("\n"), "Das Buch ist spannend. Ich empfehle es weiter.") },
    ],
  });

  B.push({
    id: "B4", teil: "B", titel: "Ausschneiden, Kopieren, Einfügen",
    auftrag: [
      "Verschiebe mit <b>Ausschneiden und Einfügen</b> den Ausdruck „um 18 Uhr“. Der erste Satz soll lauten: <b>Morgen gehen wir um 18 Uhr ins Kino.</b>",
      "Kopiere <b>B104</b> aus der zweiten Zeile und füge es am Ende der dritten und vierten Zeile ein (jeweils mit einem Leerzeichen nach dem Doppelpunkt).",
    ],
    sim: { typ: "word", def: { dokName: "Termine", absaetze: ["Morgen gehen wir ins Kino um 18 Uhr.", "Raum: B104", "Montag – Raum:", "Mittwoch – Raum:"] } },
    kriterien: [
      { text: "Erster Satz richtig umgestellt", punkte: 2, pruefe: (s) => hatZeile(s, "Morgen gehen wir um 18 Uhr ins Kino.") },
      { text: "Ausschneiden und Einfügen verwendet", punkte: 1, pruefe: (s) => s.zaehler.ausschneiden >= 1 && s.zaehler.einfuegen >= 1 },
      { text: "Dritte Zeile ergänzt", punkte: 1, pruefe: (s) => s.absaetze.some((z) => ohneLeer(z) === ohneLeer("Montag – Raum: B104")) },
      { text: "Vierte Zeile ergänzt", punkte: 1, pruefe: (s) => s.absaetze.some((z) => ohneLeer(z) === ohneLeer("Mittwoch – Raum: B104")) },
      { text: "Kopieren verwendet", punkte: 1, pruefe: (s) => s.zaehler.kopieren >= 1 && s.zaehler.einfuegen >= 2 },
      { text: "Zweite Zeile unverändert", punkte: 1, pruefe: (s) => s.absaetze.some((z) => ohneLeer(z) === ohneLeer("Raum: B104")) },
    ],
  });
  // Punkte je Aufgabe aus den Kriterien ableiten
  [...A, ...B].forEach((t) => (t.punkte = t.kriterien.reduce((s, k) => s + k.punkte, 0)));

  KL.AUFGABEN = [...A, ...B];
  KL.TEILE = [
    { id: "A", titel: "Teil A · Windows" },
    { id: "B", titel: "Teil B · Word-Textbearbeitung" },
  ];

  // Bewertung einer Aufgabe aus ihrem gespeicherten Zustand
  // Nie bearbeitete Aufgaben ergeben 0 Punkte (auch Kriterien wie „Zeile
  // bleibt unverändert“ zählen nur, wenn die Aufgabe bearbeitet wurde).
  KL.bewerte = function (task, zustand) {
    const sim = zustand && zustand.beruehrt ? zustand.sim : null;
    const antw = (zustand && zustand.antworten) || {};
    const kriterien = task.kriterien.map((k, i) => {
      let ok = false;
      if (sim) {
        try { ok = k.live ? !!(sim.erreicht && sim.erreicht[i]) : !!k.pruefe(sim, antw); } catch (e) { ok = false; }
      }
      return { text: k.text, max: k.punkte, punkte: ok ? k.punkte : 0, ok };
    });
    return { punkte: kriterien.reduce((s, k) => s + k.punkte, 0), max: task.punkte, kriterien };
  };
})();
