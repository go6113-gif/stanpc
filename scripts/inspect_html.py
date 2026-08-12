import json
import re

with open('data/dcinside_raw.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    html = data[0]['html']

print(f"HTML 크기: {len(html)} bytes\n")

# 주요 클래스 추출
classes = re.findall(r'class=["\']([^"\']*)["\']', html)
unique_classes = sorted(set(classes))

print("발견된 주요 클래스:")
for cls in unique_classes[:50]:
    if cls.strip():
        print(f"  • {cls}")

print("\n" + "="*60)

# 검색 결과 패턴 찾기
if '<ul' in html and '<li' in html:
    print("\n✓ <ul>/<li> 구조 발견")
    ul_matches = re.finditer(r'<ul[^>]*class="([^"]*)"[^>]*>.*?<li', html)
    for match in list(ul_matches)[:3]:
        print(f"  - class: {match.group(1)}")

# 게시글 패턴 찾기
print("\n게시글 관련 패턴:")
# 제목 같은 텍스트
title_patterns = re.findall(r'<a[^>]*href="[^"]*gall[^"]*"[^>]*title="([^"]*)"[^>]*>([^<]*)</a>', html)
if title_patterns:
    print(f"  ✓ 갤러리 링크 발견: {len(title_patterns)}개")
    for title, text in title_patterns[:3]:
        print(f"    - title attr: {title[:50]}")
        print(f"    - text: {text[:50]}")

print("\n날짜/시간 패턴:")
date_patterns = re.findall(r'<(?:span|em|time)[^>]*>(\d{4}-\d{2}-\d{2}|\d{1,2}:\d{2}|오늘|어제)[^<]*</(?:span|em|time)>', html)
if date_patterns:
    print(f"  ✓ 발견: {len(date_patterns)}개")
    for date in date_patterns[:5]:
        print(f"    - {date}")

print("\n댓글 수 패턴:")
comment_patterns = re.findall(r'>(\d+)<', html[:10000])  # 처음 부분만
if comment_patterns:
    print(f"  ✓ 발견: {comment_patterns[:10]}")

# 실제 게시글 HTML 샘플
print("\n" + "="*60)
print("\n첫 게시글 관련 HTML (2000자):")
if '<li' in html:
    li_idx = html.find('<li')
    if li_idx != -1:
        li_end = html.find('</li>', li_idx) + 5
        sample = html[li_idx:min(li_end, li_idx+2000)]
        print(sample)
