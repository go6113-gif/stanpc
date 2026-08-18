import os
import re
import json
import time
import random
import urllib.parse
from io import BytesIO
from PIL import Image
import requests
from bs4 import BeautifulSoup

# 기본 저장 루트 (절대 경로 고정)
BASE_DIR = r"D:\StanPC\downloaded_pcs\seventeen"

MEMBERS = [
    {"ko": "에스쿱스", "en": "S.COUPS"},
    {"ko": "정한", "en": "Jeonghan"},
    {"ko": "조슈아", "en": "Joshua"},
    {"ko": "준", "en": "Jun"},
    {"ko": "호시", "en": "Hoshi"},
    {"ko": "원우", "en": "Wonwoo"},
    {"ko": "우지", "en": "Woozi"},
    {"ko": "디에잇", "en": "The8"},
    {"ko": "민규", "en": "Mingyu"},
    {"ko": "도겸", "en": "DK"},
    {"ko": "승관", "en": "Seungkwan"},
    {"ko": "버논", "en": "Vernon"},
    {"ko": "디노", "en": "Dino"}
]

RELEASES = [
    {"id": "fml", "query": "FML 포토카드 photocard"},
    {"id": "seventeenth_heaven", "query": "SEVENTEENTH HEAVEN 포토카드 photocard"},
    {"id": "17_is_right_here", "query": "17 IS RIGHT HERE 포토카드 photocard"},
    {"id": "spill_the_feels", "query": "SPILL THE FEELS 포토카드 photocard"},
    {"id": "lucky_draw", "query": "럭키드로우 럭드 photocard"},
    {"id": "pob", "query": "특전 pob photocard"}
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7"
}

def search_pinterest_images(query_str, limit=5):
    """핀터레스트/구글 이미지 검색 결과 파싱 (고화질 원본 추출)"""
    encoded_query = urllib.parse.quote(f"세븐틴 SEVENTEEN {query_str}")
    url = f"https://www.bing.com/images/search?q={encoded_query}&FORM=HDRSC2"
    
    image_urls = []
    try:
        res = requests.get(url, headers=HEADERS, timeout=10)
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, "html.parser")
            # murl 필드에서 원본 고화질 URL 추출
            for a in soup.find_all("a", class_="iusc"):
                m_attr = a.get("m")
                if m_attr:
                    try:
                        data = json.loads(m_attr)
                        murl = data.get("murl")
                        if murl and murl.startswith("http") and murl not in image_urls:
                            image_urls.append(murl)
                            if len(image_urls) >= limit:
                                break
                    except Exception:
                        continue
    except Exception as e:
        print(f"    [검색 오류] {query_str}: {e}")
        
    return image_urls

def process_and_save_webp(img_url, save_path):
    """이미지 다운로드 및 WebP 규격 변환/저장"""
    try:
        res = requests.get(img_url, headers=HEADERS, timeout=10)
        if res.status_code == 200:
            img = Image.open(BytesIO(res.content)).convert("RGB")
            
            # 너무 작은 썸네일 제외 (최소 가로/세로 200px 이상)
            if img.width < 200 or img.height < 200:
                return False
                
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            img.save(save_path, "WEBP", quality=90)
            return True
    except Exception:
        pass
    return False

def main():
    print("=" * 60)
    print(" [StanPC] 세븐틴(SEVENTEEN) 13인 고화질 포토카드 수집 시작")
    print(f" 저장 루트: {BASE_DIR}")
    print("=" * 60)
    
    for member in MEMBERS:
        ko_name = member["ko"]
        en_name = member["en"]
        print(f"\n▶ 멤버: {ko_name} ({en_name})")
        
        for release in RELEASES:
            rel_id = release["id"]
            rel_query = release["query"]
            
            target_dir = os.path.join(BASE_DIR, ko_name, rel_id)
            os.makedirs(target_dir, exist_ok=True)
            
            # 이미 존재하는 WebP 파일 확인 (중복 다운로드 방지)
            existing_files = [f for f in os.listdir(target_dir) if f.endswith(".webp")]
            if len(existing_files) >= 3:
                print(f"  [{rel_id}] 이미 {len(existing_files)}장 확보됨 (건너뜀)")
                continue
                
            full_query = f"{ko_name} {en_name} {rel_query}"
            urls = search_pinterest_images(full_query, limit=5)
            
            saved_count = len(existing_files)
            for idx, url in enumerate(urls):
                file_name = f"{ko_name}_{rel_id}_{saved_count + 1:02d}.webp"
                save_path = os.path.join(target_dir, file_name)
                
                if process_and_save_webp(url, save_path):
                    saved_count += 1
                
                time.sleep(random.uniform(0.3, 0.7))
                
            print(f"  [{rel_id}] {saved_count}장 확보 완료")
            time.sleep(random.uniform(0.5, 1.0))

    print("\n" + "=" * 60)
    print(" [StanPC] 세븐틴 수집 및 WebP 정제 완료")
    print("=" * 60)

if __name__ == "__main__":
    main()