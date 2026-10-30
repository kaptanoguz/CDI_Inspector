#!/usr/bin/env python3
"""
CDI booklet → CDI Inspector importer.

Reads the CDI Ship Inspection Report booklets (PDF) in tools/source/cdi/ and
writes js/cdi/core.js: for every question its official statement, category
(S statutory · R recommended · D desirable · NS non-scoring), group (SI
self-inspection · I inspection), the CDI guidance notes and the booklet page.

  CDI 10th edition Core.pdf     Core Questionnaire, all vessel types (10.4)

The booklet is laid out in columns: question number (x < 100 pt), regulation
reference (100–165), statement / guidance (165–490), Cat (490–512), Gp (512+).
The first time a number appears it is the question; later rows with the same
number, or a range such as "1.1.1-36", are its guidance notes.

Turkish titles, ranks and the company procedure for each question are not
imported: they are written by hand in js/cdi/map-*.js.

Usage:  python3 tools/import_cdi.py
Needs:  pdfplumber   (pip install pdfplumber)
"""
import datetime
import json
import pathlib
import re

import pdfplumber

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "source" / "cdi"
OUT = ROOT.parent / "js" / "cdi" / "core.js"
BOOKLETS = [("Core", SRC / "CDI 10th edition Core.pdf", 21)]  # (name, file, first question page index)

NUM = re.compile(r"^\d{1,2}\.\d{1,2}(\.\d{1,3})?$")
RANGE = re.compile(r"^(\d+\.\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)*))?$")


def key(n):
    return [int(x) for x in n.split(".")]


def lines_of(page):
    words = [w for w in page.extract_words() if 88 < w["top"] < 775]
    words.sort(key=lambda w: (w["top"], w["x0"]))
    out = []
    for w in words:
        if out and abs(out[-1][0] - w["top"]) < 5.5:
            out[-1][1].append(w)
        else:
            out.append([w["top"], [w]])
    for _, ws in out:
        ws.sort(key=lambda w: w["x0"])
        col = lambda a, b: " ".join(w["text"] for w in ws if a <= w["x0"] < b)
        yield col(0, 100), col(100, 165), col(165, 490), col(490, 512), col(512, 999)


def parse(pdf_path, first_page):
    qs, order, guid, cur = {}, [], [], None
    with pdfplumber.open(pdf_path) as pdf:
        for pi, page in enumerate(pdf.pages):
            if pi < first_page:
                continue
            for num, ref, txt, cat, gp in lines_of(page):
                if txt.startswith("Yes No") or txt == "Yes" or cat == "Cat" or ref.startswith("Ref") or "Yes No N/A" in txt:
                    continue
                if num:
                    n0 = num.split()[0]
                    if cur and "label" in cur and cur["label"].rstrip().endswith("-"):
                        cur["label"] += n0; cur["text"] += " " + txt
                        continue
                    two = n0.count(".") == 1
                    if NUM.match(n0) and num == n0 and n0 not in qs and txt and (not two or int(n0.split(".")[0]) >= 12):
                        cur = {"no": n0, "q": txt, "cat": cat, "gp": gp, "g": [], "refs": [ref] if ref else [], "p": pi + 1}
                        qs[n0] = cur; order.append(n0)
                        continue
                    cur = {"label": num, "text": txt, "refs": [ref] if ref else []}
                    guid.append(cur)
                    continue
                if cur is None:
                    continue
                # a guidance block that starts under the question without repeating its number
                if "q" in cur and txt and ((ref and txt[0].isupper() and len(cur["q"]) > 25) or (txt.isupper() and len(txt) > 6 and not cat)):
                    cur = {"label": cur["no"], "text": txt, "refs": [ref] if ref else []}
                    guid.append(cur)
                    continue
                if ref:
                    cur["refs"].append(ref)
                if "q" in cur:
                    cur["cat"] = cur["cat"] or cat
                    cur["gp"] = cur["gp"] or gp
                    if txt:
                        cur["q"] += " " + txt
                elif txt:
                    cur["text"] += ("\n" if txt.startswith("-") else " ") + txt
    for g in guid:
        m = RANGE.match(g["label"].replace(" ", ""))
        if not m:
            continue
        a, b = m.group(1), m.group(2)
        if b:
            if "." not in b:
                b = a.rsplit(".", 1)[0] + "." + b
            targets = [n for n in order if n.count(".") == a.count(".") and key(a) <= key(n) <= key(b)]
            if targets:
                qs[targets[0]]["g"].append(dict(range=g["label"].replace(" ", ""), **note(g)))
                for t in targets[1:]:
                    qs[t].setdefault("see", targets[0])
        elif a in qs:
            qs[a]["g"].append(dict(range="", **note(g)))
    return [qs[n] for n in order]


def note(g):
    text = re.sub(r"\s*---.*$", "", g["text"], flags=re.S).strip()
    text = text.replace("INERT BLUE TABLE HERE", "").strip()
    return {"ref": " ".join(r for r in g["refs"] if r), "text": text}


def clean_q(q):
    q = re.sub(r"\s+", " ", q).strip()
    q = re.sub(r"\s*---.*$", "", q)
    q = re.sub(r"_{3,}", "____", q)
    q = re.sub(r"\s*\b[Ii]f (Yes|YES|No|NO)\s*[:,]?$", "", q)
    return q.strip()


def main():
    out = {}
    for name, path, first in BOOKLETS:
        for q in parse(path, first):
            cat = q["cat"] if q["cat"] in ("S", "R", "D", "NS") else ""
            gp = q["gp"] if q["gp"] in ("SI", "I") else ""
            rec = {"q": clean_q(q["q"]), "cat": cat, "gp": gp, "p": q["p"], "b": name}
            refs = " ".join(r for r in q["refs"] if r).strip()
            notes = [g for g in q["g"] if g["text"]]
            if refs:
                rec["ref"] = refs
            if notes:
                rec["g"] = [[g["range"], g["ref"], g["text"]] for g in notes]
            if q.get("see"):
                rec["see"] = q["see"]
            out[q["no"]] = rec
    meta = {"generated": datetime.date.today().isoformat(), "edition": "CDI SIR 10th Edition (10.4)",
            "booklets": [b[0] for b in BOOKLETS], "questions": len(out)}
    js = ("/* Generated by tools/import_cdi.py from the CDI booklets — do not edit by hand.\n"
          "   Official CDI statement, Cat (S/R/D/NS), Gp (SI/I), booklet page and guidance notes\n"
          "   g: [range, regulation, text]. */\n"
          f"const CDI_META = {json.dumps(meta, ensure_ascii=False)};\n"
          "const CDI_CORE = {\n" +
          ",\n".join(f"{json.dumps(k)}: {json.dumps(v, ensure_ascii=False)}" for k, v in out.items()) +
          "\n};\n")
    OUT.write_text(js, encoding="utf-8")
    print(f"{len(out)} questions → {OUT.relative_to(ROOT.parent)}")


if __name__ == "__main__":
    main()
