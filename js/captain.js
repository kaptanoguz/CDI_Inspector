/* ═══════════════════════════════════════════════════════════════════════
   CDI Inspector — Master's inspection (Kaptan denetimi)
   The Master plays the CDI inspector: picks the officers and ratings to
   interview, asks each one the CDI questions for their rank, records what
   they answered and showed, and answers each question the way the CDI SIR
   does (Yes / No / N/A, an observation for every No). At the end a report
   is produced for the office (print / PDF, Excel CSV and an e-mail draft).
   Finished inspections are kept on device.
   Loaded before app.js; uses its globals (prefs, data, ITEMS, …) at runtime.
   ═══════════════════════════════════════════════════════════════════════ */

const CT = {
    tr: {
        capTitle: "Kaptan denetimi",
        capHomeSub: "Kaptan CDI denetçisi gibi zabit ve tayfalara rütbelerine göre soruları sorar, cevapları ve kanıtları kaydeder, her soruyu Yes / No / N/A olarak cevaplar. Denetim bitince ofise gönderilecek rapor hazırlanır.",
        capNew: "Yeni denetim", capResume: "Denetime devam et", capInProgress: "Süren denetim",
        capPast: "Tamamlanan denetimler", capNoPast: "Henüz tamamlanmış denetim yok.",
        capReport: "Rapor", capDelete: "Sil", capDeleteQ: "Bu denetim kaydı silinsin mi?",
        capDiscardQ: "Süren denetim silinsin mi? Kaydedilen cevaplar kaybolur.", capDiscard: "Denetimi iptal et",
        capSetup: "Denetim bilgileri", capMaster: "Denetleyen (Kaptan)", capOffice: "Ofis e-posta",
        capCrew: "Görüşülecek personel", capAddCrew: "Kişi ekle", capName: "Ad soyad", capRemove: "Kaldır",
        capScope: "Soru kapsamı", capScPrio: "Bilgi ve yeterlik soruları", capScAll: "Rütbenin tüm soruları", capScRand: "Rastgele 10",
        capStart: "Denetimi başlat", capNeedCrew: "En az bir kişi ekleyin.",
        capAsk: "Sorulacak soru", capExpected: "Beklenen cevap (şirket prosedürü)",
        capAnswer: "Verilen cevap — ne söyledi, hangi kanıtı gösterdi", capRemark: "Gözlem (No için zorunlu) / not",
        capGrade: "Cevap", capFactor: "Gözlem türü",
        capPrev: "Önceki", capNext: "Sonraki", capFinish: "Denetimi bitir",
        capFinishQ: "Denetim bitirilip rapor oluşturulsun mu? Cevaplanmayan sorular raporda \"sorulmadı\" görünür.",
        capAnswered: "cevaplandı",
        capBackList: "Kaptan denetimi",
        capRepTitle: "CDI Kaptan iç denetim raporu",
        capSummary: "Özet", capByPerson: "Kişi bazında", capObs: "Gözlemler (No cevapları)",
        capNoObs: "No olarak cevaplanan soru yok.",
        capDetail: "Tüm soru ve cevaplar", capPerson: "Kişi", capRank: "Rütbe", capAnsW: "Cevap", capNoteW: "Not",
        capPrint: "Yazdır / PDF", capCsv: "Excel (CSV)", capMail: "Ofise e-posta",
        capMailHint: "E-posta taslağı özeti içerir; PDF veya CSV dosyasını eke ekleyin.",
        capNotAsked: "Sorulmadı",
        capGenerated: "Rapor tarihi", capQs: "soru",
        grades: { yes: "Yes — uygun", no: "No — gözlem", na: "N/A — uygulanmaz / sorulmadı" },
        gShort: { yes: "Yes", no: "No", na: "N/A" },
        factors: {}
    },
    en: {
        capTitle: "Master's inspection",
        capHomeSub: "The Master acts as the CDI inspector: asks officers and ratings the questions for their rank, records their answers and evidence, and answers each question Yes / No / N/A. When it ends, a report is prepared for the office.",
        capNew: "New inspection", capResume: "Resume inspection", capInProgress: "Inspection in progress",
        capPast: "Completed inspections", capNoPast: "No completed inspections yet.",
        capReport: "Report", capDelete: "Delete", capDeleteQ: "Delete this inspection record?",
        capDiscardQ: "Discard the inspection in progress? Recorded answers will be lost.", capDiscard: "Cancel inspection",
        capSetup: "Inspection details", capMaster: "Inspected by (Master)", capOffice: "Office e-mail",
        capCrew: "Crew to interview", capAddCrew: "Add person", capName: "Full name", capRemove: "Remove",
        capScope: "Questions", capScPrio: "Knowledge & proficiency questions", capScAll: "All questions for the rank", capScRand: "Random 10",
        capStart: "Start inspection", capNeedCrew: "Add at least one person.",
        capAsk: "Ask", capExpected: "Expected answer (company procedure)",
        capAnswer: "Answer given — what they said and what evidence they showed", capRemark: "Observation (required for No) / note",
        capGrade: "Answer", capFactor: "Observation type",
        capPrev: "Previous", capNext: "Next", capFinish: "Finish inspection",
        capFinishQ: "Finish the inspection and create the report? Unanswered questions appear as \"not asked\".",
        capAnswered: "answered",
        capBackList: "Master's inspection",
        capRepTitle: "CDI Master's internal inspection report",
        capSummary: "Summary", capByPerson: "By person", capObs: "Observations (No answers)",
        capNoObs: "No question was answered No.",
        capDetail: "All questions and answers", capPerson: "Person", capRank: "Rank", capAnsW: "Answer", capNoteW: "Note",
        capPrint: "Print / PDF", capCsv: "Excel (CSV)", capMail: "E-mail to office",
        capMailHint: "The e-mail draft holds the summary; attach the PDF or CSV file.",
        capNotAsked: "Not asked",
        capGenerated: "Report date", capQs: "questions",
        grades: { yes: "Yes — complies", no: "No — observation", na: "N/A — not applicable / not asked" },
        gShort: { yes: "Yes", no: "No", na: "N/A" },
        factors: {}
    }
};
const ct = k => CT[prefs.lang][k];
const GRADES = ["yes", "no", "na"];
const FACTORS = [];   // CDI observations carry no type; kept so a type can be added later
const CAP_DEFAULT_CREW = ["CO", "2O", "3O", "DR", "CE", "2E", "ETO", "ER"];
const CAP_SKIP_CH = [1];   // Certification & manning is checked from documents, not asked in the interview
const capItems = rank => itemsFor(rank).filter(i => !CAP_SKIP_CH.includes(i.ch) && !i.info);

const capData = () => (data.cap ||= { cur: null, past: [] });
const capUi = () => (ui.cap ||= { view: "start", who: null, pos: 0, show: false, rep: null });
const capKey = (cid, qid) => `${cid}|${qid}`;
const capAns = (ins, cid, qid) => ins.ans[capKey(cid, qid)] || { g: "", f: "", a: "", n: "" };
const capToday = () => new Date().toISOString().slice(0, 10);
const capId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const rankName = id => { const r = rankById(id); return r ? L(r) : id; };
const rankShort = id => rankById(id)?.short || id;
const isObs = g => g === "no";

/* The question as the inspector asks it: ratings get the pocket-guide wording when there is one */
function capQuestion(i, rank) {
    const o = official(i), rt = i.rating;
    if (isRating(rank) && rt?.qEn) return { q: rt.qEn, sub: rt.qTr || title(i) };
    return { q: o.q || title(i), sub: title(i) };
}

function capPool(rank, scope) {
    const all = capItems(rank);
    if (scope === "all") return all.map(i => i.id);
    if (scope === "rand") return shuffle(all).slice(0, 10).sort((a, b) => ITEMS.indexOf(a) - ITEMS.indexOf(b)).map(i => i.id);
    const p = all.filter(i => i.kp);
    return (p.length ? p : all).map(i => i.id);
}

function capCounts(ins, cid) {
    const c = { yes: 0, no: 0, na: 0, blank: 0, total: 0 };
    for (const p of ins.crew) {
        if (cid && p.id !== cid) continue;
        for (const q of ins.qs[p.id] || []) { c.total++; c[capAns(ins, p.id, q).g || "blank"]++; }
    }
    return c;
}

function capObsList(ins) {
    const out = [];
    for (const p of ins.crew) for (const id of ins.qs[p.id] || []) {
        const a = capAns(ins, p.id, id);
        if (isObs(a.g)) out.push({ p, i: ITEMS.find(x => x.id === id), a });
    }
    return out;
}

/* ── Views ───────────────────────────────────────────────────────────── */
function capHtml() {
    const u = capUi(), d = capData();
    if (u.view === "report") {
        const ins = d.past.find(x => x.id === u.rep);
        if (ins) return capReportHtml(ins);
    }
    if (u.view === "setup" && d.cur && !d.cur.started) return capSetupHtml(d.cur);
    if (u.view === "run" && d.cur?.started) return capRunHtml(d.cur);
    u.view = "start";
    return capStartHtml();
}

function capHead(sub, back) {
    return `
    <header class="rank-head">
        ${back ? `<button class="back" type="button" data-cap-act="toStart">${ICON.back}<span>${ct("capBackList")}</span></button>`
               : `<button class="back" type="button" data-go="">${ICON.back}<span>${t("pickRank")}</span></button>`}
        <h1 class="display">${ct("capTitle")}</h1>
        ${sub ? `<p class="muted">${sub}</p>` : ""}
    </header>`;
}

function capStartHtml() {
    const d = capData(), cur = d.cur;
    const metaLine = ins => [ins.meta.ship, ins.meta.port, ins.meta.date].filter(Boolean).map(esc).join(" · ");
    const people = n => `${n} ${ct("capPerson").toLocaleLowerCase(prefs.lang)}`;
    const cc = cur?.started ? capCounts(cur) : null;
    return capHead(ct("capHomeSub")) + `
    <section class="cap-start">
        ${cur ? `
        <div class="cap-cur">
            <p class="kicker">${ct("capInProgress")}</p>
            <p class="cap-cur-meta">${metaLine(cur) || "—"} · ${people(cur.crew.length)}${cc ? ` · ${cc.total - cc.blank}/${cc.total} ${ct("capAnswered")}` : ""}</p>
            <div class="btns">
                <button type="button" class="btn primary" data-cap-act="resume">${ct("capResume")}</button>
                <button type="button" class="link danger" data-cap-act="discard">${ct("capDiscard")}</button>
            </div>
        </div>` : `
        <button type="button" class="btn primary" data-cap-act="new">${ct("capNew")}</button>`}
        <h2 class="kicker cap-h">${ct("capPast")}</h2>
        ${d.past.length ? `<ol class="cap-past">${d.past.slice().reverse().map(ins => {
            const c = capCounts(ins);
            return `
            <li>
                <span class="cp-meta">${metaLine(ins) || "—"}<small>${esc(ins.meta.master || "")}${ins.meta.master ? " · " : ""}${people(ins.crew.length)} · ${c.total} ${ct("capQs")}</small></span>
                <span class="cp-count">${c.no ? `<b class="nc">${c.no}</b> ${ct("gShort").no} · ` : ""}${c.yes} ${ct("gShort").yes}</span>
                <span class="cp-act">
                    <button type="button" class="btn" data-cap-rep="${ins.id}">${ct("capReport")}</button>
                    <button type="button" class="link danger" data-cap-del="${ins.id}">${ct("capDelete")}</button>
                </span>
            </li>`; }).join("")}</ol>` : `<p class="muted">${ct("capNoPast")}</p>`}
    </section>`;
}

function capSetupHtml(ins) {
    const m = ins.meta;
    const field = (k, label, type = "text") => `<label class="mf"><span class="kicker">${label}</span><input data-cap-meta="${k}" type="${type}" value="${esc(m[k] || "")}"></label>`;
    const opts = sel => RANKS.map(r => `<option value="${r.id}"${r.id === sel ? " selected" : ""}>${esc(r.short)} — ${esc(L(r))}</option>`).join("");
    const sc = (id, label) => `<button type="button" data-cap-scope="${id}" aria-pressed="${ins.scope === id}">${label}</button>`;
    return capHead("", true) + `
    <section class="cap-setup">
        <h2 class="kicker cap-h">${ct("capSetup")}</h2>
        <div class="meta-grid cap-meta">${field("ship", t("mShip"))}${field("port", t("mPort"))}${field("date", t("mDate"), "date")}${field("master", ct("capMaster"))}${field("office", ct("capOffice"), "email")}</div>

        <h2 class="kicker cap-h">${ct("capCrew")}</h2>
        <ol class="cap-crew">${ins.crew.map((p, n) => `
            <li>
                <select data-cap-crew="${n}:rank" aria-label="${ct("capRank")}">${opts(p.rank)}</select>
                <input data-cap-crew="${n}:name" type="text" placeholder="${ct("capName")}" value="${esc(p.name)}">
                <span class="muted cc-n">${ins.scope === "rand" ? Math.min(10, capItems(p.rank).length) : capPool(p.rank, ins.scope).length} ${t("questions")}</span>
                <button type="button" class="link danger" data-cap-rm="${n}">${ct("capRemove")}</button>
            </li>`).join("")}</ol>
        <button type="button" class="link" data-cap-act="addCrew">+ ${ct("capAddCrew")}</button>

        <h2 class="kicker cap-h">${ct("capScope")}</h2>
        <div class="seg wide">${sc("prio", ct("capScPrio"))}${sc("all", ct("capScAll"))}${sc("rand", ct("capScRand"))}</div>

        <div class="btns cap-go">
            <button type="button" class="btn primary" data-cap-act="start">${ct("capStart")}</button>
            <button type="button" class="link danger" data-cap-act="discard">${ct("capDiscard")}</button>
        </div>
    </section>`;
}

function capRunHtml(ins) {
    const u = capUi();
    if (!ins.crew.some(p => p.id === u.who)) { u.who = ins.crew[0].id; u.pos = 0; }
    const p = ins.crew.find(x => x.id === u.who), qs = ins.qs[p.id];
    u.pos = Math.max(0, Math.min(u.pos, qs.length - 1));
    const i = ITEMS.find(x => x.id === qs[u.pos]), a = capAns(ins, p.id, i.id), q = capQuestion(i, p.rank);
    const gs = ct("gShort"), gl = ct("grades"), fs = ct("factors"), c = capCounts(ins);
    const grade = g => `<button type="button" class="g-${g}" data-cap-grade="${g}" aria-pressed="${a.g === g}" title="${gl[g]}">${gs[g]}</button>`;
    const factor = f => `<button type="button" data-cap-factor="${f}" aria-pressed="${a.f === f}">${fs[f]}</button>`;
    const w = n => c.total ? (n / c.total * 100).toFixed(2) : 0;
    const first = u.pos === 0 && ins.crew[0].id === p.id;

    return `
    <header class="rank-head">
        <button class="back" type="button" data-cap-act="toStart">${ICON.back}<span>${ct("capBackList")}</span></button>
        <h1 class="display">${esc(ins.meta.ship || ct("capTitle"))} <span class="code">${esc(ins.meta.port || "")}</span></h1>
        <div class="summary">
            <div class="sum-line">
                <span class="sum-big">${c.total - c.blank}<span class="muted"> / ${c.total}</span></span>
                <span class="sum-text">${ct("capAnswered")} · <b class="nc">${c.no}</b> ${gs.no} · <b>${c.yes}</b> ${gs.yes} · <b>${c.na}</b> ${gs.na}</span>
            </div>
            <div class="bar" aria-hidden="true"><span class="b2" style="width:${w(c.yes + c.na)}%"></span><span class="bnc" style="width:${w(c.no)}%"></span></div>
        </div>
    </header>
    <div class="cap-run">
        <nav class="cap-side">
            ${ins.crew.map(x => { const k = capCounts(ins, x.id); return `
            <button type="button" class="cs-p" data-cap-who="${x.id}" aria-current="${x.id === p.id}">
                <span class="cs-name">${esc(x.name || rankName(x.rank))}</span>
                <span class="cs-sub">${esc(rankShort(x.rank))} · ${k.total - k.blank}/${k.total}${k.no ? ` · <b class="nc">${k.no}</b>` : ""}</span>
            </button>`; }).join("")}
            <button type="button" class="btn primary cs-finish" data-cap-act="finish">${ct("capFinish")}</button>
        </nav>

        <article class="card cap-card">
            <div class="card-top"><span>${esc(p.name || rankName(p.rank))} · ${esc(rankName(p.rank))}</span><span>${u.pos + 1} / ${qs.length}</span></div>
            <div class="cap-dots">${qs.map((id, n) => { const g = capAns(ins, p.id, id).g; return `<button type="button" class="cd${n === u.pos ? " on" : ""}${g ? " g-" + g : ""}" data-cap-pos="${n}">${id}</button>`; }).join("")}</div>
            <p class="kicker">${ct("capAsk")} · ${i.id} · ${esc(L(CHAPTERS[i.ch]))} · ${catMark(i)}</p>
            <p class="ask" lang="en">${esc(q.q)}</p>
            ${q.sub !== q.q ? `<p class="muted">${esc(q.sub)}</p>` : ""}

            <details class="more cap-exp"${u.show ? " open" : ""}>
                <summary>${ct("capExpected")}</summary>
                <div class="reveal">${isRating(p.rank) ? ratingBlock(i) + companyBlock(i) : companyBlock(i)}${guideBlock(i)}</div>
            </details>

            <label class="cap-f"><span class="kicker">${ct("capAnswer")}</span>
                <textarea class="note" data-cap-ans="a" rows="2">${esc(a.a)}</textarea></label>
            <div class="cap-f"><span class="kicker">${ct("capGrade")}</span>
                <div class="seg wide grades">${GRADES.map(grade).join("")}</div></div>
            ${isObs(a.g) && FACTORS.length ? `<div class="cap-f"><span class="kicker">${ct("capFactor")}</span>
                <div class="seg">${FACTORS.map(factor).join("")}</div></div>` : ""}
            <label class="cap-f"><span class="kicker">${ct("capRemark")}</span>
                <textarea class="note" data-cap-ans="n" rows="1">${esc(a.n)}</textarea></label>

            <div class="btns split">
                <button type="button" class="btn" data-cap-act="prev"${first ? " disabled" : ""}>${ct("capPrev")}</button>
                <button type="button" class="btn primary" data-cap-act="next">${ct("capNext")}</button>
            </div>
        </article>
    </div>`;
}

/* ── Report ──────────────────────────────────────────────────────────── */
function capDoc(ins) {
    const m = ins.meta, gl = ct("grades"), gs = ct("gShort"), fs = ct("factors"), c = capCounts(ins), obs = capObsList(ins);
    const who = p => `${esc(p.name || rankName(p.rank))} <span class="cr-rank">${esc(rankShort(p.rank))}</span>`;
    const row = (p, i, a, showWho) => `
        <tr class="cg-${a.g || "blank"}">
            <td>${i.id}</td>
            <td>${showWho ? `<div class="cr-who">${who(p)}</div>` : ""}<div class="cr-q" lang="en">${esc(capQuestion(i, p.rank).q)}</div>
                ${a.a ? `<div class="cr-a"><b>${ct("capAnsW")}:</b> ${esc(a.a)}</div>` : ""}
                ${a.n ? `<div class="cr-n"><b>${ct("capNoteW")}:</b> ${esc(a.n)}</div>` : ""}</td>
            <td>${a.g ? gl[a.g] : ct("capNotAsked")}${a.f && isObs(a.g) ? `<div class="cr-f">${fs[a.f]}</div>` : ""}</td>
        </tr>`;
    return `
    <div class="cap-doc">
        <h1>${ct("capRepTitle")}</h1>
        <table class="meta"><tr>
            <td><b>${t("mShip")}</b> ${esc(m.ship || "")}</td><td><b>${t("mPort")}</b> ${esc(m.port || "")}</td>
            <td><b>${t("mDate")}</b> ${esc(m.date || "")}</td><td><b>${ct("capMaster")}</b> ${esc(m.master || "")}</td>
        </tr></table>

        <h2>${ct("capSummary")}</h2>
        <p class="cr-sum">${c.total} ${ct("capQs")} · <b>${c.yes}</b> ${gs.yes} · <b class="nc">${c.no}</b> ${gs.no} · <b>${c.na}</b> ${gs.na} · <b>${c.blank}</b> ${ct("capNotAsked").toLocaleLowerCase(prefs.lang)}</p>

        <h2>${ct("capByPerson")}</h2>
        <table class="cr-tab cr-people"><thead><tr><th>${ct("capPerson")}</th><th>${ct("capQs")}</th><th>${gs.yes}</th><th>${gs.no}</th><th>${gs.na}</th></tr></thead><tbody>
        ${ins.crew.map(p => { const k = capCounts(ins, p.id); return `<tr><td>${who(p)}</td><td>${k.total - k.blank}/${k.total}</td><td>${k.yes}</td><td${k.no ? ' class="nc"' : ""}>${k.no}</td><td>${k.na}</td></tr>`; }).join("")}
        </tbody></table>

        <h2>${ct("capObs")}</h2>
        ${obs.length ? `<table class="cr-tab cr-qa"><thead><tr><th>CDI</th><th>${ct("capPerson")} · ${t("colQ")}</th><th>${ct("capGrade")}</th></tr></thead><tbody>
            ${obs.map(o => row(o.p, o.i, o.a, true)).join("")}
        </tbody></table>` : `<p>${ct("capNoObs")}</p>`}

        <h2>${ct("capDetail")}</h2>
        ${ins.crew.map(p => `
        <h3>${who(p)} — ${esc(rankName(p.rank))}</h3>
        <table class="cr-tab cr-qa"><thead><tr><th>CDI</th><th>${t("colQ")}</th><th>${ct("capGrade")}</th></tr></thead><tbody>
            ${(ins.qs[p.id] || []).map(id => row(p, ITEMS.find(x => x.id === id), capAns(ins, p.id, id))).join("")}
        </tbody></table>`).join("")}
        <p class="cr-foot">${ct("capGenerated")}: ${esc(ins.ended || capToday())} · CDI Inspector · ${t("disclaimer")}</p>
    </div>`;
}

function capReportHtml(ins) {
    return `
    <header class="rank-head">
        <button class="back" type="button" data-cap-act="toStart">${ICON.back}<span>${ct("capBackList")}</span></button>
    </header>
    <div class="cap-rep-bar">
        <div class="btns">
            <button type="button" class="btn primary" data-cap-act="print">${ct("capPrint")}</button>
            <button type="button" class="btn" data-cap-act="csv">${ct("capCsv")}</button>
            <button type="button" class="btn" data-cap-act="mail">${ct("capMail")}</button>
        </div>
        <p class="muted">${ct("capMailHint")}</p>
    </div>
    ${capDoc(ins)}`;
}

const capRepIns = () => capData().past.find(x => x.id === capUi().rep);
const capFileBase = ins => `CDI-kaptan-denetimi${ins.meta.ship ? "-" + ins.meta.ship.replace(/[^\w-]+/g, "_") : ""}-${ins.meta.date || capToday()}`;

function capPrint() {
    const ins = capRepIns();
    if (!ins) return;
    let el = $("#print");
    if (!el) { el = document.createElement("section"); el.id = "print"; document.body.appendChild(el); }
    el.innerHTML = capDoc(ins);
    const old = document.title;
    document.title = capFileBase(ins);   // default PDF file name
    window.print();
    document.title = old;
}

function capCsv() {
    const ins = capRepIns();
    if (!ins) return;
    const cell = v => `"${String(v ?? "").replace(/"/g, '""')}"`, gl = ct("grades"), fs = ct("factors");
    const head = [[t("mShip"), ins.meta.ship], [t("mPort"), ins.meta.port], [t("mDate"), ins.meta.date], [ct("capMaster"), ins.meta.master]];
    const lines = head.map(r => r.map(cell).join(";"));
    lines.push("", [ct("capPerson"), ct("capRank"), t("colNo"), t("chapter"), "Cat", "CDI", t("colQ"), ct("capGrade"), ct("capAnsW"), ct("capNoteW")].map(cell).join(";"));
    for (const p of ins.crew) for (const id of ins.qs[p.id] || []) {
        const i = ITEMS.find(x => x.id === id), a = capAns(ins, p.id, id);
        lines.push([p.name, rankName(p.rank), id, L(CHAPTERS[i.ch]), i.cat, capQuestion(i, p.rank).q, title(i),
            a.g ? gl[a.g] : ct("capNotAsked"), a.a, a.n].map(cell).join(";"));
    }
    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = capFileBase(ins) + ".csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* mailto cannot attach files and long bodies get cut by mail clients: summary + observations only */
function capMail() {
    const ins = capRepIns();
    if (!ins) return;
    const m = ins.meta, c = capCounts(ins), gl = ct("grades"), gs = ct("gShort"), fs = ct("factors");
    let body = `${ct("capRepTitle")}\n${t("mShip")}: ${m.ship || ""}\n${t("mPort")}: ${m.port || ""}\n${t("mDate")}: ${m.date || ""}\n${ct("capMaster")}: ${m.master || ""}\n\n`
        + `${ct("capSummary")}: ${c.total} ${ct("capQs")} · ${gs.yes}: ${c.yes} · ${gs.no}: ${c.no} · ${gs.na}: ${c.na}\n\n`
        + `${ct("capByPerson")}:\n` + ins.crew.map(p => { const k = capCounts(ins, p.id); return `- ${p.name || rankName(p.rank)} (${rankShort(p.rank)}): ${k.total - k.blank}/${k.total} · ${gs.yes} ${k.yes} · ${gs.no} ${k.no}`; }).join("\n")
        + `\n\n${ct("capObs")}:\n`;
    const obs = capObsList(ins);
    body += obs.length ? obs.map(o => `- ${o.i.id} · ${o.p.name || rankShort(o.p.rank)} · ${gs[o.a.g]}${o.a.n ? ": " + o.a.n : ""}`).join("\n") : ct("capNoObs");
    if (body.length > 1800) body = body.slice(0, 1800) + "\n…";
    const subject = `${ct("capRepTitle")} — ${m.ship || ""} ${m.date || ""}`.trim();
    location.href = `mailto:${encodeURIComponent(m.office || "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/* ── Actions ─────────────────────────────────────────────────────────── */
function renderCap(keepScroll) {
    const y = window.scrollY;
    $("#view").innerHTML = capHtml();
    applyChrome();
    window.scrollTo(0, keepScroll ? y : 0);
    afterPanel();
}

function capStep(dir) {
    const u = capUi(), ins = capData().cur, n = ins.crew.findIndex(p => p.id === u.who), len = ins.qs[u.who].length;
    u.show = false;
    if (dir > 0 && u.pos < len - 1) u.pos++;
    else if (dir < 0 && u.pos > 0) u.pos--;
    else if (dir > 0 && n < ins.crew.length - 1) { u.who = ins.crew[n + 1].id; u.pos = 0; }
    else if (dir < 0 && n > 0) { u.who = ins.crew[n - 1].id; u.pos = ins.qs[u.who].length - 1; }
    else if (dir > 0) return capAct("finish");
    renderCap();
}

function capAct(act) {
    const d = capData(), u = capUi(), last = d.past.at(-1)?.meta || {};
    switch (act) {
        case "new":
            d.cur = { id: capId(), started: false, scope: "prio", qs: {}, ans: {},
                meta: { ship: last.ship || "", port: "", date: capToday(), master: last.master || "", office: last.office || "" },
                crew: CAP_DEFAULT_CREW.map(r => ({ id: capId() + r, rank: r, name: "" })) };
            persist(); u.view = "setup"; return renderCap();
        case "resume": u.view = d.cur?.started ? "run" : "setup"; return renderCap();
        case "discard":
            if (confirm(ct("capDiscardQ"))) { d.cur = null; persist(); u.view = "start"; renderCap(); }
            return;
        case "toStart": u.view = "start"; return renderCap();
        case "addCrew": d.cur.crew.push({ id: capId(), rank: "CO", name: "" }); persist(); return renderCap(true);
        case "start": {
            const ins = d.cur;
            if (!ins.crew.length) return toast(ct("capNeedCrew"));
            ins.crew.forEach(p => { ins.qs[p.id] = capPool(p.rank, ins.scope); });
            ins.crew = ins.crew.filter(p => ins.qs[p.id].length);
            ins.started = true; persist();
            Object.assign(u, { view: "run", who: ins.crew[0].id, pos: 0, show: false });
            return renderCap();
        }
        case "next": return capStep(1);
        case "prev": return capStep(-1);
        case "finish":
            if (!confirm(ct("capFinishQ"))) return;
            d.cur.ended = capToday();
            d.past.push(d.cur); u.rep = d.cur.id; d.cur = null; persist();
            u.view = "report"; return renderCap();
        case "print": return capPrint();
        case "csv": return capCsv();
        case "mail": return capMail();
    }
}

document.addEventListener("click", e => {
    if (prefs.page !== "cap") return;
    const el = e.target.closest("button");
    if (!el) return;
    const d = el.dataset, u = capUi(), ins = capData().cur;
    if (d.capAct) return capAct(d.capAct);
    if (d.capScope) { ins.scope = d.capScope; persist(); return renderCap(true); }
    if (d.capRm) { ins.crew.splice(+d.capRm, 1); persist(); return renderCap(true); }
    if (d.capWho) { Object.assign(u, { who: d.capWho, pos: 0, show: false }); return renderCap(); }
    if (d.capPos) { u.pos = +d.capPos; u.show = false; return renderCap(true); }
    if (d.capRep) { u.rep = d.capRep; u.view = "report"; return renderCap(); }
    if (d.capDel) {
        if (confirm(ct("capDeleteQ"))) { capData().past = capData().past.filter(x => x.id !== d.capDel); persist(); renderCap(true); }
        return;
    }
    if (d.capGrade || d.capFactor) {
        const k = capKey(u.who, ins.qs[u.who][u.pos]), a = Object.assign({ g: "", f: "", a: "", n: "" }, ins.ans[k]);
        if (d.capGrade) { a.g = a.g === d.capGrade ? "" : d.capGrade; if (!isObs(a.g)) a.f = ""; }
        else a.f = a.f === d.capFactor ? "" : d.capFactor;
        ins.ans[k] = a; persist();
        return renderCap(true);
    }
});

document.addEventListener("input", e => {
    if (prefs.page !== "cap") return;
    const el = e.target, d = el.dataset, ins = capData().cur;
    if (!ins) return;
    if (d.capMeta) { ins.meta[d.capMeta] = el.value; return persist(); }
    if (d.capCrew) {
        const [n, f] = d.capCrew.split(":");
        ins.crew[+n][f] = el.value; persist();
        if (f === "rank") renderCap(true);
        return;
    }
    if (d.capAns) {
        el.style.height = "auto"; el.style.height = el.scrollHeight + "px";
        const u = capUi(), k = capKey(u.who, ins.qs[u.who][u.pos]);
        ins.ans[k] = Object.assign({ g: "", f: "", a: "", n: "" }, ins.ans[k], { [d.capAns]: el.value });
        persist();
    }
});

document.addEventListener("toggle", e => { if (e.target.classList?.contains("cap-exp")) capUi().show = e.target.open; }, true);
