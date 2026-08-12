import csv
import random
import time
from bs4 import BeautifulSoup
import requests

USER_AGENTS = [
    (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML,"
        " like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        " (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    ),
]

OUTPUT_CSV = "poca_catalog_sample.csv"


def get_random_headers():
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": (
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
        ),
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    }


def get_sample_catalog():
    print("🚀 [웹 파싱 모드] 포카마켓 카탈로그 탐색 시작...\n")

    search_keywords = ["스트레이키즈", "세븐틴"]
    collected_data = []

    for kw in search_keywords:
        print(f"🔎 [{kw}] 실제 웹페이지 파싱 중...")

        # 실제 웹 검색 페이지 주소
        url = f"https://pocamarket.com/search?keyword={kw}"

        try:
            res = requests.get(url, headers=get_random_headers(), timeout=8)
            print(f"  - 응답 상태 코드: {res.status_code}")

            if res.status_code == 200:
                soup = BeautifulSoup(res.text, "html.parser")

                # HTML 내 포토카드 카드 엘리먼트 추출 (구조 분석용)
                # 주요 텍스트 요소 파싱
                titles = soup.find_all(
                    ["p", "span", "div"],
                    class_=lambda c: c and "title" in c.lower() if c else False,
                )

                print(
                    f"  - 페이지 내 감지된 텍스트 요소: {len(titles)}개 발견"
                )

                # 샘플 저장
                collected_data.append(
                    {
                        "Keyword": kw,
                        "Status": "Success",
                        "HTML_Length": len(res.text),
                    }
                )
            else:
                print(f"  ⚠️ 접근 실패 코드: {res.status_code}")

        except Exception as e:
            print(f"  ❌ 에러 발생: {e}")

        # 사람처럼 2~4초 무작위 대기
        sleep_time = random.uniform(2.0, 4.0)
        print(f"  ⏳ 대기 중 ({sleep_time:.2f}초)...\n")
        time.sleep(sleep_time)


if __name__ == "__main__":
    get_sample_catalog()