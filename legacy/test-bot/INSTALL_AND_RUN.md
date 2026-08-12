# 설치 및 실행 가이드

## 📋 전체 설정 (5분)

### 1단계: 필요한 패키지 설치

```bash
cd test-bot
pip install -r requirements.txt
```

**예상 출력:**
```
Successfully installed opencv-python numpy Pillow scikit-image requests
```

### 2단계: 테스트 실행

#### A. 샘플 이미지로 즉시 테스트 (권장)
```bash
python sample_test.py --sample
```

**예상 시간:** 5-10초

**예상 출력:**
```
Generating sample photocard images...
  ✓ good       - High quality photocard - clear and well-lit -> sample_good.png
  ✓ blurry     - Blurry photocard - focus issues -> sample_blurry.png
  ✓ low_res    - Low resolution photocard - small pixels -> sample_low_res.png
  ✓ tilted     - Tilted photocard - needs rotation correction -> sample_tilted.png
  ✓ noisy      - Noisy photocard - grainy texture -> sample_noisy.png

Running photocard bot test with 5 sample images...
============================================================
2026-08-10 19:18:09,953 - INFO - Processing 5 images...

[Image 1/5] Processing D:\Poca_exchange\test-bot\sample_images\sample_blurry.png
  Downloaded: (615, 400, 3)
  Processed: (400, 259, 3)
  Scores:
    Overall:      55.3
    Sharpness:    0.0
    Aspect Ratio: 99.7
    Resolution:   99.7
    Noise:        30.0
    Brightness:   72.7

[Image 2/5] Processing D:\Poca_exchange\test-bot\sample_images\sample_good.png
  Downloaded: (615, 400, 3)
  Processed: (400, 259, 3)
  Scores:
    Overall:      84.1
    Sharpness:    60.1
    Aspect Ratio: 99.7
    Resolution:   99.7
    Noise:        100.0
    Brightness:   74.9

... (나머지 3개 이미지)

==================================================
BEST IMAGE: Image 4
Overall Score: 96.9/100
==================================================
Saved to: D:\Poca_exchange\test-bot\output\best_card.png
Report saved to: D:\Poca_exchange\test-bot\output\evaluation_report.json
```

#### B. 실제 이미지 URL로 테스트
```bash
python photocard-ai-bot-test.py \
  "https://example.com/card1.jpg" \
  "https://example.com/card2.jpg" \
  "https://example.com/card3.jpg"
```

또는 샘플 테스트 러너 사용:
```bash
python sample_test.py --urls \
  "https://example.com/card1.jpg" \
  "https://example.com/card2.jpg"
```

### 3단계: 결과 확인

#### 최적 이미지
```
output/best_card.png  (정제되고 평가된 최고 품질 이미지)
```

#### 상세 평가 리포트
```
output/evaluation_report.json  (JSON 형식의 모든 이미지 점수)
```

**리포트 예시:**
```json
{
  "best_image_index": 4,
  "best_score": 96.9,
  "all_scores": {
    "image_1": {
      "overall": 55.3,
      "sharpness": 0.0,
      "aspect_ratio": 99.7,
      "resolution": 99.7,
      "noise": 30.0,
      "brightness": 72.7
    },
    "image_2": { ... },
    ...
  }
}
```

## 🎯 사용 시나리오별 명령어

### 시나리오 1: eBay 포토카드 품질 비교
```bash
python photocard-ai-bot-test.py \
  "https://ebay.com/itm/12345/image1.jpg" \
  "https://ebay.com/itm/12345/image2.jpg" \
  "https://ebay.com/itm/12345/image3.jpg"
```

### 시나리오 2: 자신의 포토카드 평가 (로컬 파일)
```bash
python photocard-ai-bot-test.py \
  "C:/Users/YourName/Pictures/card1.jpg" \
  "C:/Users/YourName/Pictures/card2.jpg"
```

### 시나리오 3: 텍스트 파일에서 URL 읽기
```bash
# urls.txt 생성
cat > urls.txt << EOF
https://example.com/card1.jpg
https://example.com/card2.jpg
https://example.com/card3.jpg
EOF

# PowerShell
python photocard-ai-bot-test.py @((Get-Content urls.txt).Split("`n") | Where-Object {$_})

# Bash/Git Bash
python photocard-ai-bot-test.py $(cat urls.txt)
```

## 📊 성공 표시

모든 것이 제대로 작동하면 다음을 확인할 수 있습니다:

✅ **콘솔 출력:**
```
2026-08-10 19:18:10,416 - INFO - Saved to: output/best_card.png
2026-08-10 19:18:10,426 - INFO - Report saved to: output/evaluation_report.json
```

✅ **생성된 파일:**
```
output/best_card.png                (정제된 포토카드 이미지, ~200-300KB)
output/evaluation_report.json       (평가 리포트, ~1-2KB)
sample_images/                      (생성된 샘플 이미지, 샘플 테스트만)
```

✅ **리포트 내용:**
```json
{
  "best_image_index": 4,
  "best_score": 96.9,
  "all_scores": { ... }
}
```

## ⚠️ 문제 해결

### 문제: "No module named 'cv2'"
**해결:**
```bash
pip install --upgrade opencv-python
```

### 문제: "urllib3 or requests library is required"
**해결:**
```bash
pip install --upgrade requests
```

### 문제: "Failed to download" (URL)
**확인사항:**
- URL이 정확한지 확인
- 이미지 서버에 접근 가능한지 확인 (방화벽/프록시 확인)
- 인터넷 연결 상태 확인

### 문제: 낮은 점수 (예: Overall 30-40점)
**원인 분석:**
- Sharpness 낮음: 이미지가 흐림 → 고품질 사진 필요
- Resolution 낮음: 이미지가 너무 작음 → 고해상도 사진 필요
- Noise 낮음: 이미지가 너무 부드러움 → 자연스러운 질감의 사진 필요

## 📁 프로젝트 구조

```
test-bot/
├── photocard-ai-bot-test.py        # 메인 봇 스크립트
├── sample_test.py                  # 샘플 테스트 러너
├── requirements.txt                # Python 패키지 의존성
├── README.md                       # 상세 문서
├── QUICKSTART.md                   # 빠른 시작
├── INSTALL_AND_RUN.md             # 이 파일
│
├── output/                         # ⬅️ 실행 결과 (자동 생성)
│   ├── best_card.png              # 최적 이미지
│   └── evaluation_report.json      # 평가 리포트
│
├── sample_images/                  # ⬅️ 샘플 이미지 (샘플 테스트 시 생성)
│   ├── sample_good.png
│   ├── sample_blurry.png
│   ├── sample_low_res.png
│   ├── sample_tilted.png
│   └── sample_noisy.png
```

## 🔧 고급 사용법

### Python 스크립트에서 사용
```python
from pathlib import Path
import sys
sys.path.insert(0, 'test-bot')

from photocard_ai_bot_test import PhotocardProcessor

processor = PhotocardProcessor()
processor.run([
    "https://example.com/card1.jpg",
    "https://example.com/card2.jpg"
])

# 점수 확인
best_idx = max(processor.scores, key=lambda x: processor.scores[x]['overall'])
best_score = processor.scores[best_idx]
print(f"Best score: {best_score['overall']:.1f}")
```

### 결과를 프로그래머블하게 처리
```python
import json

with open('output/evaluation_report.json') as f:
    report = json.load(f)
    best_idx = report['best_image_index']
    best_score = report['best_score']
    print(f"Best: Image {best_idx} with score {best_score:.1f}/100")
```

## 📝 실행 체크리스트

- [ ] Python 3.7+ 설치 확인
- [ ] `pip install -r requirements.txt` 실행
- [ ] `python sample_test.py --sample` 실행
- [ ] `output/best_card.png` 생성 확인
- [ ] `output/evaluation_report.json` 생성 확인
- [ ] JSON 리포트에서 점수 확인
- [ ] 실제 URL로 테스트 시도

## 💡 팁

1. **배치 처리:** 여러 이미지를 한 번에 처리하면 최고의 이미지를 자동으로 선택
2. **점수 추적:** JSON 리포트를 저장하여 시간별 비교 가능
3. **자동화:** 스케줄러로 정기적인 평가 실행 가능
4. **메인 프로젝트 연동:** 정제된 이미지를 poca-exchange 프로젝트에 활용

## 🚀 다음 단계

1. README.md 읽고 전체 기능 이해
2. 실제 포토카드 URL로 테스트
3. 결과 분석 및 활용
4. 필요시 메인 프로젝트에 통합

---

**문제 발생 시:** README.md의 "문제 해결" 섹션을 참고하세요.
