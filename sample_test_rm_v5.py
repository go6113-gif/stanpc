import os
import asyncio
import aiohttp
import cv2
import numpy as np
from PIL import Image
import imagehash
from io import BytesIO
from playwright.async_api import async_playwright

SAVE_BASE_DIR = r"D:\StanPC\downloaded_pcs\bts\rm"
os.makedirs(SAVE_BASE_DIR, exist_ok=True)

TARGET_QUERIES = [
    {
        "category": "proof",
        "keyword": "BTS RM Proof photocard scan",
        "target_n": 8,
        "sample_limit_2n": 25
    },
    {
        "category": "indigo",
        "keyword": "BTS RM Indigo photocard scan",
        "target_n": 8,
        "sample_limit_2n": 25
    },
    {
        "category": "lucky_draw",
        "keyword": "BTS RM Lucky Draw photocard scan",
        "target_n": 8,
        "sample_limit_2n": 25
    }
]

# SSIM (구조적 유사도) 함수 -> 미세한 크롭/색감 차이의 동일 도안 100% 탐지
def calculate_ssim(img1_bytes, img2_bytes):
    try:
        nparr1 = np.frombuffer(img1_bytes, np.uint8)
        nparr2 = np.frombuffer(img2_bytes, np.uint8)
        im1 = cv2.imdecode(nparr1, cv2.IMREAD_GRAYSCALE)
        im2 = cv2.imdecode(nparr2, cv2.IMREAD_GRAYSCALE)
        
        # 중앙 85% 영역 크롭 (외곽 여백 차이 배제)
        h1, w1 = im1.shape
        h2, w2 = im2.shape
        im1 = im1[int(h1*0.07):int(h1*0.93), int(w1*0.07):int(w1*0.93)]
        im2 = im2[int(h2*0.07):int(h2*0.93), int(w2*0.07):int(w2*0.93)]

        im1 = cv2.resize(im1, (200, 300))
        im2 = cv2.resize(im2, (200, 300))
        
        # 단순 상관계수 계산
        res = cv2.matchTemplate(im1, im2, cv2.TM_CCOEFF_NORMED)
        return float(res[0][0])
    except:
        return 0.0

def validate_photocard_image(image_bytes: bytes) -> tuple[bool, str, int, int]:
    try:
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            return False, "디코딩 실패", 0, 0

        h, w, _ = img.shape
        img_area = w * h

        # 1. 정규 비율 검사 (1.30 ~ 1.78)
        ratio = h / w
        if ratio < 1.30 or ratio > 1.78:
            return False, f"비율 부적합 (ratio: {ratio:.2f})", w, h

        # 2. 최소 해상도 검사
        if w < 350 or h < 500:
            return False, f"저해상도 (w:{w}, h:{h})", w, h

        # 3. 순수 인물/앞면 검사 (뒷면 텍스트/그래픽 차단)
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        lower_skin = np.array([0, 20, 45], dtype=np.uint8)
        upper_skin = np.array([25, 255, 255], dtype=np.uint8)
        skin_mask = cv2.inRange(hsv, lower_skin, upper_skin)

        cy_min, cy_max = int(h * 0.2), int(h * 0.8)
        cx_min, cx_max = int(w * 0.2), int(w * 0.8)
        center_skin = skin_mask[cy_min:cy_max, cx_min:cx_max]
        center_skin_ratio = np.sum(center_skin == 255) / ((cy_max - cy_min) * (cx_max - cx_min))

        if center_skin_ratio < 0.045:
            return False, f"인물 미감지/뒷면 의심 (중앙 피부: {center_skin_ratio:.1%})", w, h

        # 4. 템플릿/위시리스트 떼샷 격자 검출
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 60, 160)
        contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        
        small_card_boxes = 0
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if (0.005 * img_area) < area < (0.15 * img_area):
                peri = cv2.arcLength(cnt, True)
                approx = cv2.approxPolyDP(cnt, 0.04 * peri, True)
                if len(approx) == 4:
                    small_card_boxes += 1

        if small_card_boxes >= 3:
            return False, f"템플릿/떼샷 감지 ({small_card_boxes}개)", w, h

        # 5. 수평 / 수직 2분할 결합선 검사
        mid_y, mid_x = h // 2, w // 2
        mid_h_strip = edges[max(0, mid_y - 12):min(h, mid_y + 12), :]
        mid_v_strip = edges[:, max(0, mid_x - 12):min(w, mid_x + 12)]
        if np.sum(mid_h_strip == 255) / (w * 24) > 0.30 or np.sum(mid_v_strip == 255) / (h * 24) > 0.30:
            return False, "2분할 결합선 감지", w, h

        # 6. 바닥 배경샷 검출
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2)
        bg_contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if bg_contours:
            max_cnt = max(bg_contours, key=cv2.contourArea)
            max_area = cv2.contourArea(max_cnt)
            if 0.15 * img_area < max_area < 0.72 * img_area:
                return False, f"바닥/배경샷 감지 ({max_area/img_area:.1%})", w, h

        # 7. 테두리 손가락/인증샷 감지
        border_mask = np.zeros((h, w), dtype=np.uint8)
        my, mx = int(h * 0.1), int(w * 0.1)
        border_mask[:my, :] = 255
        border_mask[-my:, :] = 255
        border_mask[:, :mx] = 255
        border_mask[:, -mx:] = 255

        border_skin = cv2.bitwise_and(skin_mask, border_mask)
        skin_ratio = np.sum(border_skin == 255) / np.sum(border_mask == 255)
        if skin_ratio > 0.09:
            return False, f"손가락 감지 (테두리 피부: {skin_ratio:.2%})", w, h

        return True, "정상 스캔본", w, h

    except Exception as e:
        return False, f"검증 에러: {str(e)}", 0, 0

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
                resolution = w * h

                candidates.append({
                    "bytes": content,
                    "resolution": resolution,
                    "size": (w, h),
                    "pil_img": pil_img
                })
                print(f"  ✅ [{idx}] 합격 (규격: {w}x{h}) | 정제 통과")

        except Exception as e:
            print(f"  ⚠️ [{idx}] 실패: {e}")

    # SSIM 템플릿 매칭 기반 초정밀 중복 제거 (동일 도안 100% 병합)
    print(f"\n🔍 [{category.upper()}] SSIM 구조 유사도 비교 -> 최고 화질 1장 선별 중...")
    final_selected = []
    
    for cand in candidates:
        matched = False
        for sel in final_selected:
            sim_score = calculate_ssim(cand["bytes"], sel["bytes"])
            # 유사도 78% 이상이면 동일 도안으로 판정
            if sim_score >= 0.78:
                matched = True
                print(f"  🔄 동일 도안 발견 (유사도: {sim_score:.2%}) -> 고화질 선별 병합")
                if cand["resolution"] > sel["resolution"]:
                    sel["bytes"] = cand["bytes"]
                    sel["pil_img"] = cand["pil_img"]
                    sel["size"] = cand["size"]
                    sel["resolution"] = cand["resolution"]
                break
        if not matched:
            final_selected.append(cand)

    cat_dir = os.path.join(SAVE_BASE_DIR, category)
    os.makedirs(cat_dir, exist_ok=True)

    saved_count = 0
    for idx, item in enumerate(final_selected[:target_n], 1):
        file_path = os.path.join(cat_dir, f"RM_{category}_{idx:02d}.webp")
        item["pil_img"].save(file_path, "WEBP", quality=95)
        saved_count += 1
        print(f"  💾 확정 저장: {file_path} (해상도: {item['size'][0]}x{item['size'][1]})")

    print(f"🎯 [{category.upper()}] 목표 {target_n}종 중 {saved_count}종 고유 포토카드 적재 완료\n")

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
                print(f"🚀 정밀 탐색 시작: '{query}' (목표 2N: {limit_2n}개 URL)")
                print(f"==================================================")

                search_url = f"https://www.pinterest.com/search/pins/?q={query.replace(' ', '%20')}"
                await page.goto(search_url, wait_until="domcontentloaded", timeout=15000)
                await page.wait_for_timeout(2500)

                collected_urls = set()
                scroll_attempts = 0

                while len(collected_urls) < limit_2n and scroll_attempts < 15:
                    img_elements = await page.query_selector_all("img")
                    for img_el in img_elements:
                        src = await img_el.get_attribute("src")
                        srcset = await img_el.get_attribute("srcset")
                        
                        candidates_urls = []
                        if src and "pinimg.com" in src:
                            candidates_urls.append(src)
                        if srcset:
                            for part in srcset.split(","):
                                u = part.strip().split(" ")[0]
                                if "pinimg.com" in u:
                                    candidates_urls.append(u)

                        for target_url in candidates_urls:
                            if "/75x75/" in target_url:
                                continue
                            orig_url = target_url.replace("/236x/", "/originals/").replace("/474x/", "/originals/").replace("/736x/", "/originals/")
                            collected_urls.add(orig_url)
                            if len(collected_urls) >= limit_2n:
                                break

                    await page.evaluate("window.scrollBy(0, 1000);")
                    await page.wait_for_timeout(1200)
                    scroll_attempts += 1

                print(f"📌 고화질 원본 URL {len(collected_urls)}개 확보 완료.")
                await process_urls(http_session, list(collected_urls), category, target_n)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())