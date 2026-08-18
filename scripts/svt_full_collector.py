import os
import asyncio
import random
import aiohttp
import cv2
import numpy as np
from PIL import Image
from io import BytesIO
from playwright.async_api import async_playwright

SAVE_BASE_DIR = r"D:\StanPC\downloaded_pcs\seventeen"
os.makedirs(SAVE_BASE_DIR, exist_ok=True)

# 세븐틴 13인 전원 1차 쿼리 매니페스트 (6대 카테고리: fml, seventeenth_heaven, 17_is_right_here, spill_the_feels, lucky_draw, pob)
SVT_MEMBERS = [
    {
        "member_id": "scoups",
        "member_name": "에스쿱스 (S.COUPS)",
        "tasks": [
            {"category": "fml", "query": "SEVENTEEN Scoups FML photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "seventeenth_heaven", "query": "SEVENTEEN Scoups Seventeenth Heaven photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "17_is_right_here", "query": "SEVENTEEN Scoups 17 IS RIGHT HERE photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "spill_the_feels", "query": "SEVENTEEN Scoups SPILL THE FEELS photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "lucky_draw", "query": "SEVENTEEN Scoups lucky draw photocard scan official", "target_n": 8, "limit_2n": 24},
            {"category": "pob", "query": "SEVENTEEN Scoups weverse pob photocard official scan", "target_n": 8, "limit_2n": 24},
        ]
    },
    {
        "member_id": "jeonghan",
        "member_name": "정한 (Jeonghan)",
        "tasks": [
            {"category": "fml", "query": "SEVENTEEN Jeonghan FML photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "seventeenth_heaven", "query": "SEVENTEEN Jeonghan Seventeenth Heaven photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "17_is_right_here", "query": "SEVENTEEN Jeonghan 17 IS RIGHT HERE photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "spill_the_feels", "query": "SEVENTEEN Jeonghan SPILL THE FEELS photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "lucky_draw", "query": "SEVENTEEN Jeonghan lucky draw photocard scan official", "target_n": 8, "limit_2n": 24},
            {"category": "pob", "query": "SEVENTEEN Jeonghan weverse pob photocard official scan", "target_n": 8, "limit_2n": 24},
        ]
    },
    {
        "member_id": "joshua",
        "member_name": "조슈아 (Joshua)",
        "tasks": [
            {"category": "fml", "query": "SEVENTEEN Joshua FML photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "seventeenth_heaven", "query": "SEVENTEEN Joshua Seventeenth Heaven photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "17_is_right_here", "query": "SEVENTEEN Joshua 17 IS RIGHT HERE photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "spill_the_feels", "query": "SEVENTEEN Joshua SPILL THE FEELS photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "lucky_draw", "query": "SEVENTEEN Joshua lucky draw photocard scan official", "target_n": 8, "limit_2n": 24},
            {"category": "pob", "query": "SEVENTEEN Joshua weverse pob photocard official scan", "target_n": 8, "limit_2n": 24},
        ]
    },
    {
        "member_id": "jun",
        "member_name": "준 (Jun)",
        "tasks": [
            {"category": "fml", "query": "SEVENTEEN Jun FML photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "seventeenth_heaven", "query": "SEVENTEEN Jun Seventeenth Heaven photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "17_is_right_here", "query": "SEVENTEEN Jun 17 IS RIGHT HERE photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "spill_the_feels", "query": "SEVENTEEN Jun SPILL THE FEELS photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "lucky_draw", "query": "SEVENTEEN Jun lucky draw photocard scan official", "target_n": 8, "limit_2n": 24},
            {"category": "pob", "query": "SEVENTEEN Jun weverse pob photocard official scan", "target_n": 8, "limit_2n": 24},
        ]
    },
    {
        "member_id": "hoshi",
        "member_name": "호시 (Hoshi)",
        "tasks": [
            {"category": "fml", "query": "SEVENTEEN Hoshi FML photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "seventeenth_heaven", "query": "SEVENTEEN Hoshi Seventeenth Heaven photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "17_is_right_here", "query": "SEVENTEEN Hoshi 17 IS RIGHT HERE photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "spill_the_feels", "query": "SEVENTEEN Hoshi SPILL THE FEELS photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "lucky_draw", "query": "SEVENTEEN Hoshi lucky draw photocard scan official", "target_n": 8, "limit_2n": 24},
            {"category": "pob", "query": "SEVENTEEN Hoshi weverse pob photocard official scan", "target_n": 8, "limit_2n": 24},
        ]
    },
    {
        "member_id": "wonwoo",
        "member_name": "원우 (Wonwoo)",
        "tasks": [
            {"category": "fml", "query": "SEVENTEEN Wonwoo FML photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "seventeenth_heaven", "query": "SEVENTEEN Wonwoo Seventeenth Heaven photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "17_is_right_here", "query": "SEVENTEEN Wonwoo 17 IS RIGHT HERE photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "spill_the_feels", "query": "SEVENTEEN Wonwoo SPILL THE FEELS photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "lucky_draw", "query": "SEVENTEEN Wonwoo lucky draw photocard scan official", "target_n": 8, "limit_2n": 24},
            {"category": "pob", "query": "SEVENTEEN Wonwoo weverse pob photocard official scan", "target_n": 8, "limit_2n": 24},
        ]
    },
    {
        "member_id": "woozi",
        "member_name": "우지 (Woozi)",
        "tasks": [
            {"category": "fml", "query": "SEVENTEEN Woozi FML photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "seventeenth_heaven", "query": "SEVENTEEN Woozi Seventeenth Heaven photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "17_is_right_here", "query": "SEVENTEEN Woozi 17 IS RIGHT HERE photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "spill_the_feels", "query": "SEVENTEEN Woozi SPILL THE FEELS photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "lucky_draw", "query": "SEVENTEEN Woozi lucky draw photocard scan official", "target_n": 8, "limit_2n": 24},
            {"category": "pob", "query": "SEVENTEEN Woozi weverse pob photocard official scan", "target_n": 8, "limit_2n": 24},
        ]
    },
    {
        "member_id": "the8",
        "member_name": "디에잇 (The8)",
        "tasks": [
            {"category": "fml", "query": "SEVENTEEN The8 FML photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "seventeenth_heaven", "query": "SEVENTEEN The8 Seventeenth Heaven photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "17_is_right_here", "query": "SEVENTEEN The8 17 IS RIGHT HERE photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "spill_the_feels", "query": "SEVENTEEN The8 SPILL THE FEELS photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "lucky_draw", "query": "SEVENTEEN The8 lucky draw photocard scan official", "target_n": 8, "limit_2n": 24},
            {"category": "pob", "query": "SEVENTEEN The8 weverse pob photocard official scan", "target_n": 8, "limit_2n": 24},
        ]
    },
    {
        "member_id": "mingyu",
        "member_name": "민규 (Mingyu)",
        "tasks": [
            {"category": "fml", "query": "SEVENTEEN Mingyu FML photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "seventeenth_heaven", "query": "SEVENTEEN Mingyu Seventeenth Heaven photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "17_is_right_here", "query": "SEVENTEEN Mingyu 17 IS RIGHT HERE photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "spill_the_feels", "query": "SEVENTEEN Mingyu SPILL THE FEELS photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "lucky_draw", "query": "SEVENTEEN Mingyu lucky draw photocard scan official", "target_n": 8, "limit_2n": 24},
            {"category": "pob", "query": "SEVENTEEN Mingyu weverse pob photocard official scan", "target_n": 8, "limit_2n": 24},
        ]
    },
    {
        "member_id": "dk",
        "member_name": "도겸 (DK)",
        "tasks": [
            {"category": "fml", "query": "SEVENTEEN DK FML photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "seventeenth_heaven", "query": "SEVENTEEN DK Seventeenth Heaven photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "17_is_right_here", "query": "SEVENTEEN DK 17 IS RIGHT HERE photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "spill_the_feels", "query": "SEVENTEEN DK SPILL THE FEELS photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "lucky_draw", "query": "SEVENTEEN DK lucky draw photocard scan official", "target_n": 8, "limit_2n": 24},
            {"category": "pob", "query": "SEVENTEEN DK weverse pob photocard official scan", "target_n": 8, "limit_2n": 24},
        ]
    },
    {
        "member_id": "seungkwan",
        "member_name": "승관 (Seungkwan)",
        "tasks": [
            {"category": "fml", "query": "SEVENTEEN Seungkwan FML photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "seventeenth_heaven", "query": "SEVENTEEN Seungkwan Seventeenth Heaven photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "17_is_right_here", "query": "SEVENTEEN Seungkwan 17 IS RIGHT HERE photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "spill_the_feels", "query": "SEVENTEEN Seungkwan SPILL THE FEELS photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "lucky_draw", "query": "SEVENTEEN Seungkwan lucky draw photocard scan official", "target_n": 8, "limit_2n": 24},
            {"category": "pob", "query": "SEVENTEEN Seungkwan weverse pob photocard official scan", "target_n": 8, "limit_2n": 24},
        ]
    },
    {
        "member_id": "vernon",
        "member_name": "버논 (Vernon)",
        "tasks": [
            {"category": "fml", "query": "SEVENTEEN Vernon FML photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "seventeenth_heaven", "query": "SEVENTEEN Vernon Seventeenth Heaven photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "17_is_right_here", "query": "SEVENTEEN Vernon 17 IS RIGHT HERE photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "spill_the_feels", "query": "SEVENTEEN Vernon SPILL THE FEELS photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "lucky_draw", "query": "SEVENTEEN Vernon lucky draw photocard scan official", "target_n": 8, "limit_2n": 24},
            {"category": "pob", "query": "SEVENTEEN Vernon weverse pob photocard official scan", "target_n": 8, "limit_2n": 24},
        ]
    },
    {
        "member_id": "dino",
        "member_name": "디노 (Dino)",
        "tasks": [
            {"category": "fml", "query": "SEVENTEEN Dino FML photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "seventeenth_heaven", "query": "SEVENTEEN Dino Seventeenth Heaven photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "17_is_right_here", "query": "SEVENTEEN Dino 17 IS RIGHT HERE photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "spill_the_feels", "query": "SEVENTEEN Dino SPILL THE FEELS photocard scan", "target_n": 8, "limit_2n": 24},
            {"category": "lucky_draw", "query": "SEVENTEEN Dino lucky draw photocard scan official", "target_n": 8, "limit_2n": 24},
            {"category": "pob", "query": "SEVENTEEN Dino weverse pob photocard official scan", "target_n": 8, "limit_2n": 24},
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

# OpenCV 정밀 필터링 함수 (BTS 완전 동일 규격)
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

    # 폴더 적재 (영문 slug 기반)
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
            for member_idx, member in enumerate(SVT_MEMBERS, 1):
                member_id = member["member_id"]
                member_name = member["member_name"]
                tasks = member["tasks"]

                print(f"\n========================================================")
                print(f"🌟 [{member_idx}/{len(SVT_MEMBERS)}] SEVENTEEN {member_name} 전 카테고리 수집 가동")
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

                if member_idx < len(SVT_MEMBERS):
                    long_break = random.uniform(15.0, 25.0)
                    print(f"\n💤 [안전 휴식] {member_name} 수집 완료. 봇 차단 방지를 위해 {long_break:.1f}초간 휴식 후 다음 멤버로 이동합니다...")
                    await asyncio.sleep(long_break)

        await browser.close()
        print("\n🎉 SEVENTEEN 13인 전원 포토카드 파이프라인 수집이 성공적으로 완료되었습니다!")

if __name__ == "__main__":
    asyncio.run(main())
