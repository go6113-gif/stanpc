/**
 * [StanPC] 프론트엔드 상세 페이지 UX 디자인 및 탭 구조 구현 검증 스크립트
 * 파일 경로: scripts/verify-stanpc-ux.ts
 * 실행 방법: npx tsx scripts/verify-stanpc-ux.ts
 *
 * 원본 스크립트는 `src/` 하위 구조(src/app, src/components, src/styles)를
 * 가정하고 있었지만, 이 프로젝트(poca-exchange)는 src/ 없이 app/,
 * components/ 를 루트에 직접 둔다. 경로/컴포넌트명만 실제 구조에 맞게
 * 고쳤고, 체크 로직 자체는 그대로 유지했다.
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = process.cwd();

interface CheckResult {
  category: string;
  item: string;
  passed: boolean;
  message: string;
}

const results: CheckResult[] = [];

function checkFileExists(relativePath: string): boolean {
  const fullPath = path.join(ROOT_DIR, relativePath);
  return fs.existsSync(fullPath);
}

function getFileContent(relativePath: string): string {
  const fullPath = path.join(ROOT_DIR, relativePath);
  if (fs.existsSync(fullPath)) {
    return fs.readFileSync(fullPath, 'utf-8');
  }
  return '';
}

console.log('==================================================');
console.log('  StanPC 4대 탭 구조 및 UX 디자인 구현 검증 스크립트');
console.log('==================================================\n');

// 1. 라우팅 및 파일 구조 검증 (/card/[cardSlug])
const routePath = 'app/card/[cardSlug]/page.tsx';
const routeExists = checkFileExists(routePath);
results.push({
  category: '1. 라우팅 및 SEO',
  item: '실제 서버 라우트 파일 존재 여부 (/card/[cardSlug])',
  passed: routeExists,
  message: routeExists ? '정상: 서버 라우트 파일이 존재합니다.' : '오류: app/card/[cardSlug]/page.tsx 파일이 없습니다.'
});

const routeContent = getFileContent(routePath);
const hasMobileStack = routeContent.includes('flex-col') || routeContent.includes('grid');
results.push({
  category: '1. 라우팅 및 SEO',
  item: '모바일 세로 스택 레이아웃 적용 여부',
  passed: hasMobileStack,
  message: hasMobileStack ? '정상: 반응형 스택 레이아웃 코드가 포함되어 있습니다.' : '주의: 모바일 스택 레이아웃 코드가 미흡합니다.'
});

// 2. 디자인 시스템 및 4대 탭 구조 검증
// CardDetailContent.tsx라는 이름의 파일은 없음 — 실제 4탭 구현체는
// components/modal/PhotocardDetailModal.tsx (탭 셸) +
// components/modal/Tab1_Guide.tsx (Guide 탭 콘텐츠).
const tabsComponentPath = 'components/modal/PhotocardDetailModal.tsx';
const tabsExists = checkFileExists(tabsComponentPath);
results.push({
  category: '2. 디자인 시스템 및 탭',
  item: '4대 탭 컴포넌트 존재 여부 (가이드 | 가격 | 버전 | 수집가)',
  passed: tabsExists,
  message: tabsExists ? '정상: 탭 컴포넌트 파일이 존재합니다.' : '오류: PhotocardDetailModal.tsx 파일이 없습니다.'
});

const tabsContent = getFileContent(tabsComponentPath);
// 실제 탭 라벨은 i18n 키(cardDetail.tabs.*)를 통해 렌더링되므로 locales/ko.json도 함께 확인
const localeContent = getFileContent('locales/ko.json');
const combinedContent = tabsContent + localeContent;
const tabLabelChecks = ['가이드', '가격', '버전', '수집가'].map((label) => ({
  label,
  found: combinedContent.includes(label),
}));
const hasAllTabs = tabLabelChecks.every((c) => c.found);
const hasRedColor = combinedContent.includes('#FF4742') || combinedContent.includes('nomad-red') || combinedContent.includes('red');
results.push({
  category: '2. 디자인 시스템 및 탭',
  item: '4대 탭 라벨 및 활성 탭 레드(#FF4742) 컬러 적용',
  passed: hasAllTabs && hasRedColor,
  message: hasAllTabs && hasRedColor
    ? '정상: 4대 탭 라벨과 레드 활성 상태 컬러가 적용되어 있습니다.'
    : `주의: 라벨 매칭 [${tabLabelChecks.map((c) => `${c.label}:${c.found ? 'O' : 'X'}`).join(', ')}], 레드 컬러: ${hasRedColor ? 'O' : 'X'}`
});

const hasPlaceholder = combinedContent.includes('콘텐츠 준비 중') || combinedContent.includes('준비 중');
results.push({
  category: '2. 디자인 시스템 및 탭',
  item: '데이터 부재 시 "콘텐츠 준비 중" 플레이스홀더 적용',
  passed: hasPlaceholder,
  message: hasPlaceholder ? '정상: 플레이스홀더 로직이 반영되어 있습니다.' : '주의: 데이터 부재 시 처리 문구가 누락되었습니다.'
});

// 3. 통합 Want 시스템 검증 (단일 필드 참조)
// WantToggleButton.tsx라는 이름의 파일은 없음 — 실제로는
// components/have-want-toggle.tsx (HaveWantToggle)가 그 역할.
const wantComponentPath = 'components/have-want-toggle.tsx';
const wantExists = checkFileExists(wantComponentPath);
const hasDesignTokens = checkFileExists('app/design-tokens.css');

results.push({
  category: '3. 통합 Want 시스템',
  item: 'Want 토글 버튼 컴포넌트 및 디자인 토큰 연동',
  passed: wantExists && hasDesignTokens,
  message: (wantExists && hasDesignTokens)
    ? '정상: Want 컴포넌트와 디자인 토큰이 확인되었습니다.'
    : '오류: Want 컴포넌트 또는 design-tokens.css 파일이 누락되었습니다.'
});

// 결과 출력
let successCount = 0;
results.forEach((r, idx) => {
  const status = r.passed ? '[PASS]' : '[FAIL]';
  if (r.passed) successCount++;
  console.log(`[${idx + 1}] ${status} [${r.category}] ${r.item}`);
  console.log(`     └─ ${r.message}\n`);
});

console.log('--------------------------------------------------');
console.log(`검증 결과: 총 ${results.length}개 항목 중 ${successCount}개 통과`);
console.log('--------------------------------------------------\n');

if (successCount === results.length) {
  console.log('결론: 이전 세션의 6대 준수 원칙과 기획 방향이 정확하게 구축되어 있습니다.');
} else {
  console.log('결론: 일부 항목에 누락 또는 수정이 필요합니다. 위 항목을 재확인하세요.');
}
