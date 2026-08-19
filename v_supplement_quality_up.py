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

# j-hope Proof 단독 타깃 매니페스트 (test_jhope_proof.py와 동일 쿼리)
JHOPE_PROOF_TARGET = {
    "member_id": "jhope",
    "member_name": "j-hope (정호석)",
    "category": "proof",
    "query": "BTS j-hope Proof photocard scan",
    "target_n": 8,       # 추가 발굴 목표 수량
    "limit_2n": 35       # 3N 후보 탐색 URL 수
}

# 1. 안전한 품질 점수 산출 함수 (해상도 + 정규화 선명도 + 파일 크기)
def get_safe_quality_score(img_bgr: np.ndarray, file_size_bytes: int) -> float:
    try:
        h, w = img_bgr.shape[:2]
        if w < 320 or h < 480:
            return 0.0
        
        # 해상도 뻥튀기 방지를 위해 500x750으로 리사이즈 후 순수 선명도 측정
        standard_img = cv2.resize(img_bgr, (500, 750), interpolation=cv2.INTER_AREA)
        gray = cv2.cvtColor(standard_img, cv2.COLOR_BGR2GRAY)
        sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # 노이즈/인쇄격자 컷오프
        sharpness = min(sharpness, 1500.0)
        
        # 종합 점수 계산
        res_score = min((w * h) / (1200 * 1800), 1.0) * 100
        sharp_score = (sharpness / 1500.0) * 100
        size_score = min(file_size_bytes / (500 * 1024), 1.0) * 100
        
        return (res_score * 0.4) + (sharp_score * 0.4) + (size_score * 0.2)
    except:
        return 0.0

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

# 기존 로컬 카드 로드 (D드라이브 원본)
def load_existing_cards_with_meta(cat_dir: str) -> list[dict]:
    existing_items = []
    if not os.path.exists(cat_dir):
        return existing_items
    for fname in sorted(os.listdir(cat_dir)):
        if fname.endswith(".webp"):
            fpath = os.path.join(cat_dir, fname)
            try:
                with open(fpath, "rb") as f:
                    content = f.read()
                np_arr = np.frombuffer(content, np.uint8)
                img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                q_score = get_safe_quality_score(img, len(content))
                existing_items.append({
                    "file_path": fpath,
                    "file_name": fname,
                    "bytes": content,
                    "quality_score": q_score
                })
            except:
                pass
    return existing_items

async def process_supplement_urls(session: aiohttp.ClientSession, urls: list[str], member_id: str, category: str, target_n: int):
    cat_dir = os.path.join(SAVE_BASE_DIR, member_id, category)
    os.makedirs(cat_dir, exist_ok=True)

    existing_items = load_existing_cards_with_meta(cat_dir)
    print(f"📁 [{member_id.upper()} - {category.upper()}] 기존 확보 카드: {len(existing_items)}장 로드됨")

    candidates = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }

    print(f"⚡ 3N 수집본 정제 시작 (URL {len(urls)}개)")

    for idx, url in enumerate(urls, 1):
        try:
            await asyncio.sleep(random.uniform(0.1, 0.2))
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                if resp.status != 200:
                    continue
                content = await resp.read()

                is_valid, reason, w, h = validate_photocard_image(content)
                if not is_valid:
                    continue

                np_arr = np.frombuffer(content, np.uint8)
                img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                new_q_score = get_safe_quality_score(img_bgr, len(content))

                # 기존 로컬 파일과 SSIM 비교 -> 겹치면 품질 점수 비교 후 덮어쓰기
                is_matched_existing = False
                for ex in existing_items:
                    sim = calculate_ssim(content, ex["bytes"])
                    if sim >= 0.78:
                        is_matched_existing = True
                        if new_q_score > ex["quality_score"]:
                            print(f"  🆙 [{idx:02d}] 기존 도안 퀄리티업 교체! ({ex['file_name']}: {ex['quality_score']:.1f}점 ➡ {new_q_score:.1f}점)")
                            pil_img = Image.open(BytesIO(content))
                            pil_img.save(ex["file_path"], "WEBP", quality=95)
                            ex["bytes"] = content
                            ex["quality_score"] = new_q_score
                        else:
                            print(f"  ⏭️ [{idx:02d}] 기존 도안 발견 (기존 화질 유지: {ex['quality_score']:.1f}점 vs {new_q_score:.1f}점)")
                        break

                if is_matched_existing:
                    continue

                # 신규 도안인 경우
                pil_img = Image.open(BytesIO(content))
                candidates.append({
                    "bytes": content,
                    "quality_score": new_q_score,
                    "size": (w, h),
                    "pil_img": pil_img
                })
                print(f"  ✨ [{idx:02d}] 새로운 누락 도안 발굴! ({w}x{h}, {new_q_score:.1f}점)")

        except Exception as e:
            pass

    # 신규 후보군 내부 SSIM 중복 제거
    final_new_selected = []
    for cand in candidates:
        matched = False
        for sel in final_new_selected:
            if calculate_ssim(cand["bytes"], sel["bytes"]) >= 0.78:
                matched = True
                if cand["quality_score"] > sel["quality_score"]:
                    sel["bytes"] = cand["bytes"]
                    sel["pil_img"] = cand["pil_img"]
                    sel["size"] = cand["size"]
                    sel["quality_score"] = cand["quality_score"]
                break
        if not matched:
            final_new_selected.append(cand)

    # 신규 도안 저장
    saved_count = 0
    start_idx = len(existing_items) + 1
    for idx, item in enumerate(final_new_selected[:target_n], start_idx):
        file_name = f"{member_id}_{category}_{idx:02d}.webp"
        file_path = os.path.join(cat_dir, file_name)
        item["pil_img"].save(file_path, "WEBP", quality=95)
        saved_count += 1
        print(f"  💾 신규 보충 저장: {file_name} ({item['size'][0]}x{item['size'][1]}, {item['quality_score']:.1f}점)")

    print(f"🎯 [{member_id.upper()} - {category.upper()}] 완료 (신규 추가: {saved_count}장 / 총 누적: {len(existing_items) + saved_count}장)\n")

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            viewport={"width": 1440, "height": 960},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        async with aiohttp.ClientSession() as http_session:
            member_id = JHOPE_PROOF_TARGET["member_id"]
            member_name = JHOPE_PROOF_TARGET["member_name"]
            cat = JHOPE_PROOF_TARGET["category"]
            query = JHOPE_PROOF_TARGET["query"]
            limit_2n = JHOPE_PROOF_TARGET["limit_2n"]
            target_n = JHOPE_PROOF_TARGET["target_n"]

            print(f"========================================================")
            print(f"🔥 BTS {member_name} Proof 퀄리티업 및 누락 수집 가동")
            print(f"🔎 쿼리: '{query}' (후보 탐색: {limit_2n}개 URL)")
            print(f"========================================================")

            search_url = f"https://www.pinterest.com/search/pins/?q={query.replace(' ', '%20')}"
            await page.goto(search_url, wait_until="domcontentloaded", timeout=20000)
            await page.wait_for_timeout(random.randint(2200, 3500))

            collected_urls = set()
            scroll_attempts = 0

            while len(collected_urls) < limit_2n and scroll_attempts < 20:
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

            print(f"📌 후보 URL {len(collected_urls)}개 확보.")
            await process_supplement_urls(http_session, list(collected_urls), member_id, cat, target_n)

        await browser.close()
        print("\n🎉 j-hope Proof 퀄리티업 및 보충 수집이 완료되었습니다!")

if __name__ == "__main__":
    asyncio.run(main())