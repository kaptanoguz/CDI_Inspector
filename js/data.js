/* ═══════════════════════════════════════════════════════════════════════
   CDI Inspector — core data

   The checklist uses the official CDI Ship Inspection Report (SIR) 10th
   Edition question numbers. Three sources are combined into ITEMS:

     js/cdi/core.js    generated from the CDI booklets (tools/import_cdi.py):
                       official statement, Cat, Gp, guidance notes, page
     js/proc/*.js      the company SQEMS procedures, written from the
                       manuals (B1–B7, MSMP). Each is defined with
                         S(key, ranks, highRisk, trTitle, company, [en guide], [tr guide])
                       and keyed by the topic it was first written for.
     js/cdi/map-*.js   per CDI question: Turkish title, ranks and the
                       company procedure(s) that answer it
                         D(ranks)  ·  M(no, trTitle, "key key", ranks?)

   Cat: S statutory · R recommended · D desirable · NS non-scoring
   Gp:  SI self-inspection · I inspection
   Rank groups: DECK = MS CO 2O 3O · ENG = CE 2E ETO · OFF = both · ALL
   ═══════════════════════════════════════════════════════════════════════ */

const RANKS = [
    { id: "MS",  dept: "deck",   en: "Master",            tr: "Kaptan",              short: "MSTR" },
    { id: "CO",  dept: "deck",   en: "Chief Officer",     tr: "Birinci Zabit",       short: "C/O" },
    { id: "2O",  dept: "deck",   en: "Second Officer",    tr: "İkinci Zabit",        short: "2/O" },
    { id: "3O",  dept: "deck",   en: "Third Officer",     tr: "Üçüncü Zabit",        short: "3/O" },
    { id: "DR",  dept: "deck",   en: "Deck Ratings",      tr: "Güverte Tayfaları",   short: "BSN/AB", sub: { en: "Bosun · Pumpman · AB · OS", tr: "Lostromo · Pompacı · AB · OS" } },
    { id: "CE",  dept: "engine", en: "Chief Engineer",    tr: "Başmühendis",         short: "C/E" },
    { id: "2E",  dept: "engine", en: "Second Engineer",   tr: "İkinci Mühendis",     short: "2/E" },
    { id: "ETO", dept: "engine", en: "Electro-Technical Officer", tr: "Elektrik Zabiti", short: "ETO" },
    { id: "ER",  dept: "engine", en: "Engine Ratings",    tr: "Makine Tayfaları",    short: "FTR/OLR", sub: { en: "Fitter · Oiler · Wiper", tr: "Fitter · Yağcı · Silici" } }
];

/* CDI SIR sections. 5 (Chemical / Product) comes from the type-specific booklets. */
const CHAPTERS = {
    1:  { en: "Certification, Manning etc.",          tr: "Sertifikasyon, Personel vb." },
    2:  { en: "Management and Personnel",             tr: "Yönetim ve Personel" },
    3:  { en: "Bridge",                               tr: "Köprüüstü" },
    4:  { en: "Mooring",                              tr: "Palamar" },
    5:  { en: "Cargo (Chemical / Product)",           tr: "Yük (Kimyasal / Ürün)" },
    6:  { en: "Engine Department",                    tr: "Makine Bölümü" },
    7:  { en: "Operational Safety",                   tr: "Operasyonel Emniyet" },
    8:  { en: "Health, Safety and Personnel Protection", tr: "Sağlık, Emniyet ve Kişisel Koruma" },
    9:  { en: "Firefighting",                         tr: "Yangınla Mücadele" },
    10: { en: "Lifesaving",                           tr: "Can Kurtarma" },
    11: { en: "Environmental Protection",             tr: "Çevre Koruma" },
    12: { en: "Security",                             tr: "Güvenlik" },
    13: { en: "Hull and Superstructure",              tr: "Gövde ve Üst Bina" },
    14: { en: "Accommodation",                        tr: "Yaşam Mahalleri" }
};

/* "Crew Knowledge and Proficiency" subsections: the questions the inspector asks the crew */
const KNOWLEDGE = ["3.3", "4.2", "6.5", "7.2", "8.3", "9.2", "10.2", "11.4"];

/* Company SQEMS books */
const MANUALS = {
    B1: "SMM – Safety Management Manual",
    B2: "HSSEQ Procedures",
    B3: "Operational Manual – Bridge & Deck",
    B4: "Operational Manual – Cargo",
    B5: "Operational Manual – Engine",
    B6: "Emergency Contingency Manual",
    B7: "Training Manual",
    MSMP: "Mooring System & Line Management Plan (M/T ADA)"
};

const GROUPS = { DECK: "MS CO 2O 3O", ENG: "CE 2E ETO", OFF: "MS CO 2O 3O CE 2E ETO", ALL: "MS CO 2O 3O DR CE 2E ETO ER" };
const PROC = {};
const ITEMS = [];

const rankList = ranks => [...new Set(ranks.split(" ").flatMap(r => (GROUPS[r] || r).split(" ")))];

function C(ref, en, tr) { return { ref, en: en || "", tr: tr || "" }; }

/* A company procedure (js/proc/*.js) */
function S(key, ranks, hr, tr, co, gEn, gTr) {
    const pack = a => a ? { exp: a[0] || "", ev: a[1] || "", pit: a[2] || "" } : null;
    PROC[key] = { key, tr, co: co || null, g: { en: pack(gEn), tr: pack(gTr) } };
}

/* A CDI question (js/cdi/map-*.js); needs js/cdi/core.js and js/proc/*.js loaded first */
let mapRanks = "ALL";
function D(ranks) { mapRanks = ranks; }
function M(no, tr, keys, ranks) {
    const o = CDI_CORE[no];
    if (!o) return console.warn("CDI question not in the booklet:", no);
    const procs = String(keys || "").split(" ").filter(k => PROC[k]);
    const sub = no.split(".").slice(0, 2).join("."), ch = +no.split(".")[0];
    ITEMS.push({
        id: no, ch, sub, tr, ranks: rankList(ranks || mapRanks),
        cat: o.cat, gp: o.gp, hr: o.cat === "S",
        info: !o.cat || /____/.test(o.q),
        kp: KNOWLEDGE.includes(sub),
        procs,
        cos: procs.map(k => PROC[k].co).filter(Boolean),
        g: procs.map(k => PROC[k].g).find(g => g.en) || { en: null, tr: null },
        rating: procs.map(k => typeof RATING !== "undefined" && RATING[k]).find(Boolean) || null
    });
}
