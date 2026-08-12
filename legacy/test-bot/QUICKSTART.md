# 빠른 시작 가이드 (Quick Start)

## 1분 안에 시작하기

### 설치 (1단계)

```bash
cd test-bot
pip install -r requirements.txt
```

### 테스트 (2단계)

#### 옵션 A: 샘플 이미지로 테스트 (인터넷 불필요)
```bash
python sample_test.py --sample
```

이 명령어는 다음을 자동으로 수행합니다:
- 5가지 품질의 샘플 포토카드 이미지 생성
- 각 이미지를 처리하고 평가
- 최적 이미지를 `output/best_card.png`에 저장
- 상세 리포트를 `output/evaluation_report.json`에 저장

**예상 결과:**
```
Generating sample photocard images...
  ✓ good       - High quality photocard - clear and well-lit -> sample_good.png
  ✓ blurry     - Blurry photocard - focus issues -> sample_blurry.png
  ✓ low_res    - Low resolution photocard - small pixels -> sample_low_res.png
  ✓ tilted     - Tilted photocard - needs rotation correction -> sample_tilted.png
  ✓ noisy      - Noisy photocard - grainy texture -> sample_noisy.png

Running photocard bot test with 5 sample images...
============================================================
2026-08-10 19:05:00,123 - INFO - Processing 5 images...

[Image 1/5] Processing file:///C:/..../sample_good.png
  Downloaded: (615, 400, 3)
  Processed: (260, 400, 3)
  Scores:
    Overall:      87.3
    ...
```

#### 옵션 B: 실제 이미지 URL로 테스트
```bash
python photocard-ai-bot-test.py \
  "https://example.com/card1.jpg" \
  "https://example.com/card2.jpg" \
  "https://example.com/card3.jpg"
```

또는 `sample_test.py` 사용:
```bash
python sample_test.py --urls \
  "https://example.com/card1.jpg" \
  "https://example.com/card2.jpg"
```

### 결과 확인 (3단계)

```bash
# 최적 이미지 확인
output/best_card.png

# 상세 점수 리포트 확인
output/evaluation_report.json
```

## 파일 구조

```
test-bot/
├── photocard-ai-bot-test.py     # 메인 봇 스크립트
├── sample_test.py               # 샘플 테스트 러너
├── requirements.txt             # 의존성
├── README.md                    # 상세 문서
├── QUICKSTART.md               # 이 파일
├── sample_images/              # 생성된 샘플 이미지 (자동 생성)
│   ├── sample_good.png
│   ├── sample_blurry.png
│   ├── sample_low_res.png
│   ├── sample_tilted.png
│   └── sample_noisy.png
└── output/                      # 결과 저장 (자동 생성)
    ├── best_card.png           # 최적 이미지
    └── evaluation_report.json   # 평가 리포트
```

## 실제 사용 예제

### 예제 1: 단일 포토카드 평가
```bash
python photocard-ai-bot-test.py "https://ebay-image-url.jpg"
```

### 예제 2: 다중 포토카드 비교
```bash
python photocard-ai-bot-test.py \
  "https://seller1.com/photocard.jpg" \
  "https://seller2.com/photocard.jpg" \
  "https://seller3.com/photocard.jpg"
```

### 예제 3: 배치 처리 (텍스트 파일 사용)
```bash
# urls.txt 파일 생성
# https://url1.jpg
# https://url2.jpg
# https://url3.jpg

python photocard-ai-bot-test.py $(cat urls.txt)
```

## 점수 해석

### 90-100점: Excellent ⭐⭐⭐⭐⭐
- 매우 선명하고 고해상도
- 밝기와 명암비 최적
- 포토카드 영역이 명확하게 보임

### 75-89점: Good ⭐⭐⭐⭐
- 충분히 선명함
- 대부분의 포토카드로 사용 가능
- 약간의 개선 여지 있음

### 60-74점: Fair ⭐⭐⭐
- 보통 품질
- 기본 요구사항 충족
- 개선 권장

### 45-59점: Poor ⭐⭐
- 낮은 품질
- 사용 가능하지만 권장하지 않음

### 0-44점: Bad ⭐
- 사용 불가
- 명확한 문제 있음 (흐림, 저해상도 등)

## 자주 묻는 질문 (FAQ)

**Q: 단일 이미지만 평가할 수 있나요?**
A: 네, URL 하나만 제공하면 됩니다.

**Q: 오프라인에서 테스트할 수 있나요?**
A: 네, `python sample_test.py --sample` 명령어로 샘플 이미지를 생성하여 테스트할 수 있습니다.

**Q: 평가 점수가 낮은 이유는?**
A: README.md의 "점수 평가 기준" 섹션을 참고하세요. 일반적으로:
- Sharpness가 낮으면: 이미지가 흐림
- Resolution이 낮으면: 너무 작은 이미지
- Aspect Ratio가 낮으면: 포토카드 비율과 맞지 않음

**Q: 이전 결과를 지우려면?**
A: `output/` 디렉토리의 파일들을 삭제하세요. 다음 실행 시 새로운 파일이 생성됩니다.

**Q: 다른 이미지 형식을 지원하나요?**
A: Pillow가 지원하는 모든 형식을 지원합니다 (JPG, PNG, GIF, WebP, BMP 등).

## 문제 해결

### "No such file or directory" 에러
```bash
# 올바른 디렉토리인지 확인
pwd  # Windows PowerShell에서는 (Get-Location)

# test-bot 디렉토리로 이동
cd test-bot
```

### 패키지 설치 에러
```bash
# Python 버전 확인 (3.7+ 필요)
python --version

# pip 업그레이드
python -m pip install --upgrade pip

# 다시 설치
pip install -r requirements.txt
```

### URL 다운로드 실패
- URL이 올바른지 확인
- 이미지 호스팅 서버의 CORS 정책 확인
- 네트워크 연결 상태 확인

## 다음 단계

1. **README.md 읽기**: 전체 기능과 평가 기준 이해
2. **실제 URL 테스트**: 자신의 포토카드 이미지로 테스트
3. **메인 프로젝트 연동**: 가공된 이미지를 메인 poca-exchange 프로젝트에 활용

## 지원

문제가 발생하거나 개선 사항이 있으면:
1. README.md의 "문제 해결" 섹션 확인
2. `evaluation_report.json`의 상세 점수 분석
3. 콘솔 로그 메시지 확인

---

**Tip:** 매번 같은 명령어를 실행하려면 배치 파일이나 alias를 만드는 것을 추천합니다.

Windows (PowerShell):
```powershell
function test-photocard { python sample_test.py --sample }
```

Linux/Mac (Bash):
```bash
alias test-photocard="python sample_test.py --sample"
```
