# Data Assets — 포토카드 마스터 & 수집 데이터

## 📊 파일 가이드

### 🏆 마스터 데이터 (DB Seed 용)

#### 1. **biasroom_groups_master.csv** (931개 그룹)
- 출처: Biasroom (K-POP 데이터베이스)
- 구조: Group_ID, Name_EN, Name_KR, Album_Count, Version_Count, Image_URL
- 용도: Prisma `Group` 테이블 입력
- 품질: ⭐⭐⭐⭐⭐

#### 2. **biasroom_photocards_master.csv** (6,646개 앨범 버전)
- 출처: Biasroom
- 구조: Group_Name, Album_Title, Version_ID, Version_Name, Release_Date, Image_URL
- 용도: Prisma `Album` 테이블 입력 (중복 제거 후 ~1,500건)
- 품질: ⭐⭐⭐⭐⭐

#### 3. **poca_master_db_mb.csv** (3,860개 카드)
- 출처: 포카 컬렉터 커뮤니티 (SKU 매핑)
- 구조:
  ```
  SKU_ID, Group_Name, Member_Name, Album_Version, Card_Title,
  Image_URL, US_Market_Price, JP_Market_Price,
  eBay_Aff_Link, Yahoo_Aff_Link, Condition_Grade, Last_Updated, Album_Cover_URL
  ```
- 용도: Prisma `PhotoCard` 테이블 입력
- 품질: ⭐⭐⭐⭐ (가격 정보 일부 TBA)

---

### 📈 시세 & 거래 데이터

#### 4. **ebay_photocard_posts.json** (9,643건)
- 출처: eBay Browse API (2026-08-12 수집)
- 구조:
  ```json
  {
    "meta": { "platform", "api_used", "marketplace", "collected_at" },
    "items": [
      {
        "item_id", "title", "price", "shipping_cost",
        "condition", "seller", "seller_feedback",
        "image_url", "keyword", "keyword_group", "url"
      }
    ]
  }
  ```
- 용도: `PhotoCard.estimatedPrice`, `PriceHistory` 입력
- 활용: 약 2,500건이 poca_master_db와 매칭 가능
- 품질: ⭐⭐⭐⭐⭐ (실시간 거래 데이터)
- 주의: eBay URL은 URL drift 가능성 있음 (별도 호스팅 추천)

#### 5. **naver_photocard_posts.json** (6,707건)
- 출처: Naver (블로그, 카페, 지식iN, 뉴스) 크롤링
- 구조:
  ```json
  {
    "id", "service", "keyword", "title", "description",
    "url", "author", "collected_at", "posted_date"
  }
  ```
- 용도: 거래·보관 니즈 분석 (정성 참고)
- 활용: MVP에서는 미통합 (P2에서 sentiment 분석 고려)
- 품질: ⭐⭐⭐ (텍스트 기반, 구조화 필요)

#### 6. **bluesky_kpop_photocards_large.csv** (2,372건)
- 출처: Bluesky (SNS) 크롤링
- 구조: keyword, created_at, author_handle, text, like_count, repost_count, post_uri
- 용도: 글로벌 커뮤니티 소통 신호 분석
- 품질: ⭐⭐ (64% K-POP, 36% 노이즈)

---

### 📋 보조 데이터

#### 7. **global_photocard_stats.json** (19.9KB)
- 출처: analyze_global_photocard.py 분석 결과
- 내용: 5개 플랫폼 통합 통계
- 활용: 시장 리서치, 프로덕트 방향 설정

#### 8. **global_photocard_final_report.md** (27KB)
- 출처: 최종 분석 보고서
- 내용:
  - 5개 플랫폼 19,386건 유저 니즈 분석
  - 수집축(자랑) vs 거래축 비중 비교
  - eBay/Naver 세분화 분석
- 활용: **기획 근거, 의사결정 레퍼런스**

---

### 🗑 기타 CSV (정리됨)

| 파일 | 상태 | 이유 |
|---|---|---|
| biasroom_individual_photocards.csv | 정보성 | Biasroom 개별 카드 (detail 수준 높음) |
| biasroom_photocards_detailed.csv | 정보성 | 위와 중복 |
| group_members_*.csv | 정리용 | 임시 작업 파일 |
| tumblr_kpop_photocards.csv | 참고용 | Tumblr 데이터 (604건, 커버리지 낮음) |

---

## 🔧 DB Seed 시나리오

### **최적 경로** (1시간 30분)

```
[1] poca_master_db_mb.csv → Group/Album/PhotoCard 입력
    └─ 3,860건 기본 데이터 + 멤버/앨범 관계

[2] biasroom_groups_master.csv → Group 보강
    └─ 그룹 이미지, 한글명, 별칭 추가

[3] eBay 가격 병합
    └─ Group_Name 기준 LEFT JOIN
    └─ estimatedPrice 채우기 (~2,500건)
    └─ PriceHistory 타임스탐프 입력

[4] 통계 계산 (SQL)
    └─ haveCount/wantCount 집계
```

### **결과**

- ✅ Group: 931개
- ✅ Album: ~1,500개
- ✅ PhotoCard: 3,860개
- ✅ PriceHistory: ~2,500건
- ✅ Wiki, Vault 초기 데이터 완성

---

## 📊 데이터 품질 주석

**eBay (신뢰도 높음)**
- ✅ 실시간 거래 데이터
- ✅ 가격, 배송비 정확도 높음
- ⚠️ 이미지 URL 만료 가능성 (라이선스 고려)

**Biasroom (신뢰도 매우 높음)**
- ✅ 메타데이터 정확도 우수
- ✅ 앨범 버전 완전성 높음
- ⚠️ Album_Count/Version_Count는 추정치

**poca_master_db (신뢰도 중상)**
- ✅ SKU 조직화 우수
- ⚠️ Member_Name = "Unknown" 많음 (70% 이상)
- ⚠️ 일부 가격 TBA (0.00 = 미가격)

**Naver (신뢰도 중)**
- ✅ 실제 유저 수요 반영
- ⚠️ 시드 키워드 편향 있음 (5개 키워드 균등 수집)
- ⚠️ 텍스트 기반 (정량 분석 필요)

---

## 🔄 데이터 업데이트 주기

| 데이터 | 주기 | 담당 |
|---|---|---|
| eBay 시세 | 주 1회 | `scripts/collect_ebay_data.py` |
| Naver 커뮤니티 | 월 1회 | `scripts/analyze_global_photocard.py` |
| Biasroom 마스터 | 수동 | 필요 시 다운로드 |

---

## 💾 파일 크기 & 로드 시간

```
biasroom_groups_master.csv           ~40KB   (빠름)
biasroom_photocards_master.csv      1.36MB   (중간)
poca_master_db_mb.csv               1.24MB   (중간)
ebay_photocard_posts.json           8.9MB    (느림, 압축 권장)
naver_photocard_posts.json          4.8MB    (중간)
bluesky_kpop_photocards_large.csv   732KB    (빠름)
```

**권장**: eBay JSON은 `.gz` 압축 저장 (→ 1.5MB)

---

## 🎯 다음 단계

1. **[필수]** DB Seed 작업 (poca_master_db_mb.csv 우선)
2. **[권장]** eBay 가격 병합 (estimatedPrice 입력)
3. **[선택]** Naver 감정 분석 (P2)
4. **[참고]** global_photocard_final_report.md 검토

---

**Last Updated**: 2026-08-12
