"use client";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 relative overflow-hidden">
      {/* Декоративный фон (на мобильных делаем его менее навязчивым) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[300px] sm:h-[500px] w-[300px] sm:w-[500px] rounded-full bg-indigo-500/5 blur-[100px] sm:blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-[300px] sm:h-[500px] w-[300px] sm:w-[500px] rounded-full bg-purple-500/5 blur-[100px] sm:blur-[120px]" />
      </div>
      
      {/* Контент с безопасными отступами (safe-area для iPhone с "бровью") */}
      <main 
        className="flex-1 relative w-full mx-auto px-4 sm:px-6 lg:px-8 pb-10"
        style={{
          paddingTop: "max(1.5rem, env(safe-area-inset-top))",
          paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
        }}
      >
        {children}
      </main>
    </div>
  );
}