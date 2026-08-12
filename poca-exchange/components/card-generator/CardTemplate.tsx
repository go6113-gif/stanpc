'use client';

import { forwardRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { CARD_SIZES, CARD_LAYOUT, type CardSize } from '@/lib/card-generator/cardSizes';

export interface CardTemplateProps {
  size: CardSize;
  memberName: string;
  title: string;
  stats: Record<string, string | number>;
  shareUrl: string;
}

interface CardTemplateHandle {
  element: HTMLDivElement | null;
}

const CardTemplate = forwardRef<CardTemplateHandle, CardTemplateProps>(
  ({ size, memberName, title, stats, shareUrl }, ref) => {
    const cardSize = CARD_SIZES[size];
    const isMobile = size === 'vertical';

    // QR 코드 생성 및 삽입
    useEffect(() => {
      const generateQRCode = async () => {
        let element = (ref as any)?.current?.element;
        if (!element) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return;
        }

        const placeholder = element.querySelector(
          'img[data-qrcode-placeholder="true"]'
        ) as HTMLImageElement | null;

        if (!placeholder) return;

        try {
          const qrDataUrl = await QRCode.toDataURL(shareUrl, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            quality: 0.95,
            margin: 1,
            width: 512,
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
          });

          placeholder.src = qrDataUrl;
          placeholder.alt = 'Share QR Code';
        } catch (error) {
          console.error('Failed to generate QR code:', error);
        }
      };

      generateQRCode();
    }, [shareUrl, ref]);

    const qrPlaceholder = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${CARD_LAYOUT.qrCode.size}' height='${CARD_LAYOUT.qrCode.size}'%3E%3Crect fill='white' width='${CARD_LAYOUT.qrCode.size}' height='${CARD_LAYOUT.qrCode.size}'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='monospace' font-size='12' fill='%23999'%3EQR%3C/text%3E%3C/svg%3E`;

    return (
      <div
        ref={(el) => {
          if (ref) {
            (ref as any).current = { element: el };
          }
        }}
        style={{
          width: `${cardSize.width}px`,
          height: `${cardSize.height}px`,
          backgroundColor: '#ffffff',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            height: `${CARD_LAYOUT.header.height}px`,
            backgroundColor: '#f9fafb',
            borderBottomColor: '#e5e7eb',
            borderBottomStyle: 'solid',
            borderBottomWidth: '1px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>
            stanpc
          </h1>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
            포토카드 수집 커뮤니티
          </p>
        </div>

        {/* Main Content */}
        <div
          style={{
            flex: 1,
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: `${CARD_LAYOUT.padding}px`,
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {/* Background Graphics */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.05,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '40px',
                left: '40px',
                width: '128px',
                height: '128px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '40px',
                right: '40px',
                width: '160px',
                height: '160px',
                borderRadius: '50%',
                backgroundColor: '#ec4899',
              }}
            />
          </div>

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 10 }}>
            <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', margin: '0 0 16px 0' }}>
              {memberName}
            </h2>
            <h3 style={{ fontSize: '24px', color: '#2563eb', fontWeight: '600', margin: '0 0 32px 0' }}>
              {title}
            </h3>

            {/* Stats */}
            {Object.keys(stats).length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile
                    ? 'repeat(2, 1fr)'
                    : Object.keys(stats).length <= 2
                      ? 'repeat(2, 1fr)'
                      : 'repeat(3, 1fr)',
                  gap: '16px',
                  marginBottom: '32px',
                  maxWidth: '600px',
                }}
              >
                {Object.entries(stats).map(([key, value]) => (
                  <div
                    key={key}
                    style={{
                      borderRadius: '8px',
                      backgroundColor: '#eff6ff',
                      padding: '16px',
                    }}
                  >
                    <p
                      style={{
                        fontSize: '12px',
                        color: '#4b5563',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        margin: '0 0 8px 0',
                      }}
                    >
                      {key}
                    </p>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            height: `${CARD_LAYOUT.footer.height}px`,
            backgroundColor: '#f3f4f6',
            borderTopColor: '#e5e7eb',
            borderTopStyle: 'solid',
            borderTopWidth: '1px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `0 ${CARD_LAYOUT.padding}px`,
          }}
        >
          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: '0 0 4px 0' }}>
              stanpc.com
            </p>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
              K-pop 포토카드 커뮤니티
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={qrPlaceholder}
              alt="Share QR Code"
              style={{
                width: `${CARD_LAYOUT.qrCode.size}px`,
                height: `${CARD_LAYOUT.qrCode.size}px`,
                border: '1px solid #d1d5db',
                borderRadius: '4px',
              }}
              data-qrcode-placeholder="true"
            />
          </div>
        </div>
      </div>
    );
  }
);

CardTemplate.displayName = 'CardTemplate';

export default CardTemplate;
