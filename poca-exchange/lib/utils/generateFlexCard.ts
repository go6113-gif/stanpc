import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

export interface FlexCardConfig {
  userNickname: string;
  collectionCompletion: number; // 0-100
  topGroup?: string; // 주요 그룹 (예: "뉴진스")
  topMember?: string; // 주요 멤버 (예: "하니")
  cardImages: string[]; // 최대 9개의 포카 이미지 URL
  referralCode: string;
  theme?: 'hologram' | 'neon' | 'dark';
  badgeText?: string;
}

/**
 * 9:16 인스타그램 스토리 비율의 고해상도 Flex 카드 생성
 * html2canvas를 사용하여 DOM을 캔버스로 변환
 */
export async function generateFlexCard(config: FlexCardConfig): Promise<Blob> {
  const container = document.createElement('div');
  container.id = 'flex-card-container';
  container.style.cssText = `
    position: fixed;
    top: -9999px;
    left: -9999px;
    width: 720px;
    height: 1280px;
    background: linear-gradient(135deg, #0f0f12 0%, #1a1a2e 50%, #16213e 100%);
    padding: 40px;
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow: hidden;
  `;

  // 홀로그램 배경 효과
  const backgroundGradient = document.createElement('div');
  backgroundGradient.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background:
      radial-gradient(circle at 20% 50%, rgba(255, 0, 127, 0.2) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(0, 255, 200, 0.2) 0%, transparent 50%),
      linear-gradient(135deg, #0f0f12 0%, #1a1a2e 50%, #16213e 100%);
    pointer-events: none;
  `;
  container.appendChild(backgroundGradient);

  // 메인 콘텐츠 래퍼
  const content = document.createElement('div');
  content.style.cssText = `
    position: relative;
    z-index: 10;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: white;
  `;

  // 1. 헤더 섹션
  const header = document.createElement('div');
  header.style.cssText = `
    text-align: center;
    margin-bottom: 20px;
  `;

  const titleEl = document.createElement('h1');
  titleEl.textContent = '내 포토카드 컬렉션';
  titleEl.style.cssText = `
    margin: 0 0 10px 0;
    font-size: 32px;
    font-weight: bold;
    background: linear-gradient(90deg, #FF1493, #00FFFF);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  `;
  header.appendChild(titleEl);

  const nicknameEl = document.createElement('p');
  nicknameEl.textContent = config.userNickname;
  nicknameEl.style.cssText = `
    margin: 0;
    font-size: 18px;
    color: #aaa;
    font-weight: 500;
  `;
  header.appendChild(nicknameEl);

  content.appendChild(header);

  // 2. 카드 그리드 섹션 (4장 또는 9장)
  const gridWrapper = document.createElement('div');
  gridWrapper.style.cssText = `
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 20px 0;
  `;

  const gridLayout = config.cardImages.length > 4 ? 3 : 2; // 9장 또는 4장
  const grid = document.createElement('div');
  grid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(${gridLayout}, 1fr);
    gap: 12px;
    width: 100%;
  `;

  config.cardImages.slice(0, gridLayout === 3 ? 9 : 4).forEach((imgUrl) => {
    const cardEl = document.createElement('div');
    cardEl.style.cssText = `
      aspect-ratio: 56 / 87;
      border-radius: 8px;
      overflow: hidden;
      border: 2px solid rgba(255, 20, 147, 0.3);
      box-shadow: 0 8px 32px rgba(0, 255, 200, 0.1);
      background: linear-gradient(135deg, rgba(255,0,127,0.1), rgba(0,255,200,0.1));
    `;

    const img = document.createElement('img');
    img.src = imgUrl;
    img.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
    `;

    cardEl.appendChild(img);
    grid.appendChild(cardEl);
  });

  gridWrapper.appendChild(grid);
  content.appendChild(gridWrapper);

  // 3. 통계 섹션
  const stats = document.createElement('div');
  stats.style.cssText = `
    display: flex;
    justify-content: space-around;
    align-items: center;
    margin: 20px 0;
    padding: 16px;
    background: rgba(255, 20, 147, 0.05);
    border-radius: 12px;
    border-left: 3px solid #FF1493;
  `;

  // 완성도 게이지
  const completionBox = document.createElement('div');
  completionBox.style.cssText = `
    text-align: center;
  `;

  const completionLabel = document.createElement('p');
  completionLabel.textContent = '완성도';
  completionLabel.style.cssText = `
    margin: 0 0 8px 0;
    font-size: 12px;
    color: #aaa;
    text-transform: uppercase;
  `;
  completionBox.appendChild(completionLabel);

  const completionValue = document.createElement('p');
  completionValue.textContent = `${config.collectionCompletion}%`;
  completionValue.style.cssText = `
    margin: 0;
    font-size: 24px;
    font-weight: bold;
    color: #00FFFF;
  `;
  completionBox.appendChild(completionValue);

  stats.appendChild(completionBox);

  // 배지
  if (config.badgeText) {
    const badgeBox = document.createElement('div');
    badgeBox.style.cssText = `
      text-align: center;
    `;

    const badgeLabel = document.createElement('p');
    badgeLabel.textContent = '뱃지';
    badgeLabel.style.cssText = `
      margin: 0 0 8px 0;
      font-size: 12px;
      color: #aaa;
      text-transform: uppercase;
    `;
    badgeBox.appendChild(badgeLabel);

    const badgeValue = document.createElement('p');
    badgeValue.textContent = config.badgeText;
    badgeValue.style.cssText = `
      margin: 0;
      font-size: 14px;
      font-weight: bold;
      color: #FFD700;
    `;
    badgeBox.appendChild(badgeValue);

    stats.appendChild(badgeBox);
  }

  content.appendChild(stats);

  // 4. 하단 QR + 링크 섹션
  const footer = document.createElement('div');
  footer.style.cssText = `
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 20, 147, 0.2);
  `;

  // QR 코드 생성 및 삽입
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(
    qrCanvas,
    `https://stanpc.com/ref/${config.referralCode}`,
    { width: 100, margin: 1, color: { dark: '#00FFFF', light: '#0f0f12' } }
  );

  const qrContainer = document.createElement('div');
  qrContainer.style.cssText = `
    width: 100px;
    height: 100px;
    border: 2px solid #00FFFF;
    border-radius: 8px;
    padding: 4px;
    background: #0f0f12;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  qrContainer.appendChild(qrCanvas);

  footer.appendChild(qrContainer);

  // 텍스트 섹션
  const footerText = document.createElement('div');
  footerText.style.cssText = `
    flex: 1;
    margin-left: 20px;
  `;

  const cta = document.createElement('p');
  cta.textContent = '내 컬렉션 구경하기! 📸';
  cta.style.cssText = `
    margin: 0 0 8px 0;
    font-size: 14px;
    font-weight: 600;
    color: #00FFFF;
  `;
  footerText.appendChild(cta);

  const urlEl = document.createElement('p');
  urlEl.textContent = `stanpc.com/ref/${config.referralCode}`;
  urlEl.style.cssText = `
    margin: 0;
    font-size: 11px;
    color: #888;
    word-break: break-all;
  `;
  footerText.appendChild(urlEl);

  footer.appendChild(footerText);

  content.appendChild(footer);
  container.appendChild(content);

  // DOM에 임시로 추가
  document.body.appendChild(container);

  try {
    // html2canvas로 이미지 생성
    const canvas = await html2canvas(container, {
      width: 720,
      height: 1280,
      scale: 2, // 고해상도
      useCORS: true,
      backgroundColor: null,
    });

    // Blob으로 변환
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/png',
        1.0
      );
    });
  } finally {
    // 정리
    document.body.removeChild(container);
  }
}

/**
 * Flex 카드 이미지 다운로드
 */
export async function downloadFlexCard(blob: Blob, filename: string = 'flex-card.png'): Promise<void> {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 웹 공유 API로 인스타그램 스토리에 공유
 */
export async function shareFlexCardToStory(blob: Blob, userNickname: string): Promise<void> {
  if (!navigator.share) {
    console.warn('Web Share API not supported');
    return;
  }

  const file = new File([blob], 'flex-card.png', { type: 'image/png' });

  try {
    await navigator.share({
      files: [file],
      title: `${userNickname}의 포토카드 컬렉션`,
      text: `내 덕력을 자랑해봐! 🌟 StanPC에서 나도 공유하기 👉 https://stanpc.com`,
    });
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      console.error('Share failed:', err);
    }
  }
}
