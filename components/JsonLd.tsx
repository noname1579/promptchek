// components/JsonLd.tsx
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  // Заменяем < на \u003c для защиты от XSS (стандартная практика)
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}