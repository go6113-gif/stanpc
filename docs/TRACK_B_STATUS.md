# Track B: Data Pipeline & Crawler - Status Report

**작업 디렉터리:** `/scripts`  
**작업 기간:** 2026-08-11 (MVP 병렬 개발)  
**상태:** ✅ **Phase 2 완성 (Analytics & Enhanced Image Processing)**

---

## 📊 전체 진행 현황

| Phase | 항목 | 상태 | 완료일 |
|-------|------|------|--------|
| Phase 1 | eBay 크롤러 (`ebay_scraper.py`) | ✅ 완료 | 2026-08-11 |
| Phase 1 | 번개장터 크롤러 (`bungle_crawler.py`) | ✅ 완료 | 2026-08-11 |
| Phase 1 | 이미지 처리 파이프라인 (`image_pipeline.py`) | ✅ 완료 | 2026-08-11 |
| Phase 1 | 통합 테스트 (`test_pipeline.py`) | ✅ 완료 | 2026-08-11 |
| **Phase 2** | **가격 통계 모듈 (`analytics.py`)** | **✅ 완료** | **2026-08-11** |
| **Phase 2** | **썸네일 생성 & 크기 정보** | **✅ 완료** | **2026-08-11** |
| Phase 3 | DB 연동 (Track A) | ⏳ 대기 중 | - |
| Phase 3 | API 엔드포인트 (Track A) | ⏳ 대기 중 | - |

---

## 📁 모듈별 상세 설명

### 1. **ebay_scraper.py** (6.9 KB)
**목적:** eBay API를 통한 포토카드 시세 수집

**주요 기능:**
- Bearer Token 인증 (캐싱 지원)
- Rate limiting (1초 딜레이)
- 재시도 로직 (Exponential backoff, 최대 3회)
- 검색 결과 및 상세정보 조회

**사용법:**
```bash
python scripts/ebay_scraper.py
```

**출력:**
- `ebay_listings.json` - 수집된 포토카드 데이터

---

### 2. **bungle_crawler.py** (7.9 KB)
**목적:** 번개장터(국내 중고 마켓) 포토카드 시세 크롤링

**주요 기능:**
- BeautifulSoup 기반 웹 크롤링
- 1.5~3.5초 랜덤 딜레이 (Respectful crawling)
- 예외 처리 (Timeout, Connection error)
- 재시도 로직 (3회, Exponential backoff)

**사용법:**
```bash
python scripts/bungle_crawler.py
```

**출력:**
- `bungle_listings.json` - 수집된 포토카드 데이터

---

### 3. **image_pipeline.py** (11+ KB) - *Phase 2에서 확장됨*
**목적:** 포토카드 이미지 정규화 및 최적화

**주요 기능 (Phase 1):**
- OpenCV 기반 다중카드 인식
- 1:1.54 비율 정규화
- 30~50KB WebP 압축 (적응형 품질)

**새로운 기능 (Phase 2):**
- ✅ **썸네일 자동 생성** (100x154px WebP)
- ✅ **이미지 메타데이터 추출** (크기, 해상도, 압축률)
- ✅ **배치 처리 스토리지 요약**

**사용법:**
```bash
# 썸네일 포함 처리
python scripts/image_pipeline.py

# 프로그래밍 방식
from image_pipeline import ImagePipeline
pipeline = ImagePipeline()
result = pipeline.process_batch(generate_thumbnail=True)
```

**출력:**
- `/output/{filename}_card_{n}.webp` - 정규화된 카드 이미지
- `/output/{filename}_card_{n}_thumb.webp` - 썸네일 (100x154px)
- `processing_report.json` - 처리 결과 및 메타데이터

**출력 예시:**
```json
{
  "output_files": [
    {
      "file": "batch_001_card_1.webp",
      "size_kb": 38.5,
      "dimensions": "300x462",
      "aspect_ratio": "0.649",
      "thumbnail": {
        "file": "batch_001_card_1_thumb.webp",
        "size_kb": 4.2
      }
    }
  ],
  "storage_summary": {
    "total_webp_size_mb": 1.25,
    "total_thumbnail_size_mb": 0.18
  }
}
```

---

### 4. **analytics.py** (NEW - Phase 2) - 가격 변동 추이 분석
**목적:** 수집된 크롤 데이터의 가격 통계 분석

**주요 기능:**
- 최저가, 평균가, 최고가 계산
- 표준편차 및 중앙값 분석
- 시간대별 가격 변동 추이 (up/down/stable)
- 시장별 가격 비교 (eBay vs 번개장터)
- JSON 리포트 생성

**클래스:**
- `PricePoint` - 단일 가격 관찰
- `PriceStatistics` - 집계 통계
- `CardPriceAnalysis` - 카드별 종합 분석
- `PriceAnalyzer` - 메인 분석 엔진

**사용법:**
```bash
# 데이터 로드 및 분석
python scripts/analytics.py

# 프로그래밍 방식
from analytics import PriceAnalyzer

analyzer = PriceAnalyzer()
analyzer.load_from_json("ebay_listings.json")
analyzer.load_from_json("bungle_listings.json")

analyses = analyzer.analyze_all()
analyzer.export_report(analyses, output_file="output/price_analysis_report.json")
analyzer.print_summary(analyses)
```

**출력:**
- `output/price_analysis_report.json` - 종합 분석 리포트

**리포트 예시:**
```json
{
  "generated_at": "2026-08-11T16:00:00.000Z",
  "market_summary": {
    "total_observations": 150,
    "unique_cards": 45,
    "overall_min": 5000,
    "overall_max": 25000,
    "overall_avg": 12500,
    "market_breakdown": {
      "ebay": {
        "count": 75,
        "min": 5000,
        "max": 15000,
        "avg": 10500
      },
      "bungle": {
        "count": 75,
        "min": 8000,
        "max": 25000,
        "avg": 14500
      }
    }
  },
  "card_analyses": [
    {
      "card_id": "BTS_V_001",
      "card_name": "BTS V Official Card",
      "statistics": {
        "min_price": 5000,
        "max_price": 8000,
        "avg_price": 6500,
        "median_price": 6400,
        "std_dev": 1100,
        "total_samples": 12,
        "currency": "KRW",
        "markets": ["ebay", "bungle"],
        "time_period_days": 5,
        "price_change_pct": 8.5
      },
      "trend": "up",
      "price_points": [...]
    }
  ],
  "trend_summary": {
    "up": 18,
    "down": 12,
    "stable": 15
  }
}
```

**콘솔 출력 예시:**
```
Market Summary:
  Total observations: 150
  Unique cards: 45
  Price range: 5,000 - 25,000 KRW
  Average price: 12,500 KRW

Breakdown by Market:
  EBAY:
    Count: 75
    Range: 5,000 - 15,000
    Average: 10,500
  BUNGLE:
    Count: 75
    Range: 8,000 - 25,000
    Average: 14,500

Trend Analysis:
  Uptrend: 18 cards
  Downtrend: 12 cards
  Stable: 15 cards

Top 5 Most Expensive Cards:
  1. TWICE Nayeon Limited: 25,000 KRW
  2. NewJeans Hanni Sealed: 20,000 KRW
  ...
```

---

### 5. **test_pipeline.py** (8.4 KB)
**목적:** 모든 모듈의 통합 테스트

**테스트 항목:**
- ✅ eBay 스크래퍼 초기화
- ✅ 번개장터 크롤러 초기화
- ✅ 이미지 파이프라인 초기화
- ✅ I/O 및 샘플 디렉토리

**사용법:**
```bash
python scripts/test_pipeline.py
```

---

## 🔄 데이터 흐름 (Data Flow)

```
┌─────────────────────────────────────────────────────────────┐
│                   Track B: Data Pipeline                    │
└─────────────────────────────────────────────────────────────┘

1. 데이터 수집 (Crawling)
   ┌──────────────────┐    ┌──────────────────┐
   │  ebay_scraper    │    │ bungle_crawler   │
   │  (API-based)     │    │ (Web-based)      │
   └────────┬─────────┘    └────────┬─────────┘
            │                       │
            └───────────┬───────────┘
                        ▼
         ┌─────────────────────────────┐
         │  ebay_listings.json         │
         │  bungle_listings.json       │
         └────────────┬────────────────┘

2. 데이터 분석 (Analytics)
         ┌────────────┴────────────┐
         ▼                         ▼
   ┌──────────────┐         ┌──────────────────┐
   │  analytics   │         │  image_pipeline  │
   │  .py         │         │  .py             │
   │              │         │                  │
   │ • Min/Max    │         │ • Crop cards     │
   │ • Avg price  │         │ • Normalize 1:1.54
   │ • Trend      │         │ • Compress WebP  │
   │ • Volatility │         │ • Generate thumb │
   └──────┬───────┘         └────────┬─────────┘
          │                          │
          └──────────┬───────────────┘
                     ▼
    ┌────────────────────────────────────┐
    │  output/                           │
    │  ├─ price_analysis_report.json     │
    │  ├─ processing_report.json         │
    │  ├─ *_card_1.webp (300x462)        │
    │  ├─ *_card_1_thumb.webp (100x154)  │
    │  └─ ...                            │
    └────────┬───────────────────────────┘

3. Track A/C 통합 준비 (Next Phase)
         ▼
    ┌──────────────────────────┐
    │  Track A: DB             │
    │  └─ Prisma Models        │
    │     • PhotoCard          │
    │     • PriceHistory       │
    │     • GlobalSKUMapping   │
    └──────┬───────────────────┘
           │
           ├──► API Endpoints
           │
           └──► Track C: Frontend
                └─ /gallery UI
```

---

## 📊 Phase 2 추가 기능 상세

### A. 이미지 처리 개선 (image_pipeline.py)

**새로운 설정:**
```python
class CardDetectionConfig:
    THUMBNAIL_WIDTH = 100           # 100px 너비
    THUMBNAIL_QUALITY = 75          # 75% 품질 (빠른 로딩)
```

**메서드 추가:**
```python
def generate_thumbnail(card: np.ndarray) -> bytes:
    """
    100x154px WebP 썸네일 생성
    - 목적: 갤러리 빠른 로딩
    - 용도: UI 그리드 미리보기
    """
```

**배치 처리 개선:**
```json
// 기존
"output_files": [{"file": "...", "size_kb": 38.5}]

// 개선 (Phase 2)
"storage_summary": {
  "total_webp_size_mb": 1.25,
  "total_thumbnail_size_mb": 0.18
}
```

---

### B. 가격 통계 분석 (analytics.py - NEW)

**PriceAnalyzer 클래스:**
```python
class PriceAnalyzer:
    def load_from_json(json_file)        # JSON 데이터 로드
    def analyze_card(card_id)            # 카드별 분석
    def analyze_all()                    # 전체 분석
    def get_market_summary()             # 시장별 요약
    def export_report()                  # JSON 리포트 생성
    def print_summary()                  # 콘솔 출력
```

**분석 지표:**
- **가격 통계:** Min, Max, Avg, Median, Std Dev
- **추세 분석:** Up (+5% 이상), Down (-5% 이상), Stable
- **시장 비교:** eBay vs 번개장터 가격 차이
- **변동성:** 최고가-최저가 범위
- **시계열:** 시간대별 가격 변동

---

## 🎯 Track A-B-C 통합 체크리스트

### Track B 담당 (완료 예정):
- [x] eBay/번개장터 크롤러 완성
- [x] 이미지 처리 파이프라인 완성
- [x] 가격 통계 모듈 구현
- [x] 썸네일 생성 기능 추가
- [ ] Prisma 모델로 데이터 변환 로직 (Phase 3)
- [ ] Supabase Storage 업로드 자동화 (Phase 3)

### Track A 담당 (대기 중):
- [ ] DATABASE_URL 연결 및 `npx prisma db push`
- [ ] Mock API 엔드포인트 작성
- [ ] Track B 데이터 → Prisma 매핑 스펙 정의

### Track C 담당 (대기 중):
- [ ] Mock JSON 제거
- [ ] 실제 API 데이터 페칭 구현
- [ ] Supabase CDN URL 연결

---

## 📈 다음 단계 (Phase 3)

1. **데이터 저장소 연동**
   - Track B 크롤 데이터 → Track A Prisma 모델 변환
   - Supabase에 자동 저장

2. **이미지 저장소 연동**
   - WebP 파일 → Supabase Storage 업로드
   - CDN URL 생성 (Track C에서 사용)

3. **API 통합**
   - Track A Mock API 엔드포인트 활성화
   - Track C 실시간 데이터 페칭

4. **모니터링**
   - 크롤 스케줄 (매일/매주)
   - 가격 변동 알림
   - 중복 데이터 감지

---

## 📝 사용 예시

### 전체 파이프라인 실행
```bash
# 1. 데이터 수집
python scripts/ebay_scraper.py
python scripts/bungle_crawler.py

# 2. 이미지 처리 (썸네일 포함)
python scripts/image_pipeline.py

# 3. 가격 분석
python scripts/analytics.py

# 결과 확인
# output/ 폴더에 생성된 파일들:
# - price_analysis_report.json
# - processing_report.json
# - *_card_*.webp (메인 이미지)
# - *_card_*_thumb.webp (썸네일)
```

### Python에서 프로그래밍 방식
```python
from analytics import PriceAnalyzer
from image_pipeline import ImagePipeline

# 가격 분석
analyzer = PriceAnalyzer()
analyzer.load_from_json("ebay_listings.json")
analyzer.load_from_json("bungle_listings.json")
analyses = analyzer.analyze_all()
analyzer.export_report(analyses)

# 이미지 처리
pipeline = ImagePipeline()
result = pipeline.process_batch(generate_thumbnail=True)
pipeline.save_report(result)
```

---

## 📦 Dependencies

```txt
requests>=2.31.0
beautifulsoup4>=4.12.0
pillow>=10.0.0
opencv-python>=4.8.0
lxml>=4.9.0
```

설치:
```bash
pip install -r scripts/requirements.txt
```

---

## ✨ 특징 요약

| 특징 | Phase 1 | Phase 2 |
|------|---------|---------|
| eBay 크롤링 | ✅ | ✅ |
| 번개장터 크롤링 | ✅ | ✅ |
| 이미지 크롭/정규화 | ✅ | ✅ |
| WebP 압축 | ✅ | ✅ |
| **가격 통계 분석** | ❌ | ✅ NEW |
| **썸네일 생성** | ❌ | ✅ NEW |
| **메타데이터 추출** | ❌ | ✅ NEW |
| **스토리지 요약** | ❌ | ✅ NEW |

---

**마지막 업데이트:** 2026-08-11  
**다음 예정:** Phase 3 (Track A-B-C 통합 & DB 연동)
