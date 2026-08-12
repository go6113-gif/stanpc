# 포토카드 AI 봇 - D:\Poca_exchange 통합 가이드

📍 **위치:** D:\Poca_exchange (루트 레벨)

## 🚀 빠른 시작 (2분)

### 1단계: 패키지 설치
```bash
cd D:\Poca_exchange
pip install -r requirements.txt
```

### 2단계: 샘플 테스트 실행
```bash
python sample_test.py --sample
```

### 3단계: 결과 확인
```
output/best_card.png              # 최적 이미지
output/evaluation_report.json     # 평가 점수
```

## 📁 파일 구조

```
D:\Poca_exchange/
├── photocard-ai-bot-test.py              # ⭐ 메인 봇 스크립트
├── sample_test.py                        # 샘플 테스트 러너
├── requirements.txt                      # 패키지 의존성
│
├── README-photocard-bot.md               # 상세 기술 문서
├── QUICKSTART-photocard-bot.md          # 1분 시작 가이드
├── INSTALL_RUN-photocard-bot.md         # 설치/실행 상세 가이드
├── PHOTOCARD_BOT_SETUP.md               # 이 파일
│
├── output/                               # 결과 저장 (자동 생성)
│   ├── best_card.png                    # 최고 품질 이미지
│   └── evaluation_report.json            # 평가 리포트
│
└── sample_images/                        # 생성된 샘플 (테스트용)
    ├── sample_good.png
    ├── sample_blurry.png
    ├── sample_low_res.png
    ├── sample_tilted.png
    └── sample_noisy.png
```

## 💻 사용 명령어

### 샘플로 테스트 (모든 기능 확인)
```bash
cd D:\Poca_exchange
python sample_test.py --sample
```

### 실제 이미지 URL 테스트
```bash
python photocard-ai-bot-test.py "https://example.com/card1.jpg" "https://example.com/card2.jpg"
```

### 로컬 파일 테스트
```bash
python photocard-ai-bot-test.py "C:/path/to/card1.jpg" "C:/path/to/card2.jpg"
```

### URL 텍스트 파일로 배치 처리
```bash
# urls.txt 생성
(Get-Content urls.txt).Split("`n") | ForEach-Object {
    if ($_) { python photocard-ai-bot-test.py $_ }
}
```

## 📊 출력 이해하기

### 콘솔 로그
```
2026-08-10 19:18:09,953 - INFO - Processing 5 images...

[Image 1/5] Processing D:\Poca_exchange\sample_images\sample_good.png
  Downloaded: (615, 400, 3)      # 원본 크기
  Processed: (400, 259, 3)        # 정규화된 크기
  Scores:
    Overall:      84.1           # 최종 점수 (0-100)
    Sharpness:    60.1           # 선명도 (30% 가중치)
    Aspect Ratio: 99.7           # 종횡비 (20% 가중치)
    Resolution:   99.7           # 해상도 (20% 가중치)
    Noise:        100.0          # 노이즈/텍스처 (15% 가중치)
    Brightness:   74.9           # 밝기/명암 (15% 가중치)

==================================================
BEST IMAGE: Image 2
Overall Score: 84.1/100
==================================================
Saved to: D:\Poca_exchange\output\best_card.png
Report saved to: D:\Poca_exchange\output\evaluation_report.json
```

### JSON 리포트 (output/evaluation_report.json)
```json
{
  "best_image_index": 2,
  "best_score": 84.1,
  "all_scores": {
    "image_1": {
      "overall": 55.3,
      "sharpness": 0.0,
      "aspect_ratio": 99.7,
      "resolution": 99.7,
      "noise": 30.0,
      "brightness": 72.7
    },
    "image_2": {
      "overall": 84.1,
      ...
    }
  }
}
```

## 🎯 점수 해석

| 범위 | 등급 | 의미 |
|------|------|------|
| 90-100 | ⭐⭐⭐⭐⭐ | Excellent - 매우 우수 |
| 75-89 | ⭐⭐⭐⭐ | Good - 우수 |
| 60-74 | ⭐⭐⭐ | Fair - 보통 |
| 45-59 | ⭐⭐ | Poor - 낮음 |
| 0-44 | ⭐ | Bad - 매우 낮음 |

## 🔧 평가 기준 상세

### 1. 선명도 (Sharpness - 30%)
- **계산:** Laplacian Variance
- **의미:** 이미지가 얼마나 선명한지
- **높은 점수:** 포토카드 디테일이 명확하게 보임
- **낮은 점수:** 흐릿하거나 초점이 맞지 않음

### 2. 종횡비 (Aspect Ratio - 20%)
- **목표:** 1:1.54 (표준 포토카드 비율)
- **100점:** 정확히 일치
- **감점:** 비율이 벗어날수록 감점

### 3. 해상도 (Resolution - 20%)
- **목표:** 260×400px (104,000 픽셀)
- **높은 점수:** 고해상도 이미지
- **낮은 점수:** 너무 작은 이미지

### 4. 노이즈/텍스처 (Noise - 15%)
- **의미:** 이미지 텍스처 품질
- **좋음:** 자연스러운 텍스처, 포토카드 디테일 보임
- **나쁨:** 너무 부드럽거나 과도한 노이즈

### 5. 밝기/명암 (Brightness - 15%)
- **이상적 밝기:** 128 (0-255 중간값)
- **이상적 명암비:** 30 이상
- **평가:** 너무 어둡거나 밝지 않은지 확인

## ⚠️ 문제 해결

### "No module named 'cv2'"
```bash
pip install --upgrade opencv-python
```

### "Failed to download" 에러
- ✓ URL이 정확한지 확인
- ✓ 인터넷 연결 상태 확인
- ✓ 이미지 호스팅 서버 접근 가능 여부 확인

### 낮은 점수 (30-50점)
**원인:**
1. **Sharpness 낮음** → 이미지가 흐림
2. **Resolution 낮음** → 이미지가 너무 작음
3. **Noise 낮음** → 이미지가 너무 부드러움

**해결:**
- 고해상도 원본 이미지 사용
- 선명하고 잘 촬영된 포토카드 사진 선택

## 📚 추가 문서

| 문서 | 내용 |
|------|------|
| `README-photocard-bot.md` | 전체 기능, API, 평가 기준 상세 설명 |
| `QUICKSTART-photocard-bot.md` | 1분 시작, FAQ, 점수 해석 |
| `INSTALL_RUN-photocard-bot.md` | 설치 단계별 안내, 시나리오별 명령어 |

## 🎓 예제 워크플로우

### 워크플로우 1: eBay 포토카드 비교
```bash
# 같은 포토카드의 3개 판매자 이미지 비교
python photocard-ai-bot-test.py \
  "https://ebay-seller1.com/card.jpg" \
  "https://ebay-seller2.com/card.jpg" \
  "https://ebay-seller3.com/card.jpg"

# → output/best_card.png에서 최고 품질 이미지 확인
```

### 워크플로우 2: 자신의 포토카드 평가
```bash
# 사진 5장을 정해진 폴더에 저장
# 예: C:\MyPhotocards\card1.jpg ~ card5.jpg

python photocard-ai-bot-test.py \
  "C:\MyPhotocards\card1.jpg" \
  "C:\MyPhotocards\card2.jpg" \
  "C:\MyPhotocards\card3.jpg" \
  "C:\MyPhotocards\card4.jpg" \
  "C:\MyPhotocards\card5.jpg"

# → output/evaluation_report.json에서 모든 점수 확인
```

### 워크플로우 3: 정기적인 품질 모니터링
```bash
# 스케줄된 배치 스크립트로 자동 실행
# (Windows Task Scheduler 활용)

# 날짜별 리포트 저장
$date = Get-Date -Format "yyyyMMdd"
Copy-Item "output/evaluation_report.json" "reports/report_$date.json"
```

## 🔄 메인 프로젝트 연동

이 봇을 메인 poca-exchange 프로젝트에 통합할 수 있습니다:

```python
# Python 코드에서 직접 사용
from pathlib import Path
import subprocess
import json

# 이미지 처리
result = subprocess.run([
    "python", "photocard-ai-bot-test.py", 
    "image1.jpg", "image2.jpg", "image3.jpg"
])

# 결과 읽기
with open("output/evaluation_report.json") as f:
    report = json.load(f)
    best_idx = report['best_image_index']
    best_img = f"image{best_idx}.jpg"
    print(f"Best image: {best_img}")
```

## 💡 팁 & 권고사항

1. **배치 처리:** 한 번에 3-5개 이미지 처리 권장
2. **점수 추적:** JSON 리포트를 날짜별로 저장하여 비교
3. **자동화:** Windows Task Scheduler로 정기적 실행 가능
4. **메모리:** 고해상도 이미지 많이 처리 시 시간 소요 (1-2초/이미지)

## 📞 지원

- **상세 문서:** `README-photocard-bot.md` 참고
- **빠른 시작:** `QUICKSTART-photocard-bot.md` 참고
- **설치/실행:** `INSTALL_RUN-photocard-bot.md` 참고

---

**준비 완료!** 이제 `python sample_test.py --sample` 명령어로 테스트를 시작하세요.
