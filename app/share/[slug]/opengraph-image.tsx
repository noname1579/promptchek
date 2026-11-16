// app/share/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og';
import { readSharedPrompt } from "@/lib/share-store";
import { scorePrompt } from "@/lib/scoring";

export const runtime = 'edge';
export const alt = 'Promptchek — улучшенный промпт';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
  const data = await readSharedPrompt(params.slug);
  
  if (!data) {
    return new ImageResponse(
      (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#020617' }}>
          <span style={{ color: 'white', fontSize: 40 }}>Промпт не найден</span>
        </div>
      ),
      { ...size }
    );
  }

  const score = scorePrompt(data.prompt, data.mode as any).score;
  const previewText = data.prompt.length > 200 ? data.prompt.slice(0, 200) + '...' : data.prompt;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#020617',
          backgroundImage: 'radial-gradient(circle at 50% -20%, #312e81 0%, transparent 60%)',
          padding: '60px',
          fontFamily: 'sans-serif',
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#1e1b4b', border: '1px solid #4c1d95' }}>
              <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
                <path d="M11 15L17 20L11 25" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 25H23L28 18" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontSize: '28px', fontWeight: 'bold' }}>Promptchek</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '8px 16px', borderRadius: '12px', color: '#34d399', fontWeight: 'bold', fontSize: '24px' }}>
            Оценка {score}/100
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', borderRadius: '24px', border: '1px solid rgba(51, 65, 85, 0.5)', padding: '40px' }}>
          <span style={{ fontSize: '16px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }}>Улучшенный промпт</span>
          <p style={{ fontSize: '32px', lineHeight: 1.4, color: '#e2e8f0', margin: 0 }}>
            «{previewText}»
          </p>
        </div>
      </div>
    ),
    { ...size }
  );
}