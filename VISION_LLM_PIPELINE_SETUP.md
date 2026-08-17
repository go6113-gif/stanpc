# Vision LLM Pipeline Setup & Pilot Test Guide

## 📋 Overview

Vision LLM 기반 포토카드 이미지 판독 파이프라인이 완성되었습니다.

**파이프라인 구조:**
```
이미지 URL → 키워드 필터 (텍스트 기반)
           ↓
         이미지 다운로드 & 리사이징 (512px max)
           ↓
         Vision LLM 판독 (gpt-4o-mini)
           ↓
    ✅ 승인 / ❌ 거부 / ⚠️ 검토 필요
           ↓
        DB 저장 (imageUrl) 또는 NULL 처리
```

---

## 🔧 Prerequisites & Installation

### 1. Python 패키지 설치

```bash
cd D:\StanPC
pip install -r requirements.txt
```

설치 확인:
```bash
python -c "from openai import OpenAI; print('✓ OpenAI SDK ready')"
python -c "from PIL import Image; print('✓ Pillow ready')"
```

### 2. OpenAI API Key 설정

1. **API Key 생성**: https://platform.openai.com/api-keys
   - "Create new secret key" 클릭
   - Key를 안전하게 복사

2. **환경 변수 설정**:
   
   **Windows PowerShell**:
   ```powershell
   $env:OPENAI_API_KEY = "sk-your-key-here"
   ```
   
   **Windows CMD**:
   ```cmd
   set OPENAI_API_KEY=sk-your-key-here
   ```
   
   **Linux/macOS**:
   ```bash
   export OPENAI_API_KEY="sk-your-key-here"
   ```

3. **영구 설정** (.env 파일):
   ```
   # D:\StanPC\poca-exchange\.env
   OPENAI_API_KEY="sk-your-key-here"
   ```

### 3. 파일 구조 확인

```
D:\StanPC\scripts\
├── vision_image_resizer.py       ← 이미지 리사이징
├── vision_llm_analyzer.py        ← LLM 판독기
├── vision_pipeline.py            ← 통합 파이프라인
├── vision_pipeline_pilot.py      ← 파일럿 테스트 (실행 대상)
└── image_filter.py               ← 기존 키워드 필터
```

---

## 🚀 Pilot Test 실행 (100 Images)

### Step 1: 파일럿 실행

```bash
cd D:\StanPC
python scripts/vision_pipeline_pilot.py
```

**예상 소요 시간**: ~5-10분 (네트워크 속도에 따라 다름)

### Step 2: 결과 확인

실행 완료 후 생성 파일:

```
D:\StanPC\vision_pilot_output\
├── results/
│   └── pilot_100_approved.json       # ✅ 승인된 이미지
├── rejected/
│   └── pilot_100_rejected.json       # ❌ 거부된 이미지
├── review_queue/
│   └── pilot_100_review.json         # ⚠️ 검토 필요
├── pilot_100_summary.json            # 📊 통계
└── PILOT_REPORT.md                   # 📄 최종 리포트
```

### Step 3: 결과 분석

**PILOT_REPORT.md** 파일에서:
- ✅ 승인률 (Approval Rate)
- ⏱️ 처리 시간 (Processing Time)
- 💰 API 비용 (Total Cost)
- 📈 전체 롤아웃 예상 (Projected Rollout)

---

## 💡 Module Details

### VisionImageResizer
```python
from vision_image_resizer import VisionImageResizer

resizer = VisionImageResizer()
b64_image, orig_size = resizer.process_image_url(
    "https://example.com/photo.jpg",
    max_dim=512  # 512px로 리사이징
)
```

**이점:**
- ✅ 토큰 사용량 최소화 (원본 → 512px max)
- ✅ WEBP 압축 (JPEG보다 25-30% 작음)
- ✅ RGBA/LA/P 모드 자동 변환

**비용 절감 효과:**
- 원본 (2000px): ~1,000 토큰
- 리사이징 (512px): ~150-250 토큰
- **절감율: 75-85%**

### VisionLLMAnalyzer
```python
from vision_llm_analyzer import VisionLLMAnalyzer

analyzer = VisionLLMAnalyzer(api_key="sk-...")
result = analyzer.analyze_image(base64_image, image_format="webp")

# 응답 스키마
{
    "is_single_card": True,
    "confidence_score": 95,
    "reason": "clear single portrait card",
    "usage": {
        "input_tokens": 234,
        "output_tokens": 18,
        "total_tokens": 252
    },
    "success": True
}
```

**프롬프트 특징:**
- 강제 JSON 응답
- 한국어 상황 고려 (묶음, 세트 등)
- 신뢰도 점수 (0-100)
- 거부 이유 기록

### VisionFilteringPipeline
```python
from vision_pipeline import VisionFilteringPipeline

pipeline = VisionFilteringPipeline(output_dir="output")

# 단일 이미지 필터링
result = pipeline.filter_image(
    image_url="https://...",
    title="BTS RM Photocard",
    card_id="bts_rm_001",
    source="ebay"
)

# 배치 처리
stats = pipeline.process_batch(images, batch_name="batch_001")
pipeline.save_results("batch_001")
```

**필터링 단계:**
1. 📝 키워드 필터: "lot", "set", "bundle", "묶음" 배제
2. 📥 다운로드: URL에서 이미지 수신
3. 🔄 리사이징: 512px 이내로 압축
4. 🧠 LLM 판독: "단일 카드인가?" 판정
5. 💾 결과 저장: approved/rejected/review

---

## 📊 Expected Results (Pilot 100 Images)

| Metric | Estimate |
|--------|----------|
| Approval Rate | 55-70% |
| Processing Time | 5-10 min |
| Total Tokens | 30,000-40,000 |
| API Cost | $0.10-0.15 |
| Cost per Image | $0.001-0.0015 |

### 전체 22,500 카드 롤아웃 예상

| Metric | Estimate |
|--------|----------|
| Processing Time | 1.5-2.5 hours |
| Approved Images | 12,375-15,750 |
| NULL Placeholders | 6,750-10,125 |
| Total API Cost | $22.50-33.75 |

---

## ⚙️ Configuration & Tuning

### 1. LLM 모델 변경

파일럿에서 다른 모델을 시도하려면:

```python
# vision_llm_analyzer.py 수정
MODEL = "gpt-4o"  # 더 정확 (비용 3-4배)
MODEL = "gpt-4-vision"  # 레거시
```

### 2. 이미지 리사이징 파라미터

```python
# vision_image_resizer.py 수정
MAX_DIMENSION = 256  # 더 작게 (비용 감소, 정확도 감소)
MAX_DIMENSION = 768  # 더 크게 (비용 증가, 정확도 증가)
QUALITY = 60  # 압축률 조정 (50-95)
```

### 3. 키워드 필터 커스터마이징

```python
# image_filter.py 수정
EXCLUDE_KEYWORDS = [
    "lot", "set", "bundle",
    "묶음", "셋트", "모음",
    # 추가 키워드
]
```

---

## 🔍 Debugging & Logging

### Verbose 로깅 활성화

```bash
# Python 스크립트 상단에 추가
import logging
logging.basicConfig(level=logging.DEBUG)
```

### API 호출 테스트

```bash
# 단일 이미지 테스트
python -c "
from vision_image_resizer import VisionImageResizer
from vision_llm_analyzer import VisionLLMAnalyzer

resizer = VisionImageResizer()
analyzer = VisionLLMAnalyzer()

b64, size = resizer.process_image_url('https://example.com/card.jpg')
result = analyzer.analyze_image(b64)
print(result)
"
```

---

## 💰 Cost & Optimization

### gpt-4o-mini 가격 (2024)
- Input: $0.15 / 1M tokens
- Output: $0.60 / 1M tokens

### 비용 절감 전략

1. **이미지 리사이징** (가장 효과적)
   - 512px 리사이징 → 75-85% 토큰 절감
   - 한 이미지당 ~250 토큰 → ~60 토큰

2. **배치 처리 (미지원, 향후)**
   - 여러 이미지를 한 번에 보낼 수 없음 (현재)
   - Vision API 한계

3. **캐싱** (미지원, 향후)
   - Prompt caching으로 반복 분석 최적화

---

## 🎯 Next Steps After Pilot

### ✅ Go Decision Criteria

**Approval Rate 기준:**
- ≥60%: 즉시 전체 롤아웃 진행
- 50-59%: MEDIUM confidence도 포함하여 재실행
- <50%: 프롬프트 재검토, 다른 모델 시도

**비용 검증:**
- 예상 총 비용 < $50: 승인
- 예상 총 비용 $50-100: 예산 검토
- 예상 총 비용 > $100: 다른 전략 고려

### 📝 Full Rollout 절차

1. Pilot 결과 분석 및 결정
2. eBay + Naver API 대량 수집 (실제 이미지 URL 획득)
3. 22,500 카드 대상 파이프라인 실행
4. DB 대량 삽입 (imageUrl NULL 처리)
5. 웹 UI 플레이스홀더 정상 표시 확인
6. 유저 이미지 제보 UI 론칭

---

## 📚 References

- OpenAI API Docs: https://platform.openai.com/docs
- Vision API Guide: https://platform.openai.com/docs/guides/vision
- gpt-4o-mini Specs: https://platform.openai.com/docs/models/gpt-4o-mini
