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

# V(뷔) 누락분 집중 타깃 세부 쿼리 매니페스트 (멤버 확장 가능)
SUPPLEMENT_TARGETS = [
    {
        "member_id": "v",
        "member_name": "V (김태형)",
        "tasks": [
            # Layover 앨범 버전별 & 특전 세분화
            {"category": "layover", "query": "BTS V Layover Blue photocard scan", "target_n": 8, "limit_2n": 35},
            {"category": "layover", "query": "BTS V Layover Green photocard scan", "target_n": 8, "limit_2n": 35},
            {"category": "layover", "query": "BTS V Layover Purple photocard scan", "target_n": 8, "limit_2n": 35},
            {"category": "layover", "query": "BTS V Layover Weverse version photocard scan", "target_n": 8, "limit_2n": 35},
            # 유통사별 럭키드로우 세분화
            {"category": "lucky_draw", "query": "BTS V Layover Soundwave lucky draw scan", "target_n": 6, "limit_2n": 30},
            {"category": "lucky_draw", "query": "BTS V Layover M2U lucky draw scan", "target_n": 6, "limit_2n": 30},
            {"category": "lucky_draw", "query": "BTS V Layover Powerstation lucky draw scan", "target_n": 6, "limit_2n": 30},
            {"category": "lucky_draw", "query": "BTS V Proof lucky draw official scan", "target_n": 6, "limit_2n": 30},
            # POB / 글로벌 한정판
            {"category": "pob", "query": "BTS V Layover Weverse shop POB early bird photocard", "target_n": 6, "limit_2n": 30},
            {"category": "pob", "query": "BTS V Layover Japan FC official photocard scan", "target_n": 6, "limit_2n": 30},
            {"category": "pob", "query": "BTS V Layover Universal Music Store photocard", "target_n": 6, "limit_2n": 30},
            # Proof 앤솔러지 누락분
            {"category": "proof", "query": "BTS V Proof Collector edition photocard scan", "target_n": 6, "limit_2n": 30},
            {"category": "proof", "query": "BTS V Proof Compact edition photocard scan", "target_n": 6, "limit_2n": 30},
        ]
    }
]

def calculate_ssim(img1_bytes, img2_bytes):
    try:
        nparr1 = np.frombuffer(img1_bytes, np.uint8)
        nparr2 = np.frombuffer(img2_bytes, np.uint8)
        im1 = cv2.imdecode(nparr1, cv2.IMREAD_GRAYSCALE)
        im2 = cv2.imdecode(nparr2, cv2.IMREAD_GRAYSCALE)
        if im1 is None or im2 is None:
            return 0.0

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

def validate_photocard_image(image_bytes: bytes) -> tuple[bool, str, int, int]:
    try:
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            return False, "디코딩 실패", 0, 0

        h, w, _ = img.shape
        img_area = w * h

        # 1. 비율 검사
        ratio = h / w
        if ratio < 1.20 or ratio > 1.82:
            return False, f"비율 부적합 ({ratio:.2f})", w, h

        # 2. 최소 해상도 검사
        if w < 320 or h < 480:
            return False, f"저해상도 ({w}x{h})", w, h

        # 3. 단색 배경 텍스트/뒷면 검사
        center = img[int(h*0.2):int(h*0.8), int(w*0.2):int(w*0.8)]
        gray_center = cv2.cvtColor(center, cv2.COLOR_BGR2GRAY)
        hist = cv2.calcHist([gray_center], [0], None, [256], [0, 256])
        top_color_ratio = np.max(hist) / (center.shape[0] * center.shape[1])
        if top_color_ratio > 0.42:
            return False, f"단색 배경/텍스트 감지 ({top_color_ratio:.1%})", w, h

        # HSV 피부색/채도 검사
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        center_hsv = hsv[int(h*0.2):int(h*0.8), int(w*0.2):int(w*0.8)]
        lower_skin = np.array([0, 20, 45], dtype=np.uint8)
        upper_skin = np.array([25, 255, 255], dtype=np.uint8)
        skin_mask = cv2.inRange(center_hsv, lower_skin, upper_skin)
        skin_ratio = np.sum(skin_mask == 255) / (center.shape[0] * center.shape[1])
        sat_mean = np.mean(center_hsv[:, :, 1])
        if sat_mean > 25 and skin_ratio < 0.035:
            return False, f"컬러 뒷면/로고 의심 (피부: {skin_ratio:.1%})", w, h

        # 4. 템플릿/떼샷 격자 검출
        edges = cv2.Canny(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), 60, 160)
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

        # 5. 테두리 손가락 감지
        border_mask = np.zeros((h, w), dtype=np.uint8)
        my, mx = int(h * 0.1), int(w * 0.1)
        border_mask[:my, :] = 255
        border_mask[-my:, :] = 255
        border_mask[:, :mx] = 255
        border_mask[:, -mx:] = 255
        full_skin_mask = cv2.inRange(hsv, lower_skin, upper_skin)
        border_skin = cv2.bitwise_and(full_skin_mask, border_mask)
        border_skin_ratio = np.sum(border_skin == 255) / np.sum(border_mask == 255)
        if border_skin_ratio > 0.09:
            return False, f"손가락 감지 ({border_skin_ratio:.2%})", w, h

        return True, "정상 스캔본", w, h
    except Exception as e:
        return False, f"검증 에러: {str(e)}", 0, 0

# 기존 폴더에 이미 저장된 파일들의 바이너리 로드
def load_existing_cards(cat_dir: str) -> list[bytes]:
    existing_bytes = []
    if not os.path.exists(cat_dir):
        return existing_bytes
    for fname in os.listdir(cat_dir):
        if fname.endswith(".webp"):
            fpath = os.path.join(cat_dir, fname)
            try:
                with open(fpath, "rb") as f:
                    existing_bytes.append(f.read())
            except:
                pass
    return existing_bytes

async def process_supplement_urls(session: aiohttp.ClientSession, urls: list[str], member_id: str, category: str, target_n: int):
    cat_dir = os.path.join(SAVE_BASE_DIR, member_id, category)
    os.makedirs(cat_dir, exist_ok=True)

    # 1. 기존에 이미 확보된 카드 로드 (중복 저장 방지용)
    existing_cards = load_existing_cards(cat_dir)
    existing_file_count = len(existing_cards)
    print(f"📁 [{member_id.upper()} - {category.upper()}] 기존 확보 카드: {existing_file_count}장 로드됨")

    candidates = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }

    print(f"⚡ 2N 수집본 인메모리 정제 시작 (URL {len(urls)}개)")

    for idx, url in enumerate(urls, 1):
        try:
            await asyncio.sleep(random.uniform(0.1, 0.25))
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                if resp.status != 200:
                    continue
                content = await resp.read()

                is_valid, reason, w, h = validate_photocard_image(content)
                if not is_valid:
                    continue

                # 2. 기존 폴더의 카드들과 교차 SSIM 비교 -> 이미 있는 도안이면 자동 패스
                is_already_collected = False
                for ex_bytes in existing_cards:
                    if calculate_ssim(content, ex_bytes) >= 0.78:
                        is_already_collected = True
                        break

                if is_already_collected:
                    print(f"  ⏭️ [{idx:02d}] 이미 수집된 기존 도안 -> 스킵")
                    continue

                pil_img = Image.open(BytesIO(content))
                resolution = w * h
                candidates.append({
                    "bytes": content,
                    "resolution": resolution,
                    "size": (w, h),
                    "pil_img": pil_img
                })
                print(f"  ✨ [{idx:02d}] 새로운 누락 도안 발굴 합격! ({w}x{h})")

        except Exception as e:
            pass

    # 3. 신규 후보군 내부 SSIM 중복 제거
    final_new_selected = []
    for cand in candidates:
        matched = False
        for sel in final_new_selected:
            if calculate_ssim(cand["bytes"], sel["bytes"]) >= 0.78:
                matched = True
                if cand["resolution"] > sel["resolution"]:
                    sel["bytes"] = cand["bytes"]
                    sel["pil_img"] = cand["pil_img"]
                    sel["size"] = cand["size"]
                    sel["resolution"] = cand["resolution"]
                break
        if not matched:
            final_new_selected.append(cand)

    # 4. 누적 파일명으로 추가 저장
    saved_count = 0
    start_idx = existing_file_count + 1
    for idx, item in enumerate(final_new_selected[:target_n], start_idx):
        file_name = f"{member_id}_{category}_{idx:02d}.webp"
        file_path = os.path.join(cat_dir, file_name)
        item["pil_img"].save(file_path, "WEBP", quality=95)
        saved_count += 1
        print(f"  💾 신규 보충 저장: {file_name} ({item['size'][0]}x{item['size'][1]})")

    print(f"🎯 [{member_id.upper()} - {category.upper()}] 신규 {saved_count}종 추가 누적 (총 {existing_file_count + saved_count}종 완성)\n")

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            viewport={"width": 1440, "height": 960},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        async with aiohttp.ClientSession() as http_session:
            for member in SUPPLEMENT_TARGETS:
                member_id = member["member_id"]
                member_name = member["member_name"]
                tasks = member["tasks"]

                print(f"========================================================")
                print(f"🔥 BTS {member_name} 누락 포토카드 2차 정밀 보충 수집 가동")
                print(f"========================================================")

                for task in tasks:
                    cat = task["category"]
                    query = task["query"]
                    limit_2n = task["limit_2n"]
                    target_n = task["target_n"]

                    print(f"🔎 딥 서치 쿼리: '{query}' (목표: {limit_2n}개 URL)")
                    search_url = f"https://www.pinterest.com/search/pins/?q={query.replace(' ', '%20')}"
                    await page.goto(search_url, wait_until="domcontentloaded", timeout=20000)
                    await page.wait_for_timeout(random.randint(2200, 3500))

                    collected_urls = set()
                    scroll_attempts = 0

                    while len(collected_urls) < limit_2n and scroll_attempts < 22:
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
                        await page.wait_for_timeout(random.randint(1200, 2000))
                        scroll_attempts += 1

                    print(f"📌 고화질 후보 URL {len(collected_urls)}개 확보.")
                    await process_supplement_urls(http_session, list(collected_urls), member_id, cat, target_n)

                    query_rest = random.uniform(3.0, 5.0)
                    print(f"☕ 다음 세부 쿼리 전환 대기: {query_rest:.1f}초...")
                    await asyncio.sleep(query_rest)

        await browser.close()
        print("\n🎉 뷔(V) 누락 포토카드 2차 정밀 보충 수집이 완료되었습니다!")

if __name__ == "__main__":
    asyncio.run(main())