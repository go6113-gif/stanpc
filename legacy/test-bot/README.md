# Photocard AI Bot Test Script

독립적으로 실행 가능한 AI 기반 포토카드 품질 평가 테스트 봇입니다. 웹 URL로부터 포토카드 이미지를 다운로드하고, 자동으로 정제한 후, 품질을 평가하여 최적의 이미지를 선별합니다.

## 기능

### Step 1: 이미지 가공 및 정제
- **이미지 다운로드**: URL에서 포토카드 이미지 다운로드
- **수평 보정**: Hough Line Transform을 이용한 자동 회전 보정
- **영역 감지**: 엣지 감지를 통해 포토카드 영역 자동 감지
- **크롭**: 감지된 영역 기준으로 이미지 자르기
- **표준화**: 표준 포토카드 크기(260x400px, 1:1.54 비율)로 리사이징

### Step 2: 품질 평가 AI 봇
각 이미지에 대해 다음 항목을 평가합니다 (0~100점):

1. **선명도 (30% 가중치)**: Laplacian Variance를 이용한 선명도 측정
2. **종횡비 (20% 가중치)**: 표준 포토카드 비율(1:1.54) 적합성
3. **해상도 (20% 가중치)**: 이미지 픽셀 수 기준 평가
4. **노이즈/텍스처 (15% 가중치)**: 이미지 텍스처 품질
5. **밝기/명암 (15% 가중치)**: 최적 밝기 및 명암비

**최종 점수** = 가중치 합산 (0~100점)

### Step 3: 최적 이미지 선택 및 출력
- 가장 높은 점수를 받은 이미지를 `output/best_card.png`로 저장
- 모든 이미지의 상세 평가 점수를 JSON 리포트로 저장 (`output/evaluation_report.json`)
- 콘솔에서 각 이미지별 상세 스코어 출력

## 설치

### 필수 사항
- Python 3.7+
- pip

### 패키지 설치

```bash
pip install -r requirements.txt
```

## 사용법

### 기본 사용

```bash
python photocard-ai-bot-test.py "https://example.com/card1.jpg" "https://example.com/card2.jpg" "https://example.com/card3.jpg"
```

### 예제 (테스트용 공개 이미지 URL)

```bash
python photocard-ai-bot-test.py \
  "https://i.pinimg.com/564x/85/5c/78/855c782e97d0d8a3c9b3e3c4d5f6a7b8.jpg" \
  "https://i.pinimg.com/564x/9a/3b/2c/9a3b2c4d5e6f7a8b9c0d1e2f3a4b5c6d.jpg"
```

### 단일 이미지 테스트

```bash
python photocard-ai-bot-test.py "https://example.com/single_card.jpg"
```

## 출력 결과

### 콘솔 로그 예시

```
2026-08-10 19:05:00,123 - INFO - Processing 3 images...

[Image 1/3] Processing https://example.com/card1.jpg
  Downloaded: (1080, 1080, 3)
  Processed: (260, 400, 3)
  Scores:
    Overall:      87.3
    Sharpness:    92.1
    Aspect Ratio: 85.4
    Resolution:   78.9
    Noise:        81.2
    Brightness:   82.5

[Image 2/3] Processing https://example.com/card2.jpg
  Downloaded: (1200, 900, 3)
  Processed: (260, 400, 3)
  Scores:
    Overall:      79.5
    Sharpness:    85.3
    Aspect Ratio: 92.1
    Resolution:   65.4
    Noise:        72.8
    Brightness:   75.2

==================================================
BEST IMAGE: Image 1
Overall Score: 87.3/100
==================================================
Saved to: output/best_card.png
Report saved to: output/evaluation_report.json
```

### 출력 파일

#### 1. `output/best_card.png`
가장 높은 점수를 받은 정제된 포토카드 이미지

#### 2. `output/evaluation_report.json`
모든 이미지의 상세 평가 점수 (JSON 형식)

```json
{
  "best_image_index": 1,
  "best_score": 87.3,
  "all_scores": {
    "image_1": {
      "overall": 87.3,
      "sharpness": 92.1,
      "aspect_ratio": 85.4,
      "resolution": 78.9,
      "noise": 81.2,
      "brightness": 82.5
    },
    "image_2": {
      "overall": 79.5,
      "sharpness": 85.3,
      "aspect_ratio": 92.1,
      "resolution": 65.4,
      "noise": 72.8,
      "brightness": 75.2
    }
  }
}
```

## 디렉토리 구조

```
test-bot/
├── photocard-ai-bot-test.py    # 메인 스크립트
├── requirements.txt            # 패키지 의존성
├── README.md                   # 이 파일
├── output/                     # 결과 저장 디렉토리 (자동 생성)
│   ├── best_card.png          # 최적 이미지
│   └── evaluation_report.json  # 상세 평가 리포트
```

## 점수 평가 기준

### 선명도 (Sharpness)
- Laplacian Variance 기반
- 값이 클수록 선명함
- 이미지 흐림 감지에 효과적

### 종횡비 (Aspect Ratio)
- 표준 포토카드: 1:1.54 (가로:세로)
- 100점: 정확히 일치
- 비율이 벗어날수록 감점

### 해상도 (Resolution)
- 목표: 260x400px (104,000 픽셀)
- 10점: 100,000 픽셀 이하
- 100점: 목표 이상

### 노이즈/텍스처 (Noise)
- Laplacian 분산 기반
- 포토카드는 텍스처가 있어야 함
- 너무 부드럽거나 너무 거칠면 감점

### 밝기/명암 (Brightness)
- 이상적 밝기: 128 (0~255 중간값)
- 이상적 명암비: 30 이상
- 너무 어둡거나 밝으면 감점

## 제한사항

- 최소 픽셀 크기: 100,000 픽셀 (약 316x316px)
- 지원 이미지 형식: JPG, PNG, GIF, WebP 등 (Pillow 지원 형식)
- 타임아웃: 10초 (URL 다운로드)
- 종횡비 tolerance: ±45도 회전만 보정 (극단적 회전은 보정 불가)

## 문제 해결

### "Failed to download" 에러
- URL이 올바른지 확인
- 이미지 호스팅 서버가 접근 가능한지 확인
- 네트워크 연결 상태 확인

### 낮은 평가 점수
- 이미지가 흐린 경우: 선명도 개선 필요
- 이미지가 너무 작은 경우: 고해상도 이미지 사용
- 포토카드 영역이 일부만 보이는 경우: 전체 이미지 포함된 URL 사용

### 종횡비 불일치
- 원본 이미지의 종횡비 확인
- 극도로 기울어진 이미지는 수동 보정 필요

## 참고사항

- 스크립트는 메인 `poca-exchange` 프로젝트와 완전히 독립적입니다
- 메인 프로젝트의 환경 변수나 설정이 필요 없습니다
- 각 실행 결과는 `output/` 디렉토리에 누적됩니다 (이전 결과는 덮어쓰여짐)

## 라이선스

이 테스트 봇은 교육 및 테스트 목적으로 제공됩니다.
