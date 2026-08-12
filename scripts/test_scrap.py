import os
import re
import urllib.request
import urllib.parse
from PIL import Image
from io import BytesIO
import hashlib

TEST_DATA = {
    "artist": "NewJeans",
    "album": "OMG",
    "version": "Message Card ver.",
    "member": "Haerin"
}

search_query = f"{TEST_DATA['artist']} {TEST_DATA['album']} {TEST_DATA['version']} {TEST_DATA['member']}"
print(f"[*] 검색 쿼리: {search_query}")

# 구글 이미지 Direct 웹 스크래핑 함수 (API 키/패키지 불필요)
def get_google_image_urls(query, max_results=3):
    encoded_query = urllib.parse.quote(query)
    url = f"https://www.google.com/search?q={encoded_query}&tbm=isch"
    
    req = urllib.request.Request(
        url, 
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
    )
    
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')
        # 구글 이미지 결과 내 실제 이미지 URL 추출
        img_urls = re.findall(r'\["(https?://[^"]+?\.(?:jpg|png|jpeg))",\s*\d+,\s*\d+\]', html)
        
        # 중복 제거 후 지정된 개수만큼 반환
        unique_urls = list(dict.fromkeys(img_urls))
        return unique_urls[:max_results]
    except Exception as e:
        print(f"[Error] 검색 스크래핑 실패: {e}")
        return []

# 이미지 다운로드 및 WebP 썸네일 변환 함수
def process_image_to_thumbnail(image_url, max_width=300):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    try:
        req = urllib.request.Request(image_url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as response:
            img_data = response.read()
            img = Image.open(BytesIO(img_data)).convert("RGB")
            
            w_percent = (max_width / float(img.size[0]))
            h_size = int((float(img.size[1]) * float(w_percent)))
            img_resized = img.resize((max_width, h_size), Image.Resampling.LANCZOS)
            
            file_hash = hashlib.md5(image_url.encode('utf-8')).hexdigest()[:10]
            os.makedirs("./test_output", exist_ok=True)
            save_path = f"./test_output/{TEST_DATA['artist']}_{TEST_DATA['member']}_{file_hash}.webp"
            
            img_resized.save(save_path, "WEBP", quality=80)
            print(f"[Success] 썸네일 생성 완료: {save_path}")
            return save_path
    except Exception as e:
        print(f"[Error] 이미지 다운로드 실패 ({image_url[:40]}...): {e}")
    return None

# 실행
urls = get_google_image_urls(search_query)
print(f"[*] 검색된 이미지 URL 수: {len(urls)}")

for url in urls:
    process_image_to_thumbnail(url)
