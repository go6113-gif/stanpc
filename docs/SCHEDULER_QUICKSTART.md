# Scheduler Quick Start

## 30초 시작 가이드

### 1️⃣ 의존성 설치

```bash
cd D:\StanPC
pip install apscheduler
```

### 2️⃣ 한 번만 실행해보기 (테스트)

```bash
python scripts/scheduler.py --once
```

**예상 결과:**
- 크롤링 → 이미지 처리 → 가격 분석 → DB 적재 순서로 자동 실행
- 각 단계별 결과가 콘솔에 출력됨
- `logs/pipeline.log`에 상세 로그 기록

### 3️⃣ 6시간마다 자동 실행하기 (데몬 모드)

```bash
python scripts/scheduler.py --daemon
```

**특징:**
- 시작 시 즉시 1회 실행
- 이후 6시간 간격으로 자동 반복
- `Ctrl+C`로 중단 가능

---

## 📊 파이프라인 흐름

```
┌─────────────────────────────────────────────────────────┐
│         StanPC Data Pipeline (Graceful Degradation)     │
└─────────────────────────────────────────────────────────┘

Phase 1: 수집 (Collection)
  ├─ eBay API 크롤링 (10개/키워드)
  │  └─ 실패 → WARNING + 계속 진행
  └─ Bungle 웹 크롤링 (2페이지/키워드)
     └─ 실패 → WARNING + 계속 진행

Phase 2: 이미지 처리 (Optional)
  ├─ 다중카드 감지 및 자동 크롭
  ├─ 1:1.54 비율 정규화
  └─ WebP 압축 (30-50KB)

Phase 3: 가격 분석
  ├─ Min/Max/Avg 계산
  ├─ 시장별 비교
  └─ 추세 분석 (상승/하강/안정)

Phase 4: 데이터 저장
  └─ seed_data.json 생성 (Prisma 연동용)

Phase 5: DB 적재 (Optional)
  └─ npm run db:seed로 PostgreSQL에 저장
```

---

## 📁 출력 파일

| 경로 | 설명 |
|------|------|
| `logs/pipeline.log` | 모든 파이프라인 이벤트 (JSON 포맷) |
| `logs/runs/{timestamp}_record.json` | 완전한 실행 기록 |
| `scripts/seed_data/seed_data.json` | 수집 및 정규화된 데이터 |
| `scripts/output/*.webp` | 처리된 포토카드 이미지 |

---

## 🔍 로그 확인하기

### 실시간 로그 보기 (데몬 모드)

```bash
tail -f logs/pipeline.log
```

### JSON 로그 파싱 (Linux/Mac)

```bash
# 모든 로그 보기
cat logs/pipeline.log | jq '.'

# 에러만 필터링
cat logs/pipeline.log | jq 'select(.level=="ERROR")'

# 특정 단계 보기
cat logs/pipeline.log | jq 'select(.pipeline_step=="collect_ebay_data")'
```

### 실행 기록 보기

```bash
# 최신 실행 기록
cat logs/runs/20250811_123456_record.json | jq '.'

# 요약만 보기
cat logs/runs/*/record.json | jq '.summary'
```

---

## ⚙️ 설정 변경

### 간격 변경 (예: 12시간으로)

`scripts/scheduler.py`에서:

```python
class PipelineScheduler:
    INTERVAL_HOURS = 12  # 6에서 12로 변경
```

### 검색 키워드 추가/변경

`scripts/scheduler.py`에서:

```python
class StanPCDataPipeline:
    SEARCH_KEYWORDS = [
        "TWICE TZUYU 포토카드",
        "BLACKPINK JENNIE 포토카드",
        # 여기에 추가
    ]
```

---

## 🚨 문제 해결

| 문제 | 해결책 |
|------|-------|
| `ImportError: apscheduler` | `pip install apscheduler` 실행 |
| eBay 0개 수집 | API 토큰 확인 (`.env`), 레이트 제한 확인 |
| Bungle 403 에러 | 다음 실행까지 기다리기 (자동 재시도) |
| `npm: command not found` | Node.js 설치 필요 (선택사항, DB 적재만 스킵됨) |
| 이미지 처리 스킵됨 | `scripts/sample_images/` 폴더 생성 후 이미지 추가 |

---

## 📈 모니터링

### 최신 실행 상태 확인

```bash
# 최근 실행 기록 보기
ls -lt logs/runs/ | head -5

# 최신 기록 상세 조회
tail -1 logs/runs/*/record.json | jq '.overall_status'
```

### 성공률 체크

```bash
# 모든 실행의 최종 상태 확인
for f in logs/runs/*_record.json; do
  echo "$f: $(jq -r '.overall_status' $f)"
done
```

---

## 🔄 자동 실행 (선택)

### Windows 작업 스케줄러

1. 시작 → "작업 스케줄러"
2. "작업 만들기"
3. 작업 이름: `StanPC-Scheduler`
4. "작업" 탭 → "새로 만들기"
   - 프로그램: `python`
   - 인수: `scripts/scheduler.py --daemon`
   - 시작 위치: `D:\StanPC`
5. "트리거" 탭 → "새로 만들기" → "로그온할 때" 실행
6. 확인

### Linux/Mac (cron)

```bash
# crontab 편집
crontab -e

# 부팅 시 자동 시작
@reboot cd /path/to/StanPC && python scripts/scheduler.py --daemon >> logs/scheduler.log 2>&1 &
```

---

## 📚 상세 문서

- **[SCHEDULER_GUIDE.md](SCHEDULER_GUIDE.md)** - 완전한 기능 가이드
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - DB 설정
- **[SESSION_HANDOFF.md](SESSION_HANDOFF.md)** - 프로젝트 전체 맥락

---

## 💡 팁

✅ **테스트**: `--once`로 먼저 한 번 실행해보기  
✅ **로그 모니터링**: `tail -f logs/pipeline.log`로 실시간 확인  
✅ **부분 실패 허용**: 한 단계 실패해도 다음 단계는 계속 진행됨  
✅ **자동 재시도**: 네트워크 오류는 다음 실행에서 자동 복구  

---

**준비 완료!** 🚀

```bash
python scripts/scheduler.py --daemon
```
