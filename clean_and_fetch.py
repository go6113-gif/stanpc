import csv
import re
import time
import requests

# 불필요한 단어나 버전명이 멤버로 잘못 들어간 것들을 거르는 필터 세트
INVALID_MEMBER_WORDS = {
    "standard", "normal", "acoustic", "solid", "lp", "black", "gray", "white",
    "version", "ver", "solo", "jacket", "limited", "edition", "regular", "vinyl",
    "exclusive", "cover", "photobook", "digipack", "set", "cd", "dvd", "bluray",
    "poster", "member", "random", "first", "press", "special", "hip", "new"
}

INPUT_CSV = "group_members_final.csv"
CLEANED_CSV = "group_members_cleaned.csv"

def clean_members():
    print("🧹 멤버 데이터 노이즈 정제 시작...")
    cleaned_rows = []
    
    with open(INPUT_CSV, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            group = row.get("Group_Name", "").strip()
            member = row.get("Member_Name_EN", "").strip()
            source = row.get("Source", "").strip()
            
            # 노이즈 단어에 해당하거나 길이가 1 이하인 경우 제외
            if member.lower() in INVALID_MEMBER_WORDS or len(member) <= 1:
                continue
            # 숫자로만 이루어진 경우 제외
            if member.isdigit():
                continue
                
            cleaned_rows.append({
                "Group_Name": group,
                "Member_Name_EN": member,
                "Source": source
            })

    # 중복 제거 (Group_Name, Member_Name_EN 기준)
    unique_set = set()
    final_rows = []
    for r in cleaned_rows:
        identifier = (r["Group_Name"], r["Member_Name_EN"])
        if identifier not in unique_set:
            unique_set.add(identifier)
            final_rows.append(r)

    with open(CLEANED_CSV, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["Group_Name", "Member_Name_EN", "Source"])
        writer.writeheader()
        writer.writerows(final_rows)

    print(f"✅ 정제 완료! '{CLEANED_CSV}' 저장됨 (유효 멤버 조합: {len(final_rows)}건)\n")

if __name__ == "__main__":
    clean_members()
