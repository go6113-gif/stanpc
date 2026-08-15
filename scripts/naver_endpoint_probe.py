#!/usr/bin/env python3
"""
Probe NAVER search API host/path/header combinations to find the working one.
Reports raw status code and body snippet for every combination - no guessing.
"""

import requests
import itertools

CLIENT_ID = "po85ajzs6w"
CLIENT_SECRET = "XjLg7ll14cizFYRZo9mlqjiDLQJwpHvWVnUe4PDb"

HOSTS = [
    "https://openapi.naver.com",
    "https://naveropenapi.apigw.ntruss.com",
]

PATHS = [
    "/v1/search/blog.json",
    "/v1/search/blog",
    "/search/v1/blog",
    "/v1/search/image",
]

HEADER_SETS = {
    "NCP": {
        "X-NCP-APIGW-API-KEY-ID": CLIENT_ID,
        "X-NCP-APIGW-API-KEY": CLIENT_SECRET,
    },
    "DEVCENTER": {
        "X-Naver-Client-Id": CLIENT_ID,
        "X-Naver-Client-Secret": CLIENT_SECRET,
    },
}

PARAMS = {"query": "BTS 포토카드", "display": 3, "start": 1, "sort": "sim"}


def probe():
    results = []
    for host, path, (hname, headers) in itertools.product(
        HOSTS, PATHS, HEADER_SETS.items()
    ):
        url = host + path
        try:
            r = requests.get(url, headers=headers, params=PARAMS, timeout=10)
            body = r.text[:160].replace("\n", " ")
            results.append((r.status_code, hname, url, body))
        except Exception as e:
            results.append((-1, hname, url, f"EXC: {e}"))

    # Successes first
    results.sort(key=lambda x: (x[0] != 200, x[0]))

    print("=" * 100)
    print("NAVER SEARCH API - ENDPOINT PROBE MATRIX")
    print("=" * 100)
    for status, hname, url, body in results:
        mark = "OK  " if status == 200 else "FAIL"
        print(f"[{mark}] {status:>4} | {hname:<9} | {url}")
        print(f"            body: {body}")
    print("=" * 100)

    ok = [r for r in results if r[0] == 200]
    if ok:
        print(f"\nWORKING COMBINATIONS: {len(ok)}")
        for status, hname, url, body in ok:
            print(f"  -> {hname} headers + {url}")
    else:
        print("\nNO WORKING COMBINATION FOUND")
    return ok


if __name__ == "__main__":
    probe()
