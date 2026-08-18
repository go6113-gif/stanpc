import asyncio
import os
import random
import io
import aiohttp
from playwright.async_api import async_playwright
from PIL import Image
import imagehash

# 1. 저장 루트 경로 설정
BASE_OUTPUT_DIR = r"D:\StanPC\downloaded_pcs\bts"

# 2. BTS 7명 멤버별 검색 쿼리 (각 50장 목표)
BTS_MEMBERS = {
    "rm": "BTS RM photocard",
    "jin": "BTS Jin photocard",
    "suga": "BTS Suga photocard",
    "j_hope": "BTS J-Hope photocard",
    "jimin": "BTS Jimin photocard",
    "v": "BTS V photocard",
    "jungkook": "BTS Jungkook photocard"
}

TARGET_COUNT_PER_MEMBER = 50

async def download_and_process_image(session, img_url, save_path, seen_hashes):
    try:
        async with session.get(img_url, timeout=15) as response:
            if response.status == 200:
                content = await response.read()
                image = Image.open(io.BytesIO(content))
                
                # 1차 필터링: 최소 해상도 및 포토카드 세로 비율 검증 (1.2 ~ 1.9)
                width, height = image.size
                if width < 400 or height < 500:
                    return False 
                
                aspect_ratio = height / width
                if aspect_ratio < 1.2 or aspect_ratio > 1.9:
                    return False 

                # 2차 필터링: pHash 기반 중복 이미지 제거
                img_hash = imagehash.phash(image)
                for existing_hash in seen_hashes:
                    if img_hash - existing_hash < 5: 
                        return False
                
                seen_hashes.add(img_hash)

                # 메타데이터 제거 및 WEBP 변환 저장
                image = image.convert("RGB")
                image.thumbnail((800, 1200))
                image.save(save_path, "WEBP", quality=85)
                return True
    except Exception:
        pass
    return False

async def scrape_member_photocards(member_key, query, is_first_run):
    member_dir = os.path.join(BASE_OUTPUT_DIR, member_key)
    os.makedirs(member_dir, exist_ok=True)
    
    print(f"\n[수집 시작] 멤버: {member_key.upper()} (키워드: '{query}')")
    collected = 0
    seen_hashes = set()
    
    # 기존 파일 해시 로드
    for filename in os.listdir(member_dir):
        if filename.endswith(".webp"):
            try:
                existing_img = Image.open(os.path.join(member_dir, filename))
                seen_hashes.add(imagehash.phash(existing_img))
            except:
                pass

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"]
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )
        page = await context.new_page()
        
        # 첫 실행 시 부계정 수동 로그인 대기
        if is_first_run:
            print("\n🚨 [안내] 핀터레스트 로그인 창이 열립니다. 부계정으로 로그인해 주세요!")
            print("로그인을 완료하고 검색 결과 페이지가 뜨면, 스크립트가 자동으로 수집을 시작합니다. (30초 대기 중...)")
            await page.goto("https://kr.pinterest.com/login/")
            await asyncio.sleep(30.0)

        search_url = f"https://kr.pinterest.com/search/pins/?q={query.replace(' ', '%20')}"
        await page.goto(search_url)
        await asyncio.sleep(random.uniform(4.0, 7.0))
        
        img_urls = set()
        
        while len(img_urls) < TARGET_COUNT_PER_MEMBER * 3:
            # 메인 검색 그리드 내 핀 이미지만 타겟팅
            srcs = await page.evaluate('''() => {
                const pins = Array.from(document.querySelectorAll('div[data-test-id="pin"] img, div[role="listitem"] img'));
                return pins.map(img => img.src).filter(src => src && src.includes('pinimg.com'));
            }''')
            
            for src in srcs:
                original_src = src.replace("/236x/", "/originals/").replace("/736x/", "/originals/")
                img_urls.add(original_src)
                
            if len(img_urls) >= TARGET_COUNT_PER_MEMBER * 4:
                break
                
            await page.evaluate("window.scrollBy(0, 1000)")
            await asyncio.sleep(random.uniform(4.0, 7.0))
            
        await browser.close()
        
    # 다운로드 및 전처리 실행
    async with aiohttp.ClientSession() as session:
        for img_url in list(img_urls):
            if collected >= TARGET_COUNT_PER_MEMBER:
                break
            
            filename = f"bts_{member_key}_{collected+1}.webp"
            save_path = os.path.join(member_dir, filename)
            
            if os.path.exists(save_path):
                continue
                
            success = await download_and_process_image(session, img_url, save_path, seen_hashes)
            if success:
                collected += 1
                print(f"[{member_key.upper()} ({collected}/{TARGET_COUNT_PER_MEMBER})] 저장 완료: {filename}")
            
            delay = random.uniform(6.0, 12.0)
            await asyncio.sleep(delay)

async def main():
    print(f"=== [StanPC 핀터레스트 고화질 수집 파이프라인 가동] ===")
    print(f"저장 위치: {BASE_OUTPUT_DIR}")
    
    first_run = True
    for member_key, query in BTS_MEMBERS.items():
        await scrape_member_photocards(member_key, query, is_first_run=first_run)
        first_run = False  
        
        rest_time = random.uniform(600.0, 900.0)
        print(f"--- 멤버 {member_key.upper()} 수집 완료. 시스템 안정화를 위해 {rest_time/60:.1f}분간 휴식합니다. ---")
        await asyncio.sleep(rest_time)
        
    print("=== [모든 멤버 수집 파이프라인 최종 완료] ===")

if __name__ == "__main__":
    asyncio.run(main())