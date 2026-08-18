import os
import asyncio
import random
import aiohttp
import cv2
import numpy as np
from PIL import Image
from io import BytesIO
from playwright.async_api import async_playwright

SAVE_BASE_DIR = r"D:\StanPC\downloaded_pcs\bts"
os.makedirs(SAVE_BASE_DIR, exist_ok=True)

# BTS 7인 전원 쿼리 매니페스트
BTS_MEMBERS = [
    {
        "member_id": "rm",
        "member_name": "RM (김남준)",
        "tasks": [
            {"category": "proof", "query": "BTS RM Proof photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "indigo", "query": "BTS RM Indigo photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "rpwp", "query": "BTS RM Right Place Wrong Person photocard", "target_n": 8, "limit_2n": 24},
            {"category": "lucky_draw", "query": "BTS RM Lucky Draw photocard official", "target_n": 8, "limit_2n": 24},
            {"category": "pob", "query": "BTS RM weverse pob photocard official", "target_n": 8, "limit_2n": 24},
        ]
    },
    {
        "member_id": "jin",
        "member_name": "Jin (김석진)",
        "tasks": [
            {"category": "proof", "query": "BTS Jin Proof photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "astronaut", "query": "BTS Jin The Astronaut photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "happy", "query": "BTS Jin Happy photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "lucky_draw", "query": "BTS Jin Lucky Draw photocard official", "target_n": 8, "limit_2n": 24},
            {"category": "pob", "query": "BTS Jin weverse pob photocard official", "target_n": 8, "limit_2n": 24},
        ]
    },
    {
        "member_id": "suga",
        "member_name": "SUGA (민윤기)",
        "tasks": [
            {"category": "proof", "query": "BTS SUGA Proof photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "ddrive", "query": "BTS SUGA Agust D D-DAY photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "lucky_draw", "query": "BTS SUGA Lucky Draw photocard official", "target_n": 8, "limit_2n": 24},
            {"category": "pob", "query": "BTS SUGA weverse pob photocard official", "target_n": 8, "limit_2n": 24},
        ]
    },
    {
        "member_id": "jhope",
        "member_name": "j-hope (정호석)",
        "tasks": [
            {"category": "proof", "query": "BTS j-hope Proof photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "jitb", "query": "BTS j-hope Jack In The Box photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "hope_on_the_street", "query": "BTS j-hope HOPE ON THE STREET photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "lucky_draw", "query": "BTS j-hope Lucky Draw photocard official", "target_n": 8, "limit_2n": 24},
            {"category": "pob", "query": "BTS j-hope weverse pob photocard official", "target_n": 8, "limit_2n": 24},
        ]
    },
    {
        "member_id": "jimin",
        "member_name": "Jimin (박지민)",
        "tasks": [
            {"category": "proof", "query": "BTS Jimin Proof photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "face", "query": "BTS Jimin FACE photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "muse", "query": "BTS Jimin MUSE photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "lucky_draw", "query": "BTS Jimin Lucky Draw photocard official", "target_n": 8, "limit_2n": 24},
            {"category": "pob", "query": "BTS Jimin weverse pob photocard official", "target_n": 8, "limit_2n": 24},
        ]
    },
    {
        "member_id": "v",
        "member_name": "V (김태형)",
        "tasks": [
            {"category": "proof", "query": "BTS V Proof photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "layover", "query": "BTS V Layover photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "lucky_draw", "query": "BTS V Lucky Draw photocard official", "target_n": 8, "limit_2n": 24},
            {"category": "pob", "query": "BTS V weverse pob photocard official", "target_n": 8, "limit_2n": 24},
        ]
    },
    {
        "member_id": "jungkook",
        "member_name": "Jungkook (전정국)",
        "tasks": [
            {"category": "proof", "query": "BTS Jungkook Proof photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "golden", "query": "BTS Jungkook Golden photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "lucky_draw", "query": "BTS Jungkook Lucky Draw photocard official", "target_n": 8, "limit_2n": 24},
            {"category": "pob", "query": "BTS Jungkook weverse pob photocard official", "target_n": 8, "limit_2n": 24},
        ]
    }
]

# SSIM 구조적 유사도 비교
def calculate_ssim(img1_bytes, img2_bytes):
    try:
        nparr1 = np.frombuffer(img1_bytes, np.uint8)
        nparr2 = np.frombuffer(img2_bytes, np.uint8)
        im1 = cv2.imdecode(nparr1, cv2.IMREAD_GRAYSCALE)
        im2 = cv2.imdecode(nparr2, cv2.IMREAD_GRAYSCALE)
        
        h1, w1 = im1.shape
        h2, w2 = im2.shape
        im1 = im1[int(h1*0.07):int(h1*0.93), int(w1*0.07):int(w1*0.93)]
        im2 = im2[int(h2*0.07):int(h2*0.93), int(w2*0.07):int(w2*0.93)]

        im1 = cv2.resize(im1, (200, 300))
        im2 = cv2.resize(im2, (200, 300))
        
        res = cv2.matchTemplate(im1, im2, cv2.TM_CCOEFF_NORMED)
        return float(res[0][0])
    except:
        return 0.0

# OpenCV 정밀 필터링 함수
def validate_photocard_image(image_bytes: bytes) -> tuple[bool, str, int, int]:
    try:
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            return False, "디코딩 실패", 0, 0

        h, w, _ = img.shape
        img_area = w * h

        # 1. 비율 검사 (1.20 ~ 1.82)
        ratio = h / w
        if ratio < 1.20 or ratio > 1.82:
            return False, f"비율 부적합 ({ratio:.2f})", w, h

        # 2. 최소 해상도 검사
        if w < 320 or h < 480:
            return False, f"저해상도 ({w}x{h})", w, h

        # 3. 텍스트 북클릿 / 단색 싸인 뒷면 카드 영구 차단
        center = img[int(h*0.2):int(h*0.8), int(w*0.2):int(w*0.8)]
        gray_center = cv2.cvtColor(center, cv2.COLOR_BGR2GRAY)
        hist = cv2.calcHist([gray_center], [0], None, [256], [0, 256])
        top_color_ratio = np.max(hist) / (center.shape[0] * center.shape[1])

        # 단일 색상이 42% 이상이면 텍스트/단색 배경 카드 판정
        if top_color_ratio > 0.42:
            return False, f"단색 배경 텍스트/뒷면 감지 (단색비율: {top_color_ratio:.1%})", w, h

        # HSV 피부색 및 채도 검사
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        center_hsv = hsv[int(h*0.2):int(h*0.8), int(w*0.2):int(w*0.8)]
        lower_skin = np.array([0, 20, 45], dtype=np.uint8)
        upper_skin = np.array([25, 255, 255], dtype=np.uint8)
        skin_mask = cv2.inRange(center_hsv, lower_skin, upper_skin)
        skin_ratio = np.sum(skin_mask == 255) / (center.shape[0] * center.shape[1])
        
        sat_mean = np.mean(center_hsv[:, :, 1])
        if sat_mean > 25 and skin_ratio < 0.035:
            return False, f"컬러 뒷면/로고 카드 감지 (피부비율: {skin_ratio:.1%})", w, h

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
        if np.sum(mid_h_strip == 255) / (w * 24) > 0.32 or np.sum(mid_v_strip == 255) / (h * 24) > 0.32:
            return False, "2분할 결합선 감지", w, h

        # 6. 바닥 배경샷 검출
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2)
        bg_contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if bg_contours:
            max_cnt = max(bg_contours, key=cv2.contourArea)
            max_area = cv2.contourArea(max_cnt)
            if 0.15 * img_area < max_area < 0.70 * img_area:
                return False, f"바닥/배경샷 감지 ({max_area/img_area:.1%})", w, h

        # 7. 테두리 손가락 감지
        full_skin_mask = cv2.inRange(hsv, lower_skin, upper_skin)
        border_mask = np.zeros((h, w), dtype=np.uint8)
        my, mx = int(h * 0.1), int(w * 0.1)
        border_mask[:my, :] = 255
        border_mask[-my:, :] = 255
        border_mask[:, :mx] = 255
        border_mask[:, -mx:] = 255

        border_skin = cv2.bitwise_and(full_skin_mask, border_mask)
        border_skin_ratio = np.sum(border_skin == 255) / np.sum(border_mask == 255)
        if border_skin_ratio > 0.09:
            return False, f"손가락 감지 ({border_skin_ratio:.2%})", w, h

        return True, "정상 스캔본", w, h

    except Exception as e:
        return False, f"검증 에러: {str(e)}", 0, 0

# 인메모리 정제 및 저장
async def process_urls(session: aiohttp.ClientSession, urls: list[str], member_id: str, category: str, target_n: int):
    candidates = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }

    print(f"\n⚡ [{member_id.upper()} - {category.upper()}] 정제 시작 (URL {len(urls)}개)")

    for idx, url in enumerate(urls, 1):
        try:
            await asyncio.sleep(random.uniform(0.1, 0.25))
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                if resp.status != 200:
                    continue
                content = await resp.read()

                is_valid, reason, w, h = validate_photocard_image(content)
                if not is_valid:
                    print(f"  ❌ [{idx:02d}] 탈락: {reason}")
                    continue

                pil_img = Image.open(BytesIO(content))
                resolution = w * h

                candidates.append({
                    "bytes": content,
                    "resolution": resolution,
                    "size": (w, h),
                    "pil_img": pil_img
                })
                print(f"  ✅ [{idx:02d}] 합격 ({w}x{h})")

        except Exception as e:
            print(f"  ⚠️ [{idx:02d}] 실패: {e}")

    # SSIM 기반 중복 병합
    print(f"🔍 [{member_id.upper()} - {category.upper()}] SSIM 구조 유사도 분석 -> 최고 화질 선별 중...")
    final_selected = []
    
    for cand in candidates:
        matched = False
        for sel in final_selected:
            sim_score = calculate_ssim(cand["bytes"], sel["bytes"])
            if sim_score >= 0.78:
                matched = True
                print(f"  🔄 동일 도안 발견 ({sim_score:.1%}) -> 최고 해상도로 병합")
                if cand["resolution"] > sel["resolution"]:
                    sel["bytes"] = cand["bytes"]
                    sel["pil_img"] = cand["pil_img"]
                    sel["size"] = cand["size"]
                    sel["resolution"] = cand["resolution"]
                break
        if not matched:
            final_selected.append(cand)

    # 폴더 적재
    cat_dir = os.path.join(SAVE_BASE_DIR, member_id, category)
    os.makedirs(cat_dir, exist_ok=True)

    saved_count = 0
    for idx, item in enumerate(final_selected[:target_n], 1):
        file_name = f"{member_id}_{category}_{idx:02d}.webp"
        file_path = os.path.join(cat_dir, file_name)
        item["pil_img"].save(file_path, "WEBP", quality=95)
        saved_count += 1
        print(f"  💾 확정 저장: {file_name} ({item['size'][0]}x{item['size'][1]})")

    print(f"🎯 [{member_id.upper()} - {category.upper()}] 목표 {target_n}종 중 {saved_count}종 고유 포토카드 적재 완료\n")

# 메인 크롤러 루프
async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            viewport={"width": 1440, "height": 960},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        async with aiohttp.ClientSession() as http_session:
            for member_idx, member in enumerate(BTS_MEMBERS, 1):
                member_id = member["member_id"]
                member_name = member["member_name"]
                tasks = member["tasks"]

                print(f"\n========================================================")
                print(f"🌟 [{member_idx}/{len(BTS_MEMBERS)}] BTS {member_name} 전 카테고리 수집 가동")
                print(f"========================================================")

                for task in tasks:
                    cat = task["category"]
                    query = task["query"]
                    limit_2n = task["limit_2n"]
                    target_n = task["target_n"]

                    print(f"🔎 탐색 쿼리: '{query}' (목표 2N: {limit_2n}개 URL)")

                    search_url = f"https://www.pinterest.com/search/pins/?q={query.replace(' ', '%20')}"
                    await page.goto(search_url, wait_until="domcontentloaded", timeout=20000)
                    await page.wait_for_timeout(random.randint(2000, 3500))

                    collected_urls = set()
                    scroll_attempts = 0

                    while len(collected_urls) < limit_2n and scroll_attempts < 16:
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

                        scroll_step = random.randint(900, 1400)
                        await page.evaluate(f"window.scrollBy(0, {scroll_step});")
                        await page.wait_for_timeout(random.randint(1200, 2200))
                        scroll_attempts += 1

                    print(f"📌 고화질 원본 URL {len(collected_urls)}개 확보.")
                    await process_urls(http_session, list(collected_urls), member_id, cat, target_n)

                    query_rest = random.uniform(3.0, 5.5)
                    print(f"☕ 쿼리 전환 대기: {query_rest:.1f}초 휴식 중...")
                    await asyncio.sleep(query_rest)

                if member_idx < len(BTS_MEMBERS):
                    long_break = random.uniform(15.0, 25.0)
                    print(f"\n💤 [안전 휴식] {member_name} 수집 완료. 봇 차단 방지를 위해 {long_break:.1f}초간 휴식 후 다음 멤버로 이동합니다...")
                    await asyncio.sleep(long_break)

        await browser.close()
        print("\n🎉 BTS 7인 전원 포토카드 파이프라인 수집이 성공적으로 완료되었습니다!")

if __name__ == "__main__":
    asyncio.run(main())