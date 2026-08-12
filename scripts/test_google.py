import os
import requests
from PIL import Image
from io import BytesIO
import hashlib

# 1. 구글 API 키 및 CX 설정
GOOGLE_API_KEY = "AIzaSyCN7GTMXpAgchR9er-rXlSZZhRn9APrmYg"
GOOGLE_CX = "b26c78a2d75844801"

# 2. 테스트 검색 대상
TEST_DATA = {
    "artist": "NewJeans",
    "album": "OMG",
    "version": "Message Card ver.",
    "member": "Haerin"
}

search_query = f"{TEST_DATA['artist']} {TEST_DATA['album']} {TEST_DATA['version']} {TEST_DATA['member']}"
print(f"[*] 검색 쿼리: {search_query}")

# 3. 구글 이미지 검색 함수 (일반 검색/이미지 파라미터 최적화)
def search_google_images(query, api_key, cx):
    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        "q": query,
        "cx": cx,
        "key": api_key,
        "searchType": "image",
        "num": 5,
        "gl": "kr",        # 국가 설정 (한국)
        "hl": "ko"        # 언어 설정 (한국어)
    }
    try:
        res = requests.get(url, params=params).json()
        
        # API 에러 응답 확인용
        if "error" in res:
            print(f"[API Error] {res['error']['message']}")
            return []
            
        items = res.get("items", [])
        return [item["link"] for item in items]
    except Exception as e:
        print(f"[Request Error] {e}")
        return []

# 4. 이미지 다운로드 및 WebP 썸네일 변환 함수
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
            
            # 파일 저장 경로 (D:\Poca_exchange\test_output)
            file_hash = hashlib.md5(image_url.encode('utf-8')).hexdigest()[:10]
            os.makedirs("./test_output", exist_ok=True)
            save_path = f"./test_output/{TEST_DATA['artist']}_{TEST_DATA['member']}_{file_hash}.webp"
            
            img_resized.save(save_path, "WEBP", quality=80)
            print(f"[Success] 썸네일 생성 완료: {save_path}")
            return save_path
    except Exception as e:
        print(f"[Error] 이미지 처리 실패 ({image_url}): {e}")
    return None

# 5. 실행
google_urls = search_google_images(search_query, GOOGLE_API_KEY, GOOGLE_CX)
print(f"[*] 검색된 이미지 URL 수: {len(google_urls)}")

for url in google_urls:
    process_image_to_thumbnail(url)
