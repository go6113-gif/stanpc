import csv
import re

INPUT_CSV = "biasroom_photocards_master.csv"
OUTPUT_MEMBERS_CSV = "group_members_draft.csv"

EXCLUDE_WORDS = {
    "solo", "jacket", "version", "ver", "limited", "edition", "regular",
    "vinyl", "exclusive", "cover", "photobook", "digipack", "set", "cd",
    "dvd", "bluray", "poster", "member", "random", "first", "press", "special"
}

def extract_members():
    print("🔎 D:\\Poca_exchange 의 데이터(Version_Name) 기반 멤버 1차 파싱 시작...\n")
    
    group_members_map = {}

    try:
        with open(INPUT_CSV, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                group = row.get("Group_Name", "").strip()
                version_name = row.get("Version_Name", "").strip()

                if not group or not version_name:
                    continue

                words = re.findall(r'[A-Za-z]+', version_name)
                for w in words:
                    w_clean = w.strip()
                    if w_clean.lower() not in EXCLUDE_WORDS and len(w_clean) > 1:
                        if group not in group_members_map:
                            group_members_map[group] = set()
                        group_members_map[group].add(w_clean.capitalize())

    except Exception as e:
        print(f"❌ 파일 읽기 에러: {e}")
        return

    member_rows = []
    for group, members in group_members_map.items():
        for m in sorted(members):
            member_rows.append({
                "Group_Name": group,
                "Member_Name_EN": m
            })

    if member_rows:
        with open(OUTPUT_MEMBERS_CSV, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=["Group_Name", "Member_Name_EN"])
            writer.writeheader()
            writer.writerows(member_rows)

        print(f"✅ 1차 추출 완료!")
        print(f"📁 파일 저장됨: '{OUTPUT_MEMBERS_CSV}'")
        print(f"📊 감지된 그룹-멤버 조합: 총 {len(member_rows)}건\n")
    else:
        print("⚠️ 추출된 멤버 데이터가 없습니다.")

if __name__ == "__main__":
    extract_members()
