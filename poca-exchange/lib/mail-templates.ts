/**
 * Email templates for transactional notifications
 */

export interface EmailTemplateData {
  recipientName: string;
  recipientEmail: string;
  [key: string]: any;
}

// ============================================================================
// 1. Contribution Approved Email
// ============================================================================

export function contributionApprovedTemplate(data: {
  recipientName: string;
  recipientEmail: string;
  cardMemberName: string;
  cardGroupName: string;
  rewardXp: number;
  newTotalXp: number;
}): { subject: string; html: string } {
  return {
    subject: `[StanPC] 📸 ${data.cardMemberName} 포토카드 이미지 채택됨! (${data.rewardXp} XP 지급)`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
            .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; }
            .content { padding: 40px 20px; }
            .success-box { background: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; border-radius: 8px; margin-bottom: 20px; }
            .success-box p { margin: 0; color: #047857; font-size: 14px; }
            .stat { display: inline-block; background: #f3f4f6; padding: 12px 16px; border-radius: 8px; margin: 8px 8px 8px 0; }
            .stat-label { font-size: 12px; color: #6b7280; }
            .stat-value { font-size: 20px; font-weight: bold; color: #1f2937; }
            .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 축하합니다!</h1>
              <p>포토카드 이미지가 도감에 채택되었습니다</p>
            </div>

            <div class="content">
              <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px;">
                안녕하세요, <strong>${data.recipientName}</strong>님!
              </p>

              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                <strong>${data.cardGroupName}</strong>의 <strong>${data.cardMemberName}</strong> 포토카드 이미지가 StanPC 도감에 정식으로 채택되었습니다.
              </p>

              <div class="success-box">
                <p>✅ <strong>${data.rewardXp} XP</strong>를 획득하셨습니다!</p>
              </div>

              <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0 0 12px 0; font-size: 12px; color: #0369a1; font-weight: bold;">📊 XP 현황</p>
                <div>
                  <div class="stat">
                    <div class="stat-label">획득 XP</div>
                    <div class="stat-value" style="color: #10b981;">${data.rewardXp}</div>
                  </div>
                  <div class="stat">
                    <div class="stat-label">누적 XP</div>
                    <div class="stat-value">${data.newTotalXp}</div>
                  </div>
                </div>
              </div>

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                계속해서 더 많은 포토카드 이미지를 제보해주세요. 더 많은 기여자들이 StanPC 도감을 완성하는 데 도움이 됩니다!
              </p>

              <a href="https://stanpc.com/gallery/contribute" class="cta-button">📸 더 많은 이미지 제보하기</a>
            </div>

            <div class="footer">
              <p style="margin: 0;">© 2026 StanPC. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

// ============================================================================
// 2. Trade Offer Email
// ============================================================================

export function tradeOfferTemplate(data: {
  recipientName: string;
  recipientEmail: string;
  offererName: string;
  cardCount: number;
  offerUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `[StanPC] 🤝 ${data.offererName}님에게서 교환 제안이 도착했습니다!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 40px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
            .content { padding: 40px 20px; }
            .offer-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin-bottom: 20px; }
            .cta-button { display: inline-block; background: #f5576c; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🤝 교환 제안</h1>
              <p>Someone is interested in your listing!</p>
            </div>

            <div class="content">
              <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px;">
                안녕하세요, <strong>${data.recipientName}</strong>님!
              </p>

              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                <strong>${data.offererName}</strong>님이 <strong>${data.cardCount}장의 포토카드</strong>로 교환을 제안했습니다!
              </p>

              <div class="offer-box">
                <p style="margin: 0; color: #92400e; font-weight: bold;">⚡ 신청자 정보</p>
                <p style="margin: 8px 0 0 0; color: #92400e; font-size: 14px;">
                  닉네임: <strong>${data.offererName}</strong>
                </p>
              </div>

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                제안 내용을 확인하고 수락/거절 할 수 있습니다.
              </p>

              <a href="${data.offerUrl}" class="cta-button">🔄 제안 확인하기</a>
            </div>

            <div class="footer">
              <p style="margin: 0;">© 2026 StanPC. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

// ============================================================================
// 3. Price Match Alert Email
// ============================================================================

export function priceMatchAlertTemplate(data: {
  recipientName: string;
  recipientEmail: string;
  cardMemberName: string;
  cardGroupName: string;
  priceUsd: number;
  targetPrice: number;
  cardUrl: string;
}): { subject: string; html: string } {
  const savingsPercent = Math.round(
    ((data.targetPrice - data.priceUsd) / data.targetPrice) * 100
  );

  return {
    subject: `[StanPC] 💰 찾던 포카가 나타났습니다! ${data.cardGroupName} ${data.cardMemberName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
            .content { padding: 40px 20px; }
            .price-box { background: #ecfdf5; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .price-value { font-size: 32px; font-weight: bold; color: #047857; }
            .price-label { font-size: 12px; color: #047857; margin-top: 4px; }
            .savings-badge { display: inline-block; background: #dc2626; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-top: 8px; }
            .cta-button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💰 가격 알림</h1>
              <p>Your wishlist item just appeared!</p>
            </div>

            <div class="content">
              <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px;">
                안녕하세요, <strong>${data.recipientName}</strong>님!
              </p>

              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                찾고 계셨던 <strong>${data.cardGroupName} ${data.cardMemberName}</strong>이 현재 판매 중입니다!
              </p>

              <div class="price-box">
                <div class="price-value">$${data.priceUsd.toFixed(2)}</div>
                <div class="price-label">현재 가격</div>
                ${savingsPercent > 0 ? `<div class="savings-badge">💸 ${savingsPercent}% 할인!</div>` : ''}
              </div>

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                지금 바로 확인하고 구매하세요. 인기 포카는 빠르게 판매됩니다!
              </p>

              <a href="${data.cardUrl}" class="cta-button">🔍 포카 상세 보기</a>
            </div>

            <div class="footer">
              <p style="margin: 0;">© 2026 StanPC. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}
