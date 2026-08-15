#!/usr/bin/env python3
"""Clean verification of NAVER API HUB blog search (correct host, UTF-8 safe)."""
import sys
import requests

sys.stdout.reconfigure(encoding="utf-8")

URL = "https://naverapihub.apigw.ntruss.com/search/v1/blog"
HEADERS = {
    "X-NCP-APIGW-API-KEY-ID": "po85ajzs6w",
    "X-NCP-APIGW-API-KEY": "XjLg7ll14cizFYRZo9mlqjiDLQJwpHvWVnUe4PDb",
}

query = "BTS RM 포토카드"
r = requests.get(URL, headers=HEADERS,
                 params={"query": query, "display": 5, "start": 1, "sort": "sim"},
                 timeout=15)
print("STATUS:", r.status_code)
data = r.json()
print("TOTAL RESULTS:", data.get("total"))
print()
for i, item in enumerate(data.get("items", []), 1):
    title = item["title"].replace("<b>", "").replace("</b>", "")
    print(f"{i}. {title}")
    print(f"   link: {item['link']}")
    print(f"   blogger: {item.get('bloggername', '?')} | date: {item.get('postdate', '?')}")
