import csv
import json
import time
import requests

GROUPS_CSV = "biasroom_groups_master.csv"
DRAFT_MEMBERS_CSV = "group_members_draft.csv"
FINAL_MEMBERS_CSV = "group_members_final.csv"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Referer": "https://biasroom.com/"
}

def fill_missing_members():
    print("🚀 2단계: 누락 및 미완성 멤버 데이터 정밀 보완 시작...\n")

    # 1. 1차 수집된 멤버 데이터 로드
    existing_members = {}
    try:
        with open(DRAFT_MEMBERS_CSV, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                group = row.get("Group_Name", "").strip()
                member = row.get("Member_Name_EN", "").strip()
                if group not in existing_members:
                    existing_members[group] = set()
                existing_members[group].add(member)
    except Exception as e:
        print(f"⚠️ 1차 데이터 로드 경고: {e}")

    # 2. 전체 그룹 마스터 로드
    groups_to_check = []
    try:
        with open(GROUPS_CSV, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                groups_to_check.append({
                    "id": row.get("Group_ID", "").strip(),
                    "name": row.get("Name_EN", "").strip()
                })
    except Exception as e:
        print(f"❌ 그룹 마스터 파일 읽기 실패: {e}")
        return

    print(f"📊 총 {len(groups_to_check)}개 그룹 검토 중...")

    final_member_rows = []
    api_fetched_count = 0

    # 1차 데이터를 우선 최종 결과 리스트에 대입
    for group_name, members in existing_members.items():
        for m in members:
            final_member_rows.append({
                "Group_Name": group_name,
                "Member_Name_EN": m,
                "Source": "1차_Version_Name_Parsing"
            })

    # 3. 개별 포카 탐색 API 호출 (필요한 그룹만 보완)
    for idx, g_info in enumerate(groups_to_check, 1):
        g_id = g_info["id"]
        g_name = g_info["name"]

        # 1차 추출 결과가 없거나 멤버 수가 적은 경우 API 통해 직접 확인
        if g_name not in existing_members or len(existing_members[g_name]) < 2:
            url = f"https://biasroom.com/api/collection-items?groupId={g_id}&limit=50"
            try:
                res = requests.get(url, headers=HEADERS, timeout=5)
                if res.status_code == 200:
                    data = res.json()
                    items = data.get("items", []) if isinstance(data, dict) else data

                    found_members = set()
                    for item in items:
                        m_name = item.get("memberName") or item.get("member", {}).get("name")
                        if m_name:
                            found_members.add(m_name.strip().capitalize())

                    if found_members:
                        api_fetched_count += 1
                        for m in found_members:
                            if g_name not in existing_members or m not in existing_members[g_name]:
                                final_member_rows.append({
                                    "Group_Name": g_name,
                                    "Member_Name_EN": m,
                                    "Source": "2차_API_Direct_Fetch"
                                })

                time.sleep(0.1) # 서버 보호용 미세 대기
            except Exception:
                pass

        if idx % 100 == 0:
            print(f"  ⏳ 진행률: {idx}/{len(groups_to_check)} 그룹 처리 완료...")

    # 4. 최종 결과 CSV 저장
    if final_member_rows:
        with open(FINAL_MEMBERS_CSV, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=["Group_Name", "Member_Name_EN", "Source"])
            writer.writeheader()
            writer.writerows(final_member_rows)

        print(f"\n✅ 2단계 완료! '{FINAL_MEMBERS_CSV}' 파일 저장됨.")
        print(f"🎉 총 확정된 그룹-멤버 조합: {len(final_member_rows)}건 (API 보완: {api_fetched_count}개 그룹)")
    else:
        print("⚠️ 최종 멤버 데이터를 저장하지 못했습니다.")

if __name__ == "__main__":
    fill_missing_members()
