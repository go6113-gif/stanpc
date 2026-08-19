import asyncio
import os
import re
import random
from io import BytesIO
from PIL import Image
import requests
from playwright.async_api import async_playwright

SAVE_ROOT = r"D:\StanPC\downloaded_pcs\seventeen"
TARGET_COUNT = 8

MEMBERS = {
    "scoups": {"kr": "에스쿱스", "en": "S.COUPS"},
    "jeonghan": {"kr": "정한", "en": "Jeonghan"},
    "joshua": {"kr": "조슈아", "en": "Joshua"},
    "jun": {"kr": "준", "en": "Jun"},
    "hoshi": {"kr": "호시", "en": "Hoshi"},
    "wonwoo": {"kr": "원우", "en": "Wonwoo"},
    "woozi": {"kr": "우지", "en": "Woozi"},
    "the8": {"kr": "디에잇", "en": "THE 8"},
    "mingyu": {"kr": "민규", "en": "Mingyu"},
    "dk": {"kr": "도겸", "en": "DK"},
    "seungkwan": {"kr": "승관", "en": "Seungkwan"},
    "vernon": {"kr": "버논", "en": "Vernon"},
    "dino": {"kr": "디노", "en": "Dino"}
}

CATEGORIES = {
    "fml": ["FML album photocard scan", "FML Carat ver photocard scan", "FML photocard"],
    "seventeenth_heaven": ["SEVENTEENTH HEAVEN photocard scan", "SEVENTEENTH HEAVEN carat photocard"],
    "17_is_right_here": ["17 IS RIGHT HERE photocard scan", "17 IS RIGHT HERE here ver photocard"],
    "spill_the_feels": ["SPILL THE FEELS photocard scan", "SPILL THE FEELS carat ver photocard"],
    "lucky_draw": ["lucky draw photocard soundwave m2u", "lucky draw photocard powerstation"],
    "pob": ["weverse pob photocard", "yes24 aladin pob photocard"]
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
}

def validate_and_save(img_bytes, save_path):
    try:
        img = Image.open(BytesIO(img_bytes))
        if img.mode != "RGB":
            img = img.convert("RGB")
        w, h = img.size
        ratio = h / w
        if 1.2 <= ratio <= 2.0 and w >= 220 and h >= 350:
            img.save(save_path, format="WEBP", quality=90)
            return True
    except Exception:
        pass
    return False

async def collect_category(page, m_code, m_info, cat_code, queries):
    cat_dir = os.path.join(SAVE_ROOT, m_code, cat_code)
    os.makedirs(cat_dir, exist_ok=True)

    existing = [f for f in os.listdir(cat_dir) if f.endswith(".webp")]
    if len(existing) >= TARGET_COUNT:
        return len(existing)

    saved_cnt = len(existing)
    seen_urls = set()

    for q in queries:
        if saved_cnt >= TARGET_COUNT:
            break
        full_query = f"SEVENTEEN {m_info['en']} {m_info['kr']} {q}"
        print(f"  🔎 쿼리 탐색: [{m_info['kr']}] {cat_code} -> '{full_query}'")

        try:
            url = f"https://www.pinterest.com/search/pins/?q={full_query.replace(' ', '%20')}"
            await page.goto(url, wait_until="domcontentloaded", timeout=25000)
            await asyncio.sleep(2)

            for _ in range(3):
                await page.mouse.wheel(0, 1500)
                await asyncio.sleep(1)

            content = await page.content()
            img_urls = list(set(re.findall(r'https://i\.pinimg\.com/[^"\s]+\.jpg', content)))

            for orig_url in img_urls:
                if saved_cnt >= TARGET_COUNT:
                    break
                high_res_url = re.sub(r'/(236x|474x|736x)/', '/originals/', orig_url)
                if high_res_url in seen_urls:
                    continue
                seen_urls.add(high_res_url)

                try:
                    r = requests.get(high_res_url, headers=HEADERS, timeout=7)
                    if r.status_code != 200:
                        r = requests.get(orig_url, headers=HEADERS, timeout=7)

                    if r.status_code == 200:
                        file_name = f"card_{str(saved_cnt + 1).zfill(2)}.webp"
                        dest = os.path.join(cat_dir, file_name)
                        if validate_and_save(r.content, dest):
                            saved_cnt += 1
                            print(f"    ✓ [{cat_code}] 저장 완료 (#{saved_cnt}/{TARGET_COUNT})")
                except Exception:
                    continue

        except Exception as e:
            print(f"    ⚠️ 페이지 탐색 중 일시적 오류: {e}")
            continue

    return saved_cnt

async def main():
    print("🚀 [StanPC] 세븐틴 2차 보충 수집기 (안정화/이어받기 모드) 가동...\n")
    os.makedirs(SAVE_ROOT, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--disable-dev-shm-usage", "--no-sandbox", "--disable-gpu"]
        )
        context = await browser.new_context(
            user_agent=HEADERS["User-Agent"],
            viewport={"width": 1280, "height": 800}
        )
        page = await context.new_page()

        for idx, (m_code, m_info) in enumerate(MEMBERS.items(), start=1):
            print(f"\n==================== [{idx}/13] {m_info['kr']} ({m_info['en']}) ====================")
            for cat_code, queries in CATEGORIES.items():
                await collect_category(page, m_code, m_info, cat_code, queries)
                await asyncio.sleep(random.uniform(0.5, 1.2))

        await browser.close()

    print("\n🎉 세븐틴 전체 13인 포토카드 수집 및 정제가 완료되었습니다!")

if __name__ == "__main__":
    asyncio.run(main())
