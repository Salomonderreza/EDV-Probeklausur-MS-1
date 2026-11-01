/* =====================================================================
   KONFIGURATION DER PROBEKLAUSUR
   ===================================================================== */
window.KL = window.KL || {};

KL.CONFIG = {
  TITEL: "Probeklausur: Digitale Grundkompetenzen",
  UNTERTITEL: "Windows und Word-Textbearbeitung – zum Üben",

  // Bearbeitungszeit in Minuten (die echte Klausur dauert 90 Minuten)
  DAUER_MINUTEN: 45,

  // Gleicher Notenschlüssel wie in der Klausur — nur zur Orientierung
  NOTENSCHLUESSEL: [
    [95, "1,0"], [90, "1,3"], [85, "1,7"], [80, "2,0"], [75, "2,3"],
    [70, "2,7"], [65, "3,0"], [60, "3,3"], [55, "3,7"], [50, "4,0"],
    [20, "5,0"], [0, "6,0"],
  ],

  SPEICHER_SCHLUESSEL: "probeklausur-windows-word-v1",
};
