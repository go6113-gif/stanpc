# 🎴 실제 포토카드 테스트 가이드

## 📋 개선 사항

이제 봇이 **실제 포토카드 이미지**로 테스트되며, 다음 기능들이 추가/개선되었습니다:

### ✨ 핵심 개선 사항

1. **실제 이미지 다운로드**: 합성 이미지 대신 실제 공개 이미지 사용
2. **비교 이미지 자동 생성**: 원본 vs 정제 이미지를 나란히 보기 (Side-by-Side)
3. **개선된 회전 보정**: HoughLines 기반 더 정확한 각도 감지
4. **개선된 크롭 알고리즘**: minAreaRect를 사용한 더 정확한 경계선 감지
5. **자동 padding 조정**: 과도한 크롭 방지 (여백 5px)

## 🚀 빠른 시작

### 명령어 1: 실제 이미지로 테스트 (기본)
```bash
cd D:\Poca_exchange
python sample_test.py --real
```

**수행 작업:**
- Unsplash 공개 이미지 4개 다운로드
- 각 이미지 처리 및 품질 평가
- 최고 품질 이미지 선택

**소요 시간:** 5-10초

**결과 파일:**
```
output/
├── best_card.png           # 최고 품질 정제 이미지
├── comparison_result.png   # 원본 vs 정제 나란히 보기
└── evaluation_report.json  # 상세 평가 점수
```

### 명령어 2: 자신의 이미지로 테스트
```bash
python sample_test.py --urls "C:/path/to/card1.jpg" "C:/path/to/card2.jpg" "C:/path/to/card3.jpg"
```

### 명령어 3: 이미지 URL로 테스트
```bash
python sample_test.py --urls "https://example.com/card1.jpg" "https://example.com/card2.jpg"
```

## 📊 테스트 결과 해석

### 생성되는 파일들

#### 1. **best_card.png** (최고 품질 이미지)
- 평가 점수가 가장 높은 이미지 (정제됨)
- 크기: ~260×400px (표준 포토카드 비율 1:1.54)
- 사용처: 데이터베이스 저장, API 응답

#### 2. **comparison_result.png** (비교 이미지)
```
┌─────────────────┬─────────────────┐
│   Original      │   Processed     │
│                 │                 │
│  (원본 사진)     │  (정제 후)      │
│                 │                 │
└─────────────────┴─────────────────┘
```
- 원본 이미지 (좌측)
- 정제된 이미지 (우측)
- 회전 보정 및 크롭 결과를 한눈에 확인

#### 3. **evaluation_report.json** (평가 리포트)
```json
{
  "best_image_index": 2,
  "best_score": 61.2,
  "all_scores": {
    "image_1": {
      "overall": 61.2,
      "sharpness": 7.6,
      "aspect_ratio": 99.7,
      "resolution": 99.7,
      "noise": 30.0,
      "brightness": 97.2
    },
    "image_2": { ... }
  }
}
```

## 🔧 알고리즘 개선 사항

### 회전 보정 (Straighten)

**이전:**
- Hough Line 변환 사용
- 직선 각도만 감지

**개선:**
```python
# 더 정확한 각도 감지
1. Canny 엣지 감지
2. HoughLines로 직선 추출
3. 여러 직선의 각도 수집
4. 중앙값(Median) 사용 (이상치 제거)
5. ±25도 범위 내 회전만 적용
6. 최소 1도 이상 회전만 실행
```

**장점:**
- 이상치에 강한 중앙값 사용
- 과도한 회전 방지
- 가는 선이나 노이즈에 덜 영향받음

### 크롭 알고리즘 (Region Detection)

**이전:**
- 단순 Bounding Rectangle 사용
- 회전된 객체에서 부정확한 크롭

**개선:**
```python
1. GaussianBlur로 노이즈 제거
2. Canny 엣지 감지
3. 최대 면적 contour 찾기
4. minAreaRect로 정확한 사각형 피팅
5. 면적 비율 검증 (>70%)
6. 최소 padding (5px) 적용
```

**장점:**
- 회전된 포토카드도 정확하게 감지
- 경계선 근처까지 최대한 활용
- 여전히 안전한 여백 유지

## 📈 성능 지표

### 테스트 결과 예시
```
처리 이미지: 4개
성공: 2개 (50%)
평가:
  - Image 2: 61.2/100 (Best) ⭐
  - Image 4: 59.2/100

처리 시간: ~4초
비교 이미지 생성: 자동
```

### 점수 분석

| 이미지 | 선명도 | 종횡비 | 해상도 | 노이즈 | 밝기 | 종합 |
|--------|--------|--------|--------|--------|------|------|
| Image 2 | 7.6 | 99.7 | 99.7 | 30.0 | 97.2 | **61.2** |
| Image 4 | 0.2 | 99.7 | 99.7 | 30.0 | 98.7 | **59.2** |

**분석:**
- 종횡비, 해상도: 둘 다 우수 (99.7/100)
- 선명도: 이미지 2가 더 좋음 (7.6 vs 0.2)
- 노이즈: 일반적인 사진이라 낮음 (30.0)
- 밝기: 매우 좋음 (97-98점)

## 🎯 실제 사용 워크플로우

### 워크플로우 1: 다중 이미지 비교 및 선택

```bash
# 3개의 포토카드 사진 테스트
python sample_test.py --urls "card1.jpg" "card2.jpg" "card3.jpg"

# 결과
# → best_card.png: 가장 품질 좋은 이미지 자동 선택
# → comparison_result.png: 최고 품질 이미지의 변환 과정 시각화
# → evaluation_report.json: 모든 이미지의 점수 기록
```

### 워크플로우 2: 품질 모니터링

```bash
# 정기적으로 포토카드 품질 모니터링
python sample_test.py --urls "sample.jpg"

# JSON 리포트로 시계열 데이터 수집
# → 시간별 품질 변화 추적
```

### 워크플로우 3: 메인 프로젝트 통합

```python
# Python에서 직접 호출
import subprocess
import json

# 이미지 처리
subprocess.run([
    "python", "photocard-ai-bot-test.py",
    "image1.jpg", "image2.jpg"
])

# 결과 읽기
with open("output/evaluation_report.json") as f:
    report = json.load(f)
    best_idx = report['best_image_index']
    best_score = report['best_score']
    print(f"Best: Image {best_idx} ({best_score:.1f}/100)")
```

## 🔍 출력 파일 상세 분석

### comparison_result.png의 장점

✅ **시각적 검증:**
- 회전 보정이 제대로 되었는지 확인
- 크롭 영역이 적절한지 확인
- 원본의 어느 부분이 잘렸는지 확인

✅ **디버깅:**
- 알고리즘 개선 필요 부분 파악
- 입력 이미지의 품질 확인
- 처리 과정의 손실 시각화

✅ **문서화:**
- 처리 결과를 한눈에 이해
- 품질 평가의 근거 제시

## 📝 주의사항

### 이미지 선택 팁

**높은 점수를 받으려면:**
1. ✅ **선명한 이미지**: 카메라 초점이 맞아야 함
2. ✅ **적절한 밝기**: 너무 어둡거나 밝지 않아야 함
3. ✅ **최소 크기**: 260×400px 이상 권장
4. ✅ **최소한의 기울임**: ±25도 이내

**낮은 점수를 받으면:**
1. ❌ 흐릿한 사진 → 선명도 낮음
2. ❌ 너무 작은 이미지 → 해상도 낮음
3. ❌ 극도로 기울어진 사진 → 회전 보정 실패
4. ❌ 포토카드가 일부만 보임 → 크롭 실패

## 🚀 다음 단계

1. **로컬 이미지 테스트**
   ```bash
   python sample_test.py --urls "your_card.jpg"
   ```

2. **다중 이미지 비교**
   ```bash
   python sample_test.py --urls "card1.jpg" "card2.jpg" "card3.jpg"
   ```

3. **메인 프로젝트 연동**
   - `best_card.png`를 데이터베이스에 저장
   - `evaluation_report.json`으로 품질 추적

4. **배치 자동화**
   - 여러 포토카드를 정기적으로 처리
   - 최고 품질 이미지만 선택
   - 점수 기록 및 분석

## 📞 문제 해결

### "Failed to load" 에러
```
❌ Error: Failed to load https://... 404 Client Error: Not Found

✅ 해결:
   - URL이 정확한지 확인
   - 이미지 호스팅 서버가 접근 가능한지 확인
   - 네트워크 연결 확인
```

### 비교 이미지가 생성되지 않음
```
❌ Comparison not saved

✅ 해결:
   - output 디렉토리가 쓰기 가능한지 확인
   - 디스크 용량 확인
   - output 디렉토리 수동 생성
```

### 점수가 계속 낮음
```
❌ Overall score < 50 consistently

✅ 원인:
   1. 선명도 낮음 → 더 선명한 사진 사용
   2. 해상도 낮음 → 더 큰 이미지 사용
   3. 회전 너무 많음 → 반듯한 사진 사용
```

---

이제 **실제 포토카드 이미지**로 봇을 테스트할 수 있습니다! 🎉

**명령어:**
```bash
cd D:\Poca_exchange
python sample_test.py --real
```
