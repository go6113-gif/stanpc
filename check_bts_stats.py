import os
from PIL import Image

BASE_DIR = r"D:\StanPC\downloaded_pcs\bts"

def check_dataset_stats():
    if not os.path.exists(BASE_DIR):
        print(f"❌ 폴더를 찾을 수 없습니다: {BASE_DIR}")
        return

    print("=" * 70)
    print("📊 [StanPC] BTS 포토카드 데이터셋 무결성 & 수량 종합 리포트")
    print("=" * 70)

    total_images = 0
    members = sorted(os.listdir(BASE_DIR))

    for member in members:
        member_dir = os.path.join(BASE_DIR, member)
        if not os.path.isdir(member_dir):
            continue

        print(f"\n👤 멤버: [{member.upper()}]")
        member_total = 0
        categories = sorted(os.listdir(member_dir))

        for cat in categories:
            cat_dir = os.path.join(member_dir, cat)
            if not os.path.isdir(cat_dir):
                continue

            files = [f for f in os.listdir(cat_dir) if f.endswith(".webp")]
            count = len(files)
            member_total += count
            total_images += count

            # 해상도 샘플 체크
            resolutions = []
            for f in files[:3]: # 카테고리당 최대 3장 샘플링
                try:
                    with Image.open(os.path.join(cat_dir, f)) as img:
                        resolutions.append(f"{img.width}x{img.height}")
                except:
                    pass
            res_str = ", ".join(resolutions) if resolutions else "N/A"
            print(f"  └ 📁 {cat.ljust(15)} : {str(count).rjust(2)}장 (해상도 샘플: {res_str})")

        print(f"  👉 {member.upper()} 소계: {member_total}장")

    print("\n" + "=" * 70)
    print(f"🎉 BTS 7인 마스터 데이터셋 총합: {total_images}장 확보 완료")
    print("=" * 70)

if __name__ == "__main__":
    check_dataset_stats()