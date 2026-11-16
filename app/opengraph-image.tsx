// app/opengraph-image.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Promptchek — платформа точных AI-промптов';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
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
          backgroundColor: '#020617',
          backgroundImage: 'radial-gradient(circle at 50% 0%, #312e81 0%, transparent 70%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '16px', backgroundColor: '#1e1b4b', border: '1px solid #4c1d95' }}>
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
              <path d="M11 15L17 20L11 25" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19 25H23L28 18" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: '48px', fontWeight: 'bold' }}>Promptchek</span>
        </div>
        
        <h1 style={{ fontSize: '64px', fontWeight: 'bold', textAlign: 'center', margin: 0, maxWidth: '900px', lineHeight: 1.1 }}>
          Промпты, которые дают <br />
          <span style={{ backgroundImage: 'linear-gradient(to right, #818cf8, #c084fc)', backgroundClip: 'text', color: 'transparent' }}>
            предсказуемый результат
          </span>
        </h1>
        
        <p style={{ fontSize: '28px', color: '#94a3b8', marginTop: '24px' }}>
          Оценка по 12 критериям • Улучшение за 1 клик
        </p>
      </div>
    ),
    { ...size }
  );
}