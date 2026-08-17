import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0F0F12 0%, #1a1a1f 100%)',
          padding: '60px',
          fontFamily: 'system-ui',
        }}
      >
        {/* Background grid effect */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            opacity: 0.1,
            backgroundImage: 'radial-gradient(circle, #3B82F6 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            zIndex: 1,
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: '120px',
              height: '120px',
              background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '40px',
              boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)',
              border: '2px solid #3B82F6',
            }}
          >
            <div
              style={{
                fontSize: '60px',
                fontWeight: 'bold',
                color: '#93C5FD',
              }}
            >
              ✨
            </div>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 20px 0',
              lineHeight: '1.2',
            }}
          >
            StanPC
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '36px',
              color: '#93C5FD',
              margin: '0 0 40px 0',
              fontWeight: '500',
            }}
          >
            K-pop 포토카드 도감 & 거래
          </p>

          {/* Description */}
          <div
            style={{
              fontSize: '20px',
              color: '#D1D5DB',
              maxWidth: '800px',
              lineHeight: '1.6',
            }}
          >
            <p style={{ margin: '0' }}>
              10개 그룹의 모든 포토카드를 한 곳에서 관리하고,
            </p>
            <p style={{ margin: '10px 0 0 0' }}>
              AI 스캔으로 컬렉션을 정리하고, 다른 덕후들과 교환하세요 🎯
            </p>
          </div>

          {/* Features */}
          <div
            style={{
              display: 'flex',
              gap: '40px',
              marginTop: '50px',
              fontSize: '18px',
              color: '#9CA3AF',
            }}
          >
            <div>📦 도감 관리</div>
            <div>🤖 AI 스캔</div>
            <div>🤝 1:1 교환</div>
          </div>
        </div>

        {/* Footer branding */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '60px',
            fontSize: '18px',
            color: '#6B7280',
            fontWeight: '500',
          }}
        >
          stanpc.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
