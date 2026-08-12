import os
import requests
from PIL import Image
from io import BytesIO
import hashlib
from duckduckgo_search import DDGS

TEST_DATA = {
    "artist": "NewJeans",
    "album": "OMG",
    "version": "Message Card ver.",
    "member": "Haerin"
}

search_query = f"{TEST_DATA['artist']} {TEST_DATA['album']} {TEST_DATA['version']} {TEST_DATA['member']}"
print(f"[*] 검색 쿼리: {search_query}")

# 이미지 검색 함수 (DuckDuckGo 사용)
def search_ddg_images(query, max_results=3):
    try:
        with DDGS() as ddgs:
            results = list(ddgs.images(query, max_results=max_results))
            return [r['image'] for r in results]
    except Exception as e:
        print(f"[Error] 검색 실패: {e}")
        return []

# 이미지 다운로드 및 WebP 썸네일 변환 함수
def process_image_to_thumbnail(image_url, max_width=300):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    try:
        response = requests.get(image_url, headers=headers, timeout=10)
        if response.status_code == 200:
            img = Image.open(BytesIO(response.content)).convert("RGB")
            
            # 가로 300px 비율 리사이징
            w_percent = (max_width / float(img.size[0]))
            h_size = int((float(img.size[1]) * float(w_percent)))
            img_resized = img.resize((max_width, h_size), Image.Resampling.LANCZOS)
            
            # 파일 저장
            file_hash = hashlib.md5(image_url.encode('utf-8')).hexdigest()[:10]
            os.makedirs("./test_output", exist_ok=True)
            save_path = f"./test_output/{TEST_DATA['artist']}_{TEST_DATA['member']}_{file_hash}.webp"
            
            img_resized.save(save_path, "WEBP", quality=80)
            print(f"[Success] 썸네일 생성 완료: {save_path}")
            return save_path
    except Exception as e:
        print(f"[Error] 이미지 처리 실패 ({image_url}): {e}")
    return None

# 실행
urls = search_ddg_images(search_query)
print(f"[*] 검색된 이미지 URL 수: {len(urls)}")

for url in urls:
    process_image_to_thumbnail(url)
