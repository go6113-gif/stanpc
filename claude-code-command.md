# StanPC 프론트페이지 개편 — Claude Code 실행 명령

## 배경
이전 시도에서 디자인 토큰 없이 "노마드리스트 스타일로 만들어줘"라고만 지시했더니
색상·radius·폰트를 임의로 해석해서 결과물이 일관성 없었음.
이번에는 `design-tokens.css`(첨부)에 정의된 값만 사용하고,
**여기 없는 색상/radius/폰트/간격 값을 새로 만드는 것을 금지**한다.

**모바일 우선순위: StanPC는 모바일 노출 비중이 더 높다. 데스크톱을 먼저 만들고
모바일을 나중에 축소 적용하는 방식 금지. 모바일 브레이크포인트(`@media (max-width: 480px)`)를
데스크톱과 동시에, 동일한 우선순위로 구현할 것.**

---

## 1. 디자인 토큰 적용 (전면)

- 첨부된 `design-tokens.css`를 프로젝트에 그대로 추가 (경로: 기존 global css 옆)
- 기존에 하드코딩된 색상·radius·폰트 값을 전부 이 토큰의 CSS 변수로 치환
- 새로운 컬러/radius/폰트 값이 필요하다고 판단되면 **임의로 만들지 말고 먼저 질문할 것**

### 컴포넌트별 적용 규칙
| 요소 | 적용 클래스/토큰 |
|---|---|
| 갤러리 카드 | `.card` (radius 12px, box-shadow 테두리 방식) |
| 메인 CTA / 필터 토글 버튼 | `.btn-primary` (red 필 버튼, radius 50px) |
| 보조 액션(수정/내보내기 등) | `.btn-text` (배경 없는 red 텍스트 링크) |
| 검색창 | `.search-input` (radius 50px) |
| 필터 칩 비활성 | `.chip` (흰 배경, 검정 텍스트) |
| 필터 칩 활성 | `.chip.active` (red 배경, 흰 텍스트) — **색상만 바뀌고 radius/padding/font-weight는 비활성과 동일하게 유지** |

---

## 2. P0 필터 2종 추가

갤러리/도감 페이지에 아래 필터를 추가하고 백엔드 쿼리를 연동한다.

### ① 카드 상태/등급 (Card Condition)
- 위치: 가격대 필터 바로 옆 행
- UI: `.chip` 스타일 알약형 뱃지, 단일 선택
- 옵션: `전체`, `미개봉 (Sealed)`, `근민트 (NM / 하자 없음)`, `경미한 하자 (LP / 공장 하자)`, `중/심각한 하자 (MP/HP)`
- 상태 저장: `selectedCondition` (string)
- API 파라미터: `condition={selectedCondition}`

### ② My Vault 통합 필터 (My Collection / Trade Matching)
- 위치: 정렬 영역 하단 별도 행
- UI: `.chip` 스타일, 다중 선택 가능
- 옵션: `내 보유 카드 (In Vault)`, `구하는 카드 (ISO)`, `교환 가능 (For Trade)`, `위시리스트 (Wishlist)`
- 상태 저장: `selectedVaultStatus` (array of strings)
- API 파라미터: `vaultStatus={selectedVaultStatus.join(',')}`
- 미인증 예외 처리: 비로그인 사용자가 클릭 시 `VaultAuthModal` 오픈

### 백엔드 연동
- `/api/gallery` 또는 `/api/wiki/cards`에서 `condition`, `vaultStatus` 쿼리 파라미터 처리 및 필터링 로직 구현

---

## 3. 모바일 반응형 (실기기 실측 기반 — 임의 축소 금지)

노마드리스트 실기기 스크린샷 실측 결과, 모바일은 "1열로 단순화"가 아니라
**컬럼 수만 화면 폭에 맞게 재계산해서 밀도를 유지**하는 방식이다.
아래 규칙은 `design-tokens.css`의 `@media (max-width: 480px)` 블록에 이미 정의되어 있으니
그 값을 그대로 쓰고, 별도로 새 반응형 규칙을 만들지 말 것.

| 요소 | 모바일 규칙 | 금지 사항 |
|---|---|---|
| 갤러리 카드 그리드 | **2열 그리드 유지** (`.gallery-grid`) | 1열 스택 금지 |
| 필터 패널 | Filters 버튼 아래 **드롭다운**으로 전환, 상단에 전체너비 CTA 고정 (`.filter-panel`) | 하단 시트(bottom sheet) 금지 |
| 필터 칩 컬럼 수 | 라벨 짧으면 3~4열, 길면 2열 (`.chip-group--short` / `.chip-group--long`) | 전부 1열 세로나열 금지 |
| My Vault 프로필 액션 버튼 | 주요 액션 2개(예: 팔로우/찜)만 나란히, 나머지는 전체너비 세로 스택 (`.profile-actions-primary` / `.profile-actions-secondary`) | 모든 버튼 동일 취급 금지 |
| 프로필 히어로 배너 | 모바일에서도 **축소하지 않고 그대로 유지** | 배너 높이 줄이기 금지 |

### 적용 대상
- 갤러리/도감 페이지 (1번의 카드 그리드)
- 2번에서 추가한 Card Condition / My Vault 필터 칩 2종 — 이 필터들도 위 컬럼 규칙 적용 대상
- My Vault(프로필) 페이지 액션 버튼 영역

---

## 4. 구현 체크리스트

- [ ] `design-tokens.css` 적용, 기존 하드코딩 값 전부 치환 (데스크톱)
- [ ] `design-tokens.css`의 모바일 미디어쿼리 블록 적용 (모바일, 데스크톱과 동시 작업)
- [ ] Card Condition 필터 UI + 상태 관리 (데스크톱/모바일 컬럼 규칙 각각 적용)
- [ ] My Vault 필터 UI + 상태 관리 + VaultAuthModal 연동 (데스크톱/모바일)
- [ ] API 쿼리 파라미터 연동 (조건 변경 시 fetch)
- [ ] 백엔드 필터링 로직 (`condition`, `vaultStatus`)
- [ ] 갤러리 카드 그리드 모바일 2열 확인
- [ ] 프로필 액션 버튼 모바일 그룹핑(2개 나란히 + 나머지 스택) 확인

## 5. 완료 기준

1. `npm run build` 검증 (빌드 에러 없음)
2. 필터 선택/해제 동작 테스트, Network 탭에서 파라미터 전달 확인
3. 비로그인 상태에서 My Vault 필터 클릭 → VaultAuthModal 오픈 확인
4. **데스크톱 스크린샷 2장**: (a) 필터 미선택 기본 상태 (b) 필터 선택 상태 (Card Condition="근민트", My Vault="내 보유 카드"+"구하는 카드")
5. **모바일(390~480px) 스크린샷 2장**: (a) 갤러리 카드 2열 그리드 (b) 필터 패널 오픈 상태 — 브라우저 개발자도구 반응형 모드(`Ctrl/Cmd+Shift+M`)로 확인

**중요: 토큰 파일에 없는 디자인 값을 새로 만들지 말 것. 애매하면 질문할 것.**
**모바일을 나중에 손보는 것이 아니라 데스크톱과 같은 우선순위로 처음부터 같이 구현할 것.**
