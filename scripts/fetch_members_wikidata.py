#!/usr/bin/env python3
"""
Group member master builder (Wikidata source).

Replaces the regex-guessed `group_members_draft.csv` pipeline, which parsed
member names out of album Version_Name strings and therefore leaked version
keywords ("Standard", "Hip", "Acoustic") into the member list.

Biasroom exposes no member field, so members are resolved externally:

  1. Resolve each biasroom group name to a Wikidata QID (wbsearchentities),
     scoring candidates by their description so "TWS" the boy group wins over
     "TWS" the Drosophila gene.
  2. Fetch members via SPARQL in BOTH directions - `?g wdt:P527 ?m` (has part)
     is sparsely populated on K-pop items, while `?m wdt:P463 ?g` (member of)
     carries most 4th/5th-gen groups. Querying only P527 loses ~60% of them.
  3. Keep the en label (latin stage name) and ko label (hangul stage name);
     for K-pop idols the Wikidata label is the stage name, which is what
     photocard listings actually use.

Solo artists are recorded with kind=SOLO and themselves as the sole "member",
since a large share of biasroom entries are soloists with photocards.

Usage:
    PYTHONIOENCODING=utf-8 python scripts/fetch_members_wikidata.py
    PYTHONIOENCODING=utf-8 python scripts/fetch_members_wikidata.py --limit 50
"""

import argparse
import ast
import csv
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

GROUPS_CSV = os.path.join(DATA_DIR, "biasroom_groups_master.csv")
CARDS_CSV = os.path.join(DATA_DIR, "biasroom_photocards_master.csv")
OUTPUT_CSV = os.path.join(DATA_DIR, "group_members_wikidata.csv")
UNRESOLVED_CSV = os.path.join(DATA_DIR, "group_members_unresolved.csv")
QID_CACHE = os.path.join(DATA_DIR, "wikidata_qid_cache.json")

# Wikidata asks that bots identify themselves with a contact address.
UA = "StanPC-DataBot/1.0 (https://stanpc.com; contact: go6113@gmail.com)"
API = "https://www.wikidata.org/w/api.php"
SPARQL = "https://query.wikidata.org/sparql"

REQUEST_DELAY = 0.12  # polite pacing for the search API
SPARQL_CHUNK = 120    # QIDs per SPARQL request; keeps POST bodies small

# Description keywords that identify the right kind of entity. Wikidata
# descriptions are free text, so scoring beats an exact P31 whitelist -
# K-pop items use a long tail of types (boy band, girl group, musical duo...).
GROUP_HINTS = (
    "group", "band", "boy group", "girl group", "duo", "trio", "unit",
    "ensemble", "그룹", "밴드", "아이돌",
)
SOLO_HINTS = (
    "singer", "rapper", "idol", "musician", "artist", "actor", "actress",
    "songwriter", "가수", "래퍼", "배우",
)
KPOP_HINTS = ("korea", "k-pop", "kpop", "한국", "japanese", "japan")

# Entities that are clearly not performers, used to reject search noise.
REJECT_HINTS = (
    "municipality", "gene", "protein", "species", "village", "river",
    "album", "song", "film", "episode", "software", "company",
)


# Wikidata labels carry disambiguators that are not part of the stage name
# ("연준 (가수)", "수빈 (2000년)", "CNU (singer)"), and the labels are openly
# editable, so occasional vandalism lands in them. Both are cleaned below.
DISAMBIG_RE = re.compile(r"\s*\([^)]*\)\s*$")
MAX_NAME_LEN = 28


def log(msg=""):
    print(msg, flush=True)


def clean_name(name):
    """Strip Wikidata disambiguators; drop values too long to be a stage name."""
    name = DISAMBIG_RE.sub("", (name or "").strip()).strip()
    if len(name) > MAX_NAME_LEN:
        return ""   # e.g. a vandalised label, not a usable name
    return name


def norm(s):
    """Aggressive normalizer for cross-source name comparison."""
    s = unicodedata.normalize("NFKC", s or "").lower()
    return re.sub(r"[^0-9a-z가-힣]+", "", s)


# --------------------------------------------------------------------------
# HTTP helpers
# --------------------------------------------------------------------------

def _open(req, timeout, retries=3):
    """GET/POST with linear backoff; Wikidata throttles bursty clients."""
    for attempt in range(retries):
        try:
            return urllib.request.urlopen(req, timeout=timeout)
        except (urllib.error.URLError, TimeoutError) as e:
            if attempt == retries - 1:
                raise
            wait = 2 * (attempt + 1)
            log(f"    ⏳ 재시도 {attempt + 1}/{retries - 1} ({e}) - {wait}초 대기")
            time.sleep(wait)


def api_get(params):
    params = dict(params, format="json")
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    return json.load(_open(req, timeout=30))


def sparql_post(query):
    data = urllib.parse.urlencode({"query": query, "format": "json"}).encode()
    req = urllib.request.Request(SPARQL, data=data, headers={
        "User-Agent": UA,
        "Accept": "application/sparql-results+json",
        "Content-Type": "application/x-www-form-urlencoded",
    })
    return json.load(_open(req, timeout=180))


# --------------------------------------------------------------------------
# Step 1 - resolve group names to QIDs
# --------------------------------------------------------------------------

def score_candidate(cand, group_name):
    """Rank a wbsearchentities hit. Returns (score, kind) or None to reject."""
    desc = (cand.get("description") or "").lower()
    label = cand.get("label") or ""

    if any(h in desc for h in REJECT_HINTS):
        return None

    is_group = any(h in desc for h in GROUP_HINTS)
    is_solo = any(h in desc for h in SOLO_HINTS)
    if not (is_group or is_solo):
        return None

    score = 0
    if is_group:
        score += 10          # groups are the primary target
    if any(h in desc for h in KPOP_HINTS):
        score += 5           # prefer Korean/Japanese acts over same-name bands
    if norm(label) == norm(group_name):
        score += 3           # exact label match beats a fuzzy one
    return score, ("GROUP" if is_group else "SOLO")


def resolve_qid(group_name, aliases):
    """Search Wikidata for a group name, returning (qid, kind) or (None, None)."""
    seen = set()
    best = None
    for term in [group_name] + list(aliases):
        if not term or norm(term) in seen:
            continue
        seen.add(norm(term))
        for lang in ("en", "ko"):
            try:
                res = api_get({
                    "action": "wbsearchentities", "search": term,
                    "language": lang, "uselang": lang,
                    "type": "item", "limit": 8,
                })
            except Exception:
                continue
            time.sleep(REQUEST_DELAY)
            for cand in res.get("search", []):
                scored = score_candidate(cand, group_name)
                if not scored:
                    continue
                score, kind = scored
                if best is None or score > best[0]:
                    best = (score, cand["id"], kind)
            if best and best[0] >= 15:
                return best[1], best[2]   # confident group hit, stop early
    if best:
        return best[1], best[2]
    return None, None


# --------------------------------------------------------------------------
# Step 2 - fetch members for resolved QIDs
# --------------------------------------------------------------------------

MEMBER_QUERY = """
SELECT ?g ?m ?mEn ?mKo WHERE {
  VALUES ?g { %s }
  { ?g wdt:P527 ?m } UNION { ?m wdt:P463 ?g }
  ?m wdt:P31 wd:Q5 .
  OPTIONAL { ?m rdfs:label ?mEn FILTER(lang(?mEn) = "en") }
  OPTIONAL { ?m rdfs:label ?mKo FILTER(lang(?mKo) = "ko") }
}
"""

LABEL_QUERY = """
SELECT ?m ?mEn ?mKo WHERE {
  VALUES ?m { %s }
  OPTIONAL { ?m rdfs:label ?mEn FILTER(lang(?mEn) = "en") }
  OPTIONAL { ?m rdfs:label ?mKo FILTER(lang(?mKo) = "ko") }
}
"""


def chunks(seq, size):
    for i in range(0, len(seq), size):
        yield seq[i:i + size]


def fetch_members(qids):
    """Map group QID -> set of (member_qid, name_en, name_ko)."""
    members = defaultdict(set)
    total = len(list(chunks(qids, SPARQL_CHUNK)))
    for i, batch in enumerate(chunks(qids, SPARQL_CHUNK), 1):
        values = " ".join(f"wd:{q}" for q in batch)
        log(f"  🔎 멤버 조회 배치 {i}/{total} ({len(batch)}개 그룹)")
        data = sparql_post(MEMBER_QUERY % values)
        for r in data["results"]["bindings"]:
            g = r["g"]["value"].rsplit("/", 1)[-1]
            m = r["m"]["value"].rsplit("/", 1)[-1]
            members[g].add((
                m,
                r.get("mEn", {}).get("value", ""),
                r.get("mKo", {}).get("value", ""),
            ))
        time.sleep(1.0)
    return members


def fetch_labels(qids):
    """Map QID -> (name_en, name_ko); used for solo artists."""
    labels = {}
    for batch in chunks(qids, SPARQL_CHUNK):
        values = " ".join(f"wd:{q}" for q in batch)
        data = sparql_post(LABEL_QUERY % values)
        for r in data["results"]["bindings"]:
            q = r["m"]["value"].rsplit("/", 1)[-1]
            labels[q] = (
                r.get("mEn", {}).get("value", ""),
                r.get("mKo", {}).get("value", ""),
            )
        time.sleep(1.0)
    return labels


# --------------------------------------------------------------------------
# Input loading
# --------------------------------------------------------------------------

def load_groups():
    """Biasroom groups, restricted to those that actually have photocards."""
    with_cards = set()
    with open(CARDS_CSV, encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            name = (row.get("Group_Name") or "").strip()
            if name:
                with_cards.add(name)

    groups = []
    with open(GROUPS_CSV, encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            name = (row.get("Name_EN") or "").strip()
            if name not in with_cards:
                continue
            # Name_KR holds a python-literal list of aliases, e.g. "['andteam']"
            raw = (row.get("Name_KR") or "").strip()
            aliases = []
            if raw.startswith("["):
                try:
                    aliases = [a for a in ast.literal_eval(raw)
                               if isinstance(a, str)]
                except (ValueError, SyntaxError):
                    pass
            elif raw:
                aliases = [raw]
            groups.append({
                "id": (row.get("Group_ID") or "").strip(),
                "name": name,
                "aliases": aliases,
            })
    return groups


def load_cache():
    if os.path.exists(QID_CACHE):
        with open(QID_CACHE, encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_cache(cache):
    with open(QID_CACHE, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=1)


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0,
                    help="process only the first N groups (smoke test)")
    ap.add_argument("--refresh", action="store_true",
                    help="ignore the QID cache and re-resolve every group")
    args = ap.parse_args()

    groups = load_groups()
    if args.limit:
        groups = groups[:args.limit]

    log("🚀 [Wikidata] 그룹 멤버 마스터 구축 시작\n")
    log(f"📋 대상 그룹(포카 보유): {len(groups)}개\n")

    # --- Step 1: resolve QIDs -------------------------------------------
    cache = {} if args.refresh else load_cache()
    resolved, unresolved = {}, []

    log("── 1단계: 그룹 → Wikidata QID 매칭 ──")
    for idx, g in enumerate(groups, 1):
        key = g["name"]
        if key in cache:
            entry = cache[key]
        else:
            qid, kind = resolve_qid(g["name"], g["aliases"])
            entry = {"qid": qid, "kind": kind}
            cache[key] = entry
            if idx % 25 == 0:
                save_cache(cache)   # checkpoint so a crash doesn't lose work

        if entry.get("qid"):
            resolved[key] = entry
        else:
            unresolved.append(g)

        if idx % 50 == 0 or idx == len(groups):
            log(f"  ⏳ {idx}/{len(groups)} 처리 "
                f"(매칭 {len(resolved)} / 실패 {len(unresolved)})")
    save_cache(cache)

    group_qids = [e["qid"] for e in resolved.values() if e["kind"] == "GROUP"]
    solo_qids = [e["qid"] for e in resolved.values() if e["kind"] == "SOLO"]
    log(f"\n  ✅ 매칭 {len(resolved)}개 "
        f"(그룹 {len(group_qids)} / 솔로 {len(solo_qids)}), "
        f"실패 {len(unresolved)}개\n")

    # --- Step 2: fetch members ------------------------------------------
    log("── 2단계: 멤버 조회 (P527 정방향 + P463 역방향) ──")
    members = fetch_members(sorted(set(group_qids))) if group_qids else {}
    solo_labels = fetch_labels(sorted(set(solo_qids))) if solo_qids else {}
    log("")

    # --- Step 3: write out ----------------------------------------------
    rows = []
    empty_groups = []
    for name, entry in sorted(resolved.items()):
        qid, kind = entry["qid"], entry["kind"]
        if kind == "SOLO":
            en, ko = solo_labels.get(qid, ("", ""))
            en, ko = clean_name(en), clean_name(ko)
            rows.append({
                "Group_Name": name, "Group_QID": qid,
                "Member_Name_EN": en or name, "Member_Name_KO": ko,
                "Member_QID": qid, "Kind": "SOLO",
                "Source": "Wikidata_Entity",
            })
            continue

        found = sorted(members.get(qid, set()), key=lambda x: x[1])
        if not found:
            empty_groups.append(name)
            continue
        for m_qid, en, ko in found:
            en, ko = clean_name(en), clean_name(ko)
            # Some items carry only one language (Japanese members often lack a
            # ko label, a few Korean-only items lack an en one). Fall back so no
            # row ships with a blank display name; drop it if both are missing.
            if not en and not ko:
                continue
            rows.append({
                "Group_Name": name, "Group_QID": qid,
                "Member_Name_EN": en or ko, "Member_Name_KO": ko,
                "Member_QID": m_qid, "Kind": "GROUP",
                "Source": "Wikidata_P463_P527",
            })

    fields = ["Group_Name", "Group_QID", "Member_Name_EN", "Member_Name_KO",
              "Member_QID", "Kind", "Source"]
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)

    # Groups needing a second source are logged so the gap stays visible.
    with open(UNRESOLVED_CSV, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=["Group_Name", "Reason"])
        w.writeheader()
        for g in unresolved:
            w.writerow({"Group_Name": g["name"], "Reason": "QID_NOT_FOUND"})
        for n in empty_groups:
            w.writerow({"Group_Name": n, "Reason": "NO_MEMBER_DATA"})

    covered = len({r["Group_Name"] for r in rows})
    log("─" * 60)
    log(f"✅ 완료: '{os.path.basename(OUTPUT_CSV)}'")
    log(f"   총 멤버 레코드      : {len(rows)}건")
    log(f"   커버된 그룹         : {covered}/{len(groups)} "
        f"({covered / len(groups) * 100:.1f}%)")
    log(f"   QID 매칭 실패       : {len(unresolved)}개")
    log(f"   멤버 데이터 없음    : {len(empty_groups)}개")
    log(f"   보완 대상 목록      : '{os.path.basename(UNRESOLVED_CSV)}'")


if __name__ == "__main__":
    sys.exit(main())
