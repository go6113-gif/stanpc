import os
import asyncio
import aiohttp
import cv2
import numpy as np
from PIL import Image
import imagehash
from io import BytesIO
from playwright.async_api import async_playwright

# 1. 경로 및 타깃 설정
SAVE_BASE_DIR = r"D:\StanPC\downloaded_pcs\bts\rm"
os.makedirs(SAVE_BASE_DIR, exist_ok=True)

TARGET_QUERIES = [
    {
        "category": "proof",
        "keyword": "BTS RM Proof photocard",
        "target_n": 4,
        "sample_limit_2n": 10
    },
    {
        "category": "indigo",
        "keyword": "BTS RM Indigo photocard",
        "target_n": 4,
        "sample_limit_2n": 10
    },
    {
        "category": "lucky_draw",
        "keyword": "BTS RM Lucky Draw photocard",
        "target_n": 6,
        "sample_limit_2n": 14
    }
]

# 2. 정밀 강화 OpenCV 노이즈 필터
def validate_photocard_image(image_bytes: bytes) -> tuple[bool, str, int, int]:
    try:
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            return False, "이미지 디코딩 실패", 0, 0

        h, w, _ = img.shape
        img_area = w * h

        # A. 세로 비율 검사 (1.25 ~ 1.8)
        ratio = h / w
        if ratio < 1.25 or ratio > 1.8:
            return False, f"비율 부적합 (ratio: {ratio:.2f})", w, h

        # B. 최소 해상도 검사
        if w < 350 or h < 500:
            return False, f"저해상도 (w:{w}, h:{h})", w, h

        # C. 엣지 밀도 검사 (템플릿 떼샷 차단)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 80, 180)
        edge_density = np.sum(edges == 255) / img_area
        if edge_density > 0.18:
            return False, f"템플릿/떼샷 감지 (Edge Density: {edge_density:.3f})", w, h

        # D. 수평 분할선 감지 (2분할 결합 차단)
        mid_y = h // 2
        mid_strip = edges[mid_y - 15:mid_y + 15, :]
        if np.sum(mid_strip == 255) / (w * 30) > 0.35:
            return False, "2분할 결합 이미지 감지", w, h

        # E. 바닥 배경/여백 과다 검출
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if contours:
            max_cnt = max(contours, key=cv2.contourArea)
            max_area = cv2.contourArea(max_cnt)
            if 0.15 * img_area < max_area < 0.75 * img_area:
                return False, f"바닥/배경 촬영샷 감지 (카드점유율: {max_area/img_area:.1%})", w, h

        # F. 손가락/피부 감지 (외곽 10% 테두리)
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        lower_skin = np.array([0, 35, 60], dtype=np.uint8)
        upper_skin = np.array([20, 255, 255], dtype=np.uint8)
        skin_mask = cv2.inRange(hsv, lower_skin, upper_skin)

        border_mask = np.zeros((h, w), dtype=np.uint8)
        margin_y, margin_x = int(h * 0.1), int(w * 0.1)
        border_mask[:margin_y, :] = 255
        border_mask[-margin_y:, :] = 255
        border_mask[:, :margin_x] = 255
        border_mask[:, -margin_x:] = 255

        border_skin = cv2.bitwise_and(skin_mask, border_mask)
        skin_ratio = np.sum(border_skin == 255) / np.sum(border_mask == 255)

        if skin_ratio > 0.08:
            return False, f"손가락/인증샷 감지 (피부비율: {skin_ratio:.2%})", w, h

        return True, "정상 스캔본", w, h

    except Exception as e:
        return False, f"검증 에러: {str(e)}", 0, 0

# 3. 비동기 다운로드 및 인메모리 정제 루프
async def process_urls(session: aiohttp.ClientSession, urls: list[str], category: str, target_n: int):
    candidates = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }

    print(f"\n⚡ [{category.upper()}] 2N 수집본 인메모리 정제 시작 (URL {len(urls)}개)")

    for idx, url in enumerate(urls, 1):
        try:
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                if resp.status != 200:
                    continue
                content = await resp.read()

                is_valid, reason, w, h = validate_photocard_image(content)
                if not is_valid:
                    print(f"  ❌ [{idx}] 탈락: {reason}")
                    continue

                pil_img = Image.open(BytesIO(content))
                p_hash = imagehash.phash(pil_img)
                resolution = w * h

                candidates.append({
                    "bytes": content,
                    "phash": p_hash,
                    "resolution": resolution,
                    "size": (w, h),
                    "pil_img": pil_img
                })
                print(f"  ✅ [{idx}] 합격 (규격: {w}x{h}) | 필터 통과")

        except Exception as e:
            print(f"  ⚠️ [{idx}] 다운로드/검증 실패: {e}")

    # pHash 유사도 그룹화 및 최고 해상도 선별
    print(f"\n🔍 [{category.upper()}] pHash 유사도 비교 -> 최고 화질 1장 선별 중...")
    final_selected = []
    
    for cand in candidates:
        matched = False
        for sel in final_selected:
            if cand["phash"] - sel["phash"] <= 7:
                matched = True
                if cand["resolution"] > sel["resolution"]:
                    sel["bytes"] = cand["bytes"]
                    sel["pil_img"] = cand["pil_img"]
                    sel["size"] = cand["size"]
                    sel["resolution"] = cand["resolution"]
                break
        if not matched:
            final_selected.append(cand)

    # 타깃 N 기준 최종 저장
    cat_dir = os.path.join(SAVE_BASE_DIR, category)
    os.makedirs(cat_dir, exist_ok=True)

    saved_count = 0
    for idx, item in enumerate(final_selected[:target_n], 1):
        file_path = os.path.join(cat_dir, f"RM_{category}_{idx:02d}.webp")
        item["pil_img"].save(file_path, "WEBP", quality=95)
        saved_count += 1
        print(f"  💾 저장 완료: {file_path} (해상도: {item['size'][0]}x{item['size'][1]})")

    print(f"🎯 [{category.upper()}] 목표 {target_n}종 중 {saved_count}종 확정 적재 완료\n")

# 4. 메인 실행 파이프라인
async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            viewport={"width": 1400, "height": 950},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        async with aiohttp.ClientSession() as http_session:
            for item in TARGET_QUERIES:
                category = item["category"]
                query = item["keyword"]
                limit_2n = item["sample_limit_2n"]
                target_n = item["target_n"]

                print(f"==================================================")
                print(f"🚀 탐색 시작: '{query}' (목표 2N: {limit_2n}개 URL)")
                print(f"==================================================")

                search_url = f"https://www.pinterest.com/search/pins/?q={query.replace(' ', '%20')}"
                await page.goto(search_url, wait_until="networkidle", timeout=30000)
                await page.wait_for_timeout(3000)

                collected_urls = set()
                scroll_attempts = 0

                while len(collected_urls) < limit_2n and scroll_attempts < 8:
                    # 모든 핀 이미지 태그 탐색
                    img_elements = await page.query_selector_all("img")
                    for img_el in img_elements:
                        src = await img_el.get_attribute("src")
                        if src and "pinimg.com" in src:
                            # 75x75 같은 초소형 프로필 아이콘 제외
                            if "/75x75/" in src:
                                continue
                            # 고화질 원본 URL로 변환
                            orig_url = src.replace("/236x/", "/originals/").replace("/474x/", "/originals/").replace("/736x/", "/originals/")
                            collected_urls.add(orig_url)
                            if len(collected_urls) >= limit_2n:
                                break

                    await page.evaluate("window.scrollBy(0, 1200);")
                    await page.wait_for_timeout(2000)
                    scroll_attempts += 1

                print(f"📌 고화질 원본 URL {len(collected_urls)}개 확보 완료. 즉시 정제 진행.")
                await process_urls(http_session, list(collected_urls), category, target_n)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())